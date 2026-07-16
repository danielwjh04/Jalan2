import { DEFAULT_TRIP_PREFERENCES } from '@shared/trip';
import { pickRetrieval } from '../src/adapters/retrieval';
import { createRouting } from '../src/adapters/routing';
import { loadConfig } from '../src/config';
import { loadCachedTrip } from '../src/lib/fixtures';

const config = loadConfig();
const trip = loadCachedTrip('kuching-city-guide-01');
if (!trip) throw new Error('Kuching smoke fixture is missing');

const byId = new Map(trip.stops.map((stop) => [stop.id, stop]));
const routeStops = trip.selected_stop_ids.slice(0, 4).map((id) => byId.get(id));
if (routeStops.some((stop) => !stop)) throw new Error('Smoke route contains a missing stop');

const routing = createRouting(config);
const routeCheck = await capture(async () => routing.optimize(
  routeStops.filter((stop) => stop !== undefined),
  trip.preferences ?? DEFAULT_TRIP_PREFERENCES,
));

const retrieval = pickRetrieval(config);
const retrievalCheck = await capture(() => retrieval.search(
  'Kuching Sarawak local tour operator official reviews',
  3,
  240,
));

const route = routeCheck.value;
const evidence = retrievalCheck.value ?? [];
const ok = routing.name === 'google'
  && retrieval.name === 'exa'
  && routeCheck.ok
  && retrievalCheck.ok
  && evidence.length > 0;

console.info(JSON.stringify({
  ok,
  routing: {
    provider: routing.name,
    status: routeCheck.ok ? 'live' : 'failed',
    distanceMeters: route?.distance_meters ?? null,
    durationMinutes: route?.duration_minutes ?? null,
    orderedStops: route?.ordered_stop_ids.length ?? 0,
    error: routeCheck.error,
  },
  retrieval: {
    provider: retrieval.name,
    status: retrievalCheck.ok ? 'live' : 'failed',
    resultCount: evidence.length,
    titledResults: evidence.filter((item) => item.title.length > 0).length,
    withEvidenceText: evidence.filter((item) => item.snippet).length,
    error: retrievalCheck.error,
  },
}, null, 2));

if (!ok) process.exitCode = 1;

async function capture<T>(run: () => Promise<T>): Promise<{
  ok: boolean;
  value?: T;
  error: string | null;
}> {
  try {
    return { ok: true, value: await run(), error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message.split('\n')[0].slice(0, 180) };
  }
}
