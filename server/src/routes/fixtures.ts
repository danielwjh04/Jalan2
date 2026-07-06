import { Router } from 'express';
import type { FixtureCard } from '@shared/api';
import { coverUrlFor, findCoverPath, knownFixtures, loadCachedBooking } from '../lib/fixtures';
import { regionForPlace } from '../pipeline/gazetteer';

// Serves the curated demo cards so the home screen stays in sync with
// server/fixtures/ instead of duplicating URLs, prices, or images.
export function fixturesRouter(): Router {
  const router = Router();

  router.get('/fixtures', (_req, res) => {
    const bySlug = new Map<string, FixtureCard>();
    for (const fixture of knownFixtures()) {
      if (bySlug.has(fixture.slug)) continue;
      const booking = loadCachedBooking(fixture.slug);
      bySlug.set(fixture.slug, {
        ...fixture,
        coverUrl: coverUrlFor(fixture.slug),
        activity: booking?.activity ?? null,
        operatorName: booking?.operator_name ?? null,
        priceMyr: booking?.price_myr ?? null,
        meetingPointName: booking?.meeting_point.name ?? null,
        region: booking ? regionForPlace(booking.meeting_point.name) : null,
      });
    }
    res.json([...bySlug.values()]);
  });

  router.get('/covers/:slug', (req, res) => {
    const coverPath = findCoverPath(req.params.slug);
    if (!coverPath) {
      res.status(404).json({ error: `No cover for ${req.params.slug}` });
      return;
    }
    res.sendFile(coverPath);
  });

  return router;
}
