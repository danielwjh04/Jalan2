import { describe, expect, it } from 'vitest';
import { DEFAULT_TRIP_PREFERENCES, type TripPlan, type TripStop } from '@shared/trip';
import { planImportedTrip } from '../src/planner/importedTripPlanner';

describe('imported social trip planning', () => {
  it('turns source recommendations into an audited local itinerary', async () => {
    const trip = await planImportedTrip(sourceTrip(), {
      name: 'google',
      optimize: async (stops) => ({
        ordered_stop_ids: stops.map((stop) => stop.id),
        distance_meters: 8500,
        duration_minutes: 32,
        path: stops.map((stop) => stop.location),
        provider: 'google',
      }),
    });

    expect(trip.origin).toBe('video');
    expect(trip.planning?.agents).toHaveLength(7);
    expect(trip.planning?.agents.some((agent) => agent.id === 'critic')).toBe(true);
    expect(trip.planning?.legs).toHaveLength(1);
    expect(trip.planning?.handoffs[0]).toEqual(expect.objectContaining({ provider: 'Google Maps', kind: 'directions' }));
    expect(trip.planning?.critique?.verdict).toBe('ready');
    expect(trip.summary).toContain('recommendations visible');
  });

  it('adds explicit outbound and return boundaries to an imported social itinerary', async () => {
    const source = sourceTrip();
    source.preferences = {
      ...DEFAULT_TRIP_PREFERENCES,
      journey_origin: 'Kuala Lumpur',
      journey_end: 'Kuala Lumpur',
      return_to_origin: true,
    };
    const trip = await planImportedTrip(source, {
      name: 'google',
      optimize: async (stops) => ({
        ordered_stop_ids: stops.map((stop) => stop.id),
        distance_meters: 1_000_000,
        duration_minutes: 600,
        path: stops.map((stop) => stop.location),
        provider: 'google',
      }),
    }, undefined, {
      name: 'google',
      search: async () => [{
        place_id: 'kl', name: 'Kuala Lumpur', address: 'Kuala Lumpur, Malaysia',
        location: { lat: 3.139, lng: 101.6869 }, google_maps_url: 'https://maps.google.com/?q=Kuala+Lumpur',
        opening_window: null, suggested_activity: 'Start here.', primary_type: 'locality', reservation_hint: null,
        place_photo_available: false, place_photo_attributions: [], image_url: null, image_attributions: [],
      }],
      photo: async () => null,
    });

    expect(trip.stops[0].name).toBe('Kuala Lumpur');
    expect(trip.stops.at(-1)?.name).toBe('Return to Kuala Lumpur');
    expect(trip.planning?.legs[0].mode).toBe('flight');
    expect(trip.planning?.legs.at(-1)?.mode).toBe('flight');
    expect(trip.planning?.request.return_to_origin).toBe(true);
  });
});

function sourceTrip(): TripPlan {
  const stops = [stop('museum', 'Borneo Cultures Museum', 1.557, 110.344), stop('laksa', 'Choon Hui Cafe', 1.553, 110.353)];
  return {
    id: 'xhs-kuching', title: 'Kuching source list', summary: 'From XHS', region: 'Kuching, Sarawak',
    source_creator: 'XHS creator', source_url: 'https://www.xiaohongshu.com/explore/example', cover_url: null,
    demo: false, origin: 'video', source_discovery_id: null, stops, selected_stop_ids: stops.map(({ id }) => id),
    preferences: DEFAULT_TRIP_PREFERENCES, route: null, planning: null,
  };
}

function stop(id: string, name: string, lat: number, lng: number): TripStop {
  return {
    id, name, summary: `Visit ${name}`, location: { lat, lng }, image_url: null, estimated_spend_myr: null,
    duration_minutes: 75, sources: [{ title: 'Submitted XHS post', url: 'https://www.xiaohongshu.com/explore/example' }],
    place_id: `google-${id}`, address: `${name}, Kuching`, google_maps_url: `https://maps.google.com/?q=${id}`,
    opening_window: null, primary_type: id === 'laksa' ? 'restaurant' : 'museum', reservation_hint: null,
    place_photo_available: false, place_photo_attributions: [], image_attributions: [],
  };
}
