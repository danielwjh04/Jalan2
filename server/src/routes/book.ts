import { Router } from 'express';
import { z } from 'zod';
import type { Config } from '../config';
import type { MessagingProvider } from '../adapters/messaging/types';
import { bookItinerary } from '../services/booking';

const BookBodySchema = z.object({
  id: z.string().min(1),
  dateISO: z.string().min(1),
  pax: z.number().int().positive(),
});

export function bookRouter(messaging: MessagingProvider, config: Config): Router {
  const router = Router();
  router.post('/book', async (req, res) => {
    const parsed = BookBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Body must include id, dateISO, and positive integer pax' });
      return;
    }
    try {
      const { id, dateISO, pax } = parsed.data;
      res.json(await bookItinerary(messaging, config, id, { dateISO, pax }));
    } catch (error) {
      res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });
  return router;
}
