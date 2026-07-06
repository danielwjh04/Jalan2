import { Router } from 'express';
import { rankedDirectory } from '../store/directory';

export function directoryRouter(): Router {
  const router = Router();
  router.get('/directory', (_req, res) => {
    res.json(rankedDirectory());
  });
  return router;
}
