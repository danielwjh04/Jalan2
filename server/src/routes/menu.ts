import express, { Router } from 'express';
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import type { MenuResponse } from '@shared/api';
import type { TextToSpeech } from '../adapters/tts/types';
import { findMenuImagePath, loadCachedMenu, MENU_FIXTURE_SLUG } from '../lib/fixtures';
import { attachDishImages, produceMenu, type MenuDeps } from '../pipeline/menu';
import { textClip, type VoiceDeps } from '../services/voice';
import { createMenu, getMenu, type MenuSourceImage, type StoredMenu } from '../store/menus';

const MenuRequestSchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.enum(['image/jpeg', 'image/png']),
});

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
        res.status(201).json(await storeMenu(menu, servedFrom, voice, source));
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
    void attachDishImages(deps.foodImages, menu)
      .then((enriched) => storeMenu(enriched, 'cache', voice, source))
      .then((response) => res.status(201).json(response))
      .catch((error: Error) => res.status(502).json({ error: error.message }));
  });

  router.get('/menu/:id/source', (req, res) => {
    const source = getMenu(req.params.id)?.sourceImage;
    if (!source) {
      res.status(404).json({ error: 'Menu source photo is unavailable' });
      return;
    }
    res.set('Cache-Control', 'private, no-store');
    res.type(source.mimeType).send(source.bytes);
  });

  router.get('/menu/:id', (req, res) => {
    const stored = getMenu(req.params.id);
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

async function storeMenu(
  menu: Awaited<ReturnType<typeof produceMenu>>['menu'],
  servedFrom: 'live' | 'cache',
  voice: VoiceDeps,
  source: MenuSourceImage,
): Promise<MenuResponse> {
  const dishAudio = await Promise.all(
    menu.dishes.map(async (dish) => (await textClip(voice, dish.order_phrase)).audioUrl),
  );
  return toResponse(createMenu(menu, servedFrom, dishAudio, source));
}

function sourceImage(imageBase64: string, mimeType: 'image/jpeg' | 'image/png'): MenuSourceImage {
  return { bytes: Buffer.from(imageBase64, 'base64'), mimeType };
}
