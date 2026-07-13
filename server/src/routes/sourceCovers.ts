import { Router } from 'express';
import { findSourceCover } from '../lib/sourceCovers';

export function sourceCoversRouter(): Router {
  const router = Router();

  router.get('/source-covers/:key', (req, res) => {
    const coverPath = findSourceCover(req.params.key);
    if (!coverPath) {
      res.status(404).json({ error: 'Source cover not found' });
      return;
    }
    res.type('image/jpeg').sendFile(coverPath);
  });

  return router;
}
