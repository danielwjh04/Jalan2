import express, { Router } from 'express';
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import type { MenuOrderClipResponse, MenuOrderLanguage, MenuResponse } from '@shared/api';
import type { TextToSpeech } from '../adapters/tts/types';
import { findMenuImagePath, loadCachedMenu, MENU_FIXTURE_SLUG } from '../lib/fixtures';
import { attachDishImages, produceMenu, type MenuDeps } from '../pipeline/menu';
import { createOpenAIDishPhotoVerifier } from '../pipeline/dishPhotoVerifier';
import { textClip, type VoiceDeps } from '../services/voice';
import { createMenu, getMenu, type MenuSourceImage, type StoredMenu } from '../store/menus';
import { menuOrderPhrase } from '../voice/menuOrder';

const MenuRequestSchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.enum(['image/jpeg', 'image/png']),
});

const MenuOrderRequestSchema = z.object({
  dishIndex: z.number().int().nonnegative(),
  lang: z.enum(['ms', 'yue', 'zh']),
});

const DEMO_MENU_ID = 'demo-kopitiam-01';

function toResponse(stored: StoredMenu): MenuResponse {
  return {
    id: stored.id,
    menu: stored.menu,
    servedFrom: stored.servedFrom,
    dishAudio: stored.dishAudio,
    sourceImageUrl: stored.sourceImage ? `/menu/${stored.id}/source` : null,
  };
}

// Mounted before the global 1mb json parser so menu photos get their own
// route-scoped 10mb limit without loosening every other route.
export function menuRouter(deps: MenuDeps, tts: TextToSpeech): Router {
  const router = Router();
  const voice: VoiceDeps = { config: deps.config, tts };

  router.post('/menu', express.json({ limit: '10mb' }), (req, res) => {
    const parsed = MenuRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Body must include imageBase64 and mimeType (jpeg or png)' });
      return;
    }
    void produceMenu(deps, parsed.data.imageBase64, parsed.data.mimeType)
      .then(async ({ menu, servedFrom }) => {
        const source = sourceImage(parsed.data.imageBase64, parsed.data.mimeType);
        res.status(201).json(storeMenu(menu, servedFrom, source));
      })
      .catch((error: Error) => {
        res.status(502).json({ error: error.message });
      });
  });

  router.post('/menu/demo', (_req, res) => {
    const menu = loadCachedMenu();
    const board = findMenuImagePath(MENU_FIXTURE_SLUG, 'menu-board.png');
    if (!menu || !board) {
      res.status(500).json({ error: 'Demo menu fixture is unavailable' });
      return;
    }
    const source: MenuSourceImage = { bytes: readFileSync(board), mimeType: 'image/png' };
    const verifier = deps.openai
      ? createOpenAIDishPhotoVerifier(deps.openai, deps.config.OPENAI_MENU_MODEL)
      : undefined;
    void attachDishImages(deps.foodImages, menu, verifier)
      .then((enriched) => storeMenu(enriched, 'cache', source, DEMO_MENU_ID))
      .then((response) => res.status(201).json(response))
      .catch((error: Error) => res.status(502).json({ error: error.message }));
  });

  router.post('/menu/:id/order-audio', express.json({ limit: '16kb' }), (req, res) => {
    const stored = storedMenu(req.params.id);
    if (!stored) {
      res.status(404).json({ error: `Unknown menu ${req.params.id}` });
      return;
    }
    const parsed = MenuOrderRequestSchema.safeParse(req.body);
    if (!parsed.success || !stored.menu.dishes[parsed.data.dishIndex]) {
      res.status(400).json({ error: 'Body must include a valid dishIndex and lang (ms, yue or zh)' });
      return;
    }
    const dish = stored.menu.dishes[parsed.data.dishIndex];
    const phrase = menuOrderPhrase(dish, parsed.data.lang);
    void textClip(voice, phrase.textLocal, {
      voiceId: orderVoiceId(deps.config, parsed.data.lang),
      languageCode: parsed.data.lang === 'yue' ? 'yue-HK' : undefined,
      voiceName: parsed.data.lang === 'yue' ? deps.config.GOOGLE_CANTONESE_VOICE : undefined,
    }).then((clip) => {
      const response: MenuOrderClipResponse = {
        dishIndex: parsed.data.dishIndex,
        ...phrase,
        synthetic: true,
        audioUrl: clip.audioUrl,
        servedFrom: clip.servedFrom,
      };
      res.json(response);
    }).catch((error: Error) => res.status(502).json({ error: error.message }));
  });

  router.get('/menu/:id/source', (req, res) => {
    const source = storedMenu(req.params.id)?.sourceImage;
    if (!source) {
      res.status(404).json({ error: 'Menu source photo is unavailable' });
      return;
    }
    res.set('Cache-Control', 'private, no-store');
    res.type(source.mimeType).send(source.bytes);
  });

  router.get('/menu/:id', (req, res) => {
    const stored = storedMenu(req.params.id);
    if (!stored) {
      res.status(404).json({ error: `Unknown menu ${req.params.id}` });
      return;
    }
    res.json(toResponse(stored));
  });

  router.get('/menu-images/:slug/:file', (req, res) => {
    const imagePath = findMenuImagePath(req.params.slug, req.params.file);
    if (!imagePath) {
      res.status(404).json({ error: 'Unknown menu image' });
      return;
    }
    res.sendFile(imagePath);
  });

  return router;
}

function storeMenu(
  menu: Awaited<ReturnType<typeof produceMenu>>['menu'],
  servedFrom: 'live' | 'cache',
  source: MenuSourceImage,
  id?: string,
): MenuResponse {
  const dishAudio = menu.dishes.map(() => null);
  return toResponse(createMenu(menu, servedFrom, dishAudio, source, id));
}

// Firebase functions are stateless and may serve the audio request from a
// different instance than the menu request. The stage menu has a stable ID so
// every instance can reconstruct it from the checked-in cache.
function storedMenu(id: string): StoredMenu | undefined {
  const existing = getMenu(id);
  if (existing || id !== DEMO_MENU_ID) return existing;
  const menu = loadCachedMenu();
  const board = findMenuImagePath(MENU_FIXTURE_SLUG, 'menu-board.png');
  if (!menu || !board) return undefined;
  const source: MenuSourceImage = { bytes: readFileSync(board), mimeType: 'image/png' };
  return createMenu(menu, 'cache', menu.dishes.map(() => null), source, DEMO_MENU_ID);
}

function orderVoiceId(
  config: VoiceDeps['config'],
  lang: MenuOrderLanguage,
): string {
  if (lang === 'ms') return config.ELEVENLABS_VOICE_ID_MS ?? config.ELEVENLABS_VOICE_ID;
  if (lang === 'yue') return config.ELEVENLABS_VOICE_ID_YUE ?? config.ELEVENLABS_VOICE_ID;
  return config.ELEVENLABS_VOICE_ID_ZH ?? config.ELEVENLABS_VOICE_ID;
}

function sourceImage(imageBase64: string, mimeType: 'image/jpeg' | 'image/png'): MenuSourceImage {
  return { bytes: Buffer.from(imageBase64, 'base64'), mimeType };
}
