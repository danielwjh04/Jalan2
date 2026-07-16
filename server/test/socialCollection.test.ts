import { describe, expect, it } from 'vitest';
import { DEFAULT_TRIP_PREFERENCES, type TripPlan, type TripStop } from '@shared/trip';
import { createSocialCollectionTrip } from '../src/planner/socialCollection';

describe('social collection planner', () => {
  it('combines selected stops, deduplicates places and audits the route', async () => {
    const first = sourceTrip('first', 'XHS', [stop('a', 'Museum', 3.14, 101.68, 'https://xhslink.com/a'), stop('b', 'Cafe', 3.15, 101.69, 'https://xhslink.com/a')]);
    const second = sourceTrip('second', 'TikTok', [stop('b-copy', 'Cafe', 3.15, 101.69, 'https://tiktok.com/b', 'google-b'), stop('c', 'Market', 3.16, 101.7, 'https://tiktok.com/b')]);
    const routing = { name: 'google' as const, optimize: async (stops: TripStop[]) => ({ ordered_stop_ids: stops.map(({ id }) => id), distance_meters: 4300, duration_minutes: 20, path: stops.map(({ location }) => location), provider: 'google' as const }) };

    const trip = await createSocialCollectionTrip([
      { trip: first, stopIds: ['a', 'b'] },
      { trip: second, stopIds: ['b-copy', 'c'] },
    ], routing, undefined, 'Weekend finds', (value) => value);

    expect(trip.origin).toBe('social_collection');
    expect(trip.title).toBe('Weekend finds');
    expect(trip.stops).toHaveLength(3);
    expect(trip.stops.find(({ name }) => name === 'Cafe')?.sources).toHaveLength(2);
    expect(trip.planning?.legs).toHaveLength(2);
    expect(trip.planning?.agents.some(({ id }) => id === 'critic')).toBe(true);
  });
});

function sourceTrip(id: string, creator: string, stops: TripStop[]): TripPlan {
  return { id, title: `${creator} finds`, summary: null, region: 'Kuala Lumpur, Malaysia', source_creator: creator, source_url: stops[0].sources[0].url, cover_url: null, demo: false, origin: 'video', source_discovery_id: null, stops, selected_stop_ids: stops.map(({ id: stopId }) => stopId), preferences: DEFAULT_TRIP_PREFERENCES, route: null, planning: null };
}

function stop(id: string, name: string, lat: number, lng: number, url: string, placeId = `google-${id}`): TripStop {
  return { id, name, summary: `Visit ${name}`, location: { lat, lng }, image_url: null, place_photo_available: false, place_photo_attributions: [], image_attributions: [], estimated_spend_myr: null, duration_minutes: 60, sources: [{ title: 'Social post', url }], place_id: placeId, address: `${name}, KL`, google_maps_url: `https://maps.google.com/?q=${id}`, opening_window: null };
}
