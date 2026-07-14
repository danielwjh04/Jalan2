import { Router } from 'express';
import {
  deleteFailedItinerary,
  getItinerary,
  listItinerarySummaries,
} from '../store/itineraries';

export function itineraryRouter(): Router {
  const router = Router();
  router.get('/itineraries', (_req, res) => {
    res.json(listItinerarySummaries());
  });
  router.get('/itinerary/:id', (req, res) => {
    const itinerary = getItinerary(req.params.id);
    if (!itinerary) {
      res.status(404).json({ error: `Unknown itinerary ${req.params.id}` });
      return;
    }
    res.json(itinerary);
  });
  router.delete('/itinerary/:id', (req, res) => {
    const result = deleteFailedItinerary(req.params.id);
    if (result === 'not_found') {
      res.status(404).json({ error: `Unknown itinerary ${req.params.id}` });
      return;
    }
    if (result === 'not_failed') {
      res.status(409).json({ error: 'Only failed trips can be deleted' });
      return;
    }
    res.status(204).send();
  });
  return router;
}
