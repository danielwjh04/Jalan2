import { Router } from 'express';
import type { Config } from '../config';
import { buildGoogleStaticTripMapUrl, selectTripMapStops } from '../services/tripMap';
import { getTrip } from '../store/trips';

const MAP_TIMEOUT_MS = 10_000;

export function tripMapsRouter(config: Config): Router {
  const router = Router();
  router.get('/trips/:id/map', async (req, res) => {
    const trip = getTrip(req.params.id);
    if (!trip) {
      res.status(404).json({ error: `Unknown trip ${req.params.id}` });
      return;
    }
    if (!config.GOOGLE_MAPS_API_KEY) {
      res.status(503).json({ error: 'Google Maps is not configured' });
      return;
    }

    try {
      const ids = typeof req.query.ids === 'string'
        ? req.query.ids.split(',').map((id) => id.trim()).filter(Boolean)
        : [];
      const stops = selectTripMapStops(trip.stops, ids);
      const upstream = await fetch(
        buildGoogleStaticTripMapUrl(config.GOOGLE_MAPS_API_KEY, stops),
        { signal: AbortSignal.timeout(MAP_TIMEOUT_MS) },
      );
      const contentType = upstream.headers.get('content-type') ?? '';
      if (!upstream.ok || !contentType.startsWith('image/')) {
        res.status(502).json({ error: 'Google Maps did not return a map image' });
        return;
      }
      res.setHeader('Cache-Control', 'no-store');
      res.type(contentType).send(Buffer.from(await upstream.arrayBuffer()));
    } catch (error) {
      const badStop = error instanceof Error && (
        error.message.startsWith('Unknown map stop')
        || error.message.startsWith('Choose between')
        || error.message.startsWith('A map needs')
      );
      res.status(badStop ? 400 : 502).json({ error: badStop ? error.message : 'Could not load Google Maps' });
    }
  });
  return router;
}
