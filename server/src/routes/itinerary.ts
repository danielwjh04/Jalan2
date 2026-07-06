import { Router } from 'express';
import { getItinerary } from '../store/itineraries';

export function itineraryRouter(): Router {
  const router = Router();
  router.get('/itinerary/:id', (req, res) => {
    const itinerary = getItinerary(req.params.id);
    if (!itinerary) {
      res.status(404).json({ error: `Unknown itinerary ${req.params.id}` });
      return;
    }
    res.json(itinerary);
  });
  return router;
}
