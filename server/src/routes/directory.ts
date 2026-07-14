import { Router } from 'express';
import {
  fixtureDirectoryEntries,
  mergeDirectoryEntries,
} from '../services/fixtureDirectory';
import { rankedDirectory } from '../store/directory';

export function directoryRouter(): Router {
  const router = Router();
  router.get('/directory', (_req, res) => {
    res.json(mergeDirectoryEntries(rankedDirectory(), fixtureDirectoryEntries()));
  });
  return router;
}
