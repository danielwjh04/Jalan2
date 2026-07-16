import { describe, expect, it, vi } from 'vitest';
import { SmartPlanRequestSchema, type SmartPlanRequest } from '@shared/planner';
import type { PlaceCandidate } from '@shared/trip';
import type { PlacesProvider } from '../src/adapters/places/types';
import type { RoutingProvider } from '../src/adapters/routing/types';
import { createSmartPlan } from '../src/planner/smartPlanner';

describe('smart planning agents', () => {
  it('builds a connected physical trip with first-class transport, days and handoffs', async () => {
    const optimize = vi.fn<RoutingProvider['optimize']>(async (stops) => ({
      ordered_stop_ids: stops.map((stop) => stop.id),
      distance_meters: 20_000,
      duration_minutes: 420,
      path: stops.map((stop) => stop.location),
      provider: 'google',
    }));
    const trip = await createSmartPlan(request({ days: 1, start_date: '2026-08-10' }), {
      places: fakePlaces(),
      routing: { name: 'google', optimize },
      findEasybook: async () => 'https://www.easybook.com/en-my/bus/booking/kuala-lumpur-to-gopeng',
      save: (value) => value,
    });

    expect(trip.origin).toBe('smart_plan');
    expect(trip.planning?.agents).toHaveLength(7);
    expect(trip.planning?.agents.at(-1)?.id).toBe('critic');
    expect(trip.planning?.legs[0]).toEqual(expect.objectContaining({
      provider: 'easybook',
      booking: 'external_search',
    }));
    expect(trip.planning?.legs[1]).toEqual(expect.objectContaining({
      provider: 'operator',
      evidence: 'needs_confirmation',
    }));
    expect(trip.planning?.recommended_days).toBeGreaterThan(1);
    expect(trip.planning?.stay).toEqual(expect.objectContaining({ check_in: '2026-08-10', travelers: 2 }));
    expect(trip.planning?.hotel_search_url).toContain('checkIn=2026-08-10');
    expect(trip.planning?.critique?.score).toBeGreaterThanOrEqual(0);
    expect(trip.planning?.checks.some((check) => check.message.includes('needs at least'))).toBe(true);
    expect(trip.planning?.handoffs).toEqual(expect.arrayContaining([
      expect.objectContaining({ provider: 'KTMB (KITS)' }),
      expect.objectContaining({ provider: 'EasyBook' }),
    ]));
    expect(trip.preferences?.return_to_origin).toBe(true);
    expect(trip.stops.at(-1)?.name).toBe('Return to Kuala Lumpur');
    expect(trip.planning?.request.end_destination).toBeNull();
    expect(trip.stops.every((stop) => !stop.transport_provider)).toBe(true);
    expect(optimize.mock.calls[0][0].map((stop) => stop.name)).not.toContain('Kuala Lumpur');
  });

  it('does not invent a road connection between Peninsular Malaysia and Borneo', async () => {
    const trip = await createSmartPlan(request({ destination: 'Kuching', days: 3 }), {
      places: fakePlaces(true),
      routing: fakeRouting(),
      findEasybook: async () => null,
      save: (value) => value,
    });

    expect(trip.planning?.legs[0]).toEqual(expect.objectContaining({
      mode: 'flight',
      evidence: 'needs_confirmation',
      provider: 'unknown',
    }));
    expect(trip.planning?.checks.some((check) => check.severity === 'blocking')).toBe(true);
  });

  it('finishes a one-way plan at the explicit endpoint instead of assuming a return', async () => {
    const trip = await createSmartPlan(request({ return_to_origin: false, end_destination: 'Penang' }), {
      places: fakePlaces(), routing: fakeRouting(), findEasybook: async () => null, save: (value) => value,
    });

    expect(trip.stops.at(-1)?.name).toBe('Penang');
    expect(trip.preferences).toEqual(expect.objectContaining({ journey_origin: 'Kuala Lumpur', journey_end: 'Penang', return_to_origin: false }));
    expect(trip.planning?.request.end_destination).toBe('Penang');
    expect(trip.planning?.legs.at(-1)).toEqual(expect.objectContaining({ provider: 'ktmb', mode: 'train', evidence: 'needs_confirmation' }));
  });

  it('rejects incomplete briefs before any provider call', () => {
    expect(SmartPlanRequestSchema.safeParse({ origin: 'KL', destination: '', interests: [] }).success).toBe(false);
    expect(SmartPlanRequestSchema.safeParse({ origin: 'KL', destination: 'Ipoh', return_to_origin: false, end_destination: null, interests: ['food'] }).success).toBe(false);
  });
});

function request(overrides: Partial<SmartPlanRequest> = {}): SmartPlanRequest {
  return SmartPlanRequestSchema.parse({
    origin: 'Kuala Lumpur',
    destination: 'Gopeng',
    days: 2,
    travelers: 2,
    budget_myr: 800,
    interests: ['caves', 'rafting'],
    pace: 'balanced',
    ...overrides,
  });
}

function fakePlaces(borneo = false): PlacesProvider {
  const destination = borneo
    ? place('kuching', 'Kuching', 1.5533, 110.3592, 'locality')
    : place('gopeng', 'Gopeng', 4.471, 101.166, 'locality');
  const activities = [
    place('cave', 'Gua Tempurung', destination.location.lat + 0.02, destination.location.lng, 'tourist_attraction'),
    place('rafting', 'Kampar River Rafting', destination.location.lat, destination.location.lng + 0.02, 'tourist_attraction'),
    place('food', 'Old Town Food Court', destination.location.lat + 0.01, destination.location.lng + 0.01, 'restaurant'),
  ];
  return {
    name: 'google',
    search: async (query) => {
      if (query === 'Kuala Lumpur') return [place('kl', 'Kuala Lumpur', 3.139, 101.6869, 'locality')];
      if (query === 'Gopeng' || query === 'Kuching') return [destination];
      if (query === 'Penang') return [place('penang', 'Penang', 5.4141, 100.3288, 'locality')];
      if (query === 'Terminal Amanjaya') return [place('amanjaya', 'Terminal Amanjaya', 4.671, 101.073, 'bus_station')];
      return activities;
    },
    photo: async () => null,
  };
}

function fakeRouting(): RoutingProvider {
  return {
    name: 'offline',
    optimize: async (stops) => ({
      ordered_stop_ids: stops.map((stop) => stop.id),
      distance_meters: 15_000,
      duration_minutes: 360,
      path: stops.map((stop) => stop.location),
      provider: 'offline',
    }),
  };
}

function place(id: string, name: string, lat: number, lng: number, type: string): PlaceCandidate {
  return {
    place_id: id,
    name,
    address: `${name}, Malaysia`,
    location: { lat, lng },
    google_maps_url: `https://maps.google.com/?q=${encodeURIComponent(name)}`,
    opening_window: null,
    suggested_activity: `Explore ${name}.`,
    primary_type: type,
    reservation_hint: null,
    place_photo_available: false,
    place_photo_attributions: [],
    image_url: null,
    image_attributions: [],
    rating: 4.5,
    user_rating_count: 1000,
  };
}
