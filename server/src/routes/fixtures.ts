import { Router } from 'express';
import { knownFixtures } from '../lib/fixtures';

// Serves the curated demo URLs so the app's home-screen shortcuts stay in
// sync with server/fixtures/manifest.json instead of duplicating them.
export function fixturesRouter(): Router {
  const router = Router();
  router.get('/fixtures', (_req, res) => {
    const bySlug = new Map<string, { slug: string; url: string }>();
    for (const fixture of knownFixtures()) {
      if (!bySlug.has(fixture.slug)) bySlug.set(fixture.slug, fixture);
    }
    res.json([...bySlug.values()]);
  });
  return router;
}
