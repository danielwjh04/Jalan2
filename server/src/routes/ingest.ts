import { Router } from 'express';
import { normalizeVideoUrl } from '@shared/videoUrl';
import { coverUrlFor, resolveFixtureSlug } from '../lib/fixtures';
import { runPipeline, type PipelineDeps } from '../pipeline/run';
import { createItinerary } from '../store/itineraries';

export function ingestRouter(deps: PipelineDeps): Router {
  const router = Router();
  router.post('/ingest', (req, res) => {
    const raw = typeof req.body?.url === 'string' ? req.body.url : '';
    const normalized = normalizeVideoUrl(raw);
    if (!normalized) {
      res.status(400).json({ error: 'Body must include url containing a video link' });
      return;
    }
    const itinerary = createItinerary(
      normalized.url,
      coverUrlFor(resolveFixtureSlug(normalized.url)),
    );
    void runPipeline(deps, itinerary.id, normalized.url);
    res.status(202).json({ id: itinerary.id });
  });
  return router;
}
