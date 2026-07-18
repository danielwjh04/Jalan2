import { Router } from 'express';
import { z } from 'zod';
import type { PlacesProvider } from '../adapters/places/types';

const PlaceIdSchema = z.string().min(3).max(256).regex(/^[A-Za-z0-9_-]+$/);
const PhotoIndexSchema = z.coerce.number().int().min(0).max(9).default(0);

export function placePhotosRouter(places: PlacesProvider): Router {
  const router = Router();
  router.get('/places/:placeId/photo', async (req, res) => {
    const placeId = PlaceIdSchema.safeParse(req.params.placeId);
    const index = PhotoIndexSchema.safeParse(req.query.index ?? 0);
    if (!placeId.success || !index.success) {
      res.status(400).json({ error: 'Invalid place ID or photo index' });
      return;
    }
    try {
      const photo = await places.photo(placeId.data, index.data);
      if (!photo) {
        res.status(404).json({ error: 'No place photo available' });
        return;
      }
      // Photo names are looked up fresh on every request as required by the
      // Places API. The returned bytes may be kept briefly by the device so
      // swiping back does not immediately rebill/reload the same image.
      res.set('Cache-Control', 'private, max-age=900');
      res.type(photo.contentType).send(Buffer.from(photo.bytes));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Place photo request failed';
      res.status(502).json({ error: message });
    }
  });
  return router;
}
