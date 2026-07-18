import { describe, expect, it } from 'vitest';
import { DEFAULT_TRIP_PREFERENCES, type TripPlan, type TripStop } from '@shared/trip';
import { planImportedTrip } from '../src/planner/importedTripPlanner';
import type { RoutingProvider } from '../src/adapters/routing/types';

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

  it('uses walking for nearby pins and Grab for a normal urban transfer', async () => {
    const source = sourceTrip();
    source.stops = [
      stop('a', 'Old Town A', 4.5975, 101.0901),
      stop('b', 'Old Town B', 4.603, 101.091),
      stop('c', 'Cave Temple', 4.674, 101.12),
    ];
    source.selected_stop_ids = source.stops.map(({ id }) => id);
    const trip = await planImportedTrip(source, identityRouting());

    expect(trip.planning?.legs.map(({ mode }) => mode)).toEqual(['walk', 'ride_hail']);
    expect(trip.planning?.legs[1]).toEqual(expect.objectContaining({ provider: 'grab', booking: 'external_search' }));
    expect(trip.planning?.handoffs.some(({ provider }) => provider === 'Grab')).toBe(true);
  });

  it('blocks different venue names that resolve to one map pin', async () => {
    const source = sourceTrip();
    source.stops[1] = { ...source.stops[1], location: source.stops[0].location };
    const trip = await planImportedTrip(source, identityRouting());

    expect(trip.planning?.checks).toContainEqual(expect.objectContaining({
      severity: 'blocking',
      message: expect.stringContaining('same map pin'),
    }));
    expect(trip.planning?.critique?.verdict).toBe('rework');
  });

  it('keeps a Google Transit train-to-bus transfer as one grounded multimodal leg', async () => {
    const source = sourceTrip();
    source.stops = [
      stop('origin', 'Town A', 3.1, 101.6),
      stop('destination', 'Highland Stop', 3.62, 101.38),
    ];
    source.selected_stop_ids = source.stops.map(({ id }) => id);
    const routing = identityRouting();
    routing.transit = async () => ({
      duration_minutes: 145,
      distance_meters: 68_000,
      modes: ['Train ETS', 'Bus T10'],
      summary: 'Train ETS → Bus T10',
      directions_url: 'https://www.google.com/maps/dir/?api=1&travelmode=transit',
    });
    const trip = await planImportedTrip(source, routing);

    expect(trip.planning?.legs[0]).toEqual(expect.objectContaining({
      mode: 'multimodal', provider: 'google_routes', evidence: 'provider_verified',
    }));
    expect(trip.planning?.handoffs).toContainEqual(expect.objectContaining({ provider: 'Google Transit' }));
  });
});

function identityRouting(): RoutingProvider {
  return {
    name: 'google' as const,
    optimize: async (stops: TripStop[]) => ({
      ordered_stop_ids: stops.map((stop) => stop.id),
      distance_meters: 10_000,
      duration_minutes: 30,
      path: stops.map((stop) => stop.location),
      provider: 'google' as const,
    }),
  };
}

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
