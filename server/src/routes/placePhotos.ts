import { Router } from 'express';
import { z } from 'zod';
import type { PlacesProvider } from '../adapters/places/types';

const PlaceIdSchema = z.string().min(3).max(256).regex(/^[A-Za-z0-9_-]+$/);

export function placePhotosRouter(places: PlacesProvider): Router {
  const router = Router();
  router.get('/places/:placeId/photo', async (req, res) => {
    const placeId = PlaceIdSchema.safeParse(req.params.placeId);
    if (!placeId.success) {
      res.status(400).json({ error: 'Invalid place ID' });
      return;
    }
    try {
      const photo = await places.photo(placeId.data);
      if (!photo) {
        res.status(404).json({ error: 'No place photo available' });
        return;
      }
      res.set('Cache-Control', 'no-store');
      res.type(photo.contentType).send(Buffer.from(photo.bytes));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Place photo request failed';
      res.status(502).json({ error: message });
    }
  });
  return router;
}
