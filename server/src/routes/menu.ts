import express, { Router } from 'express';
import { z } from 'zod';
import type { MenuResponse } from '@shared/api';
import type { TextToSpeech } from '../adapters/tts/types';
import { findMenuImagePath } from '../lib/fixtures';
import { produceMenu, type MenuDeps } from '../pipeline/menu';
import { textClip, type VoiceDeps } from '../services/voice';
import { createMenu, getMenu, type StoredMenu } from '../store/menus';

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
        const dishAudio = await Promise.all(
          menu.dishes.map(async (dish) => (await textClip(voice, dish.order_phrase)).audioUrl),
        );
        res.status(201).json(toResponse(createMenu(menu, servedFrom, dishAudio)));
      })
      .catch((error: Error) => {
        res.status(502).json({ error: error.message });
      });
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
