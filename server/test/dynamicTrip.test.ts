import { describe, expect, it, vi } from 'vitest';
import type { BookingJson } from '@shared/booking';
import type { PlaceCandidate } from '@shared/trip';
import type { PlacesProvider } from '../src/adapters/places/types';
import { anchorMeetingPoint, createDynamicTrip } from '../src/pipeline/trip';

const booking: BookingJson = {
  operator_name: 'Unnamed local operator',
  activity: 'Bengoh Dam day trip',
  price_myr: 199,
  pax: 2,
  meeting_point: { name: 'Bengoh Dam', lat: 1.3, lng: 110.2 },
  contact: { whatsapp: null, source: 'caption' },
  date_requested: null,
  confidence: 0.8,
  raw_evidence: { transcript_span: '', frame_ts: '4.0s' },
};

function candidate(query: string, location = { lat: 1.5, lng: 110.3 }): PlaceCandidate {
  return {
    place_id: `google-${query}`,
    name: query,
    address: `${query}, Malaysia`,
    location,
    google_maps_url: `https://maps.google.com/?q=${encodeURIComponent(query)}`,
    opening_window: null,
    suggested_activity: `Explore ${query} and check the latest visitor information.`,
    place_photo_available: true,
    place_photo_attributions: [],
    image_url: null,
    image_attributions: [],
  };
}

function providerWith(search: PlacesProvider['search']): PlacesProvider {
  return { name: 'google', search, photo: async () => null };
}

const vision = {
  frames: [{
    ts: '4.0s',
    on_screen_text: 'Bengoh Dam and Susung Waterfall',
    price_candidates: [],
    phone_candidates: [],
    place_candidates: ['Bengoh Dam', 'Susung Waterfall', 'Sarawak'],
    operator_or_logo: null,
  }],
};

describe('createDynamicTrip', () => {
  it('turns every distinct evidenced place into a resolved editable stop', async () => {
    const search = vi.fn(async (query: string) => [candidate(query)]);
    const trip = await createDynamicTrip(
      'trip-1', 'https://tiktok.com/video/1', booking, vision, providerWith(search),
    );

    expect(search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenCalledWith('Bengoh Dam', 'Sarawak, Malaysia');
    expect(trip.demo).toBe(false);
    expect(trip.region).toBe('Sarawak, Malaysia');
    expect(trip.stops.map((stop) => stop.name)).toEqual(['Bengoh Dam', 'Susung Waterfall']);
    expect(trip.selected_stop_ids).toHaveLength(2);
    expect(trip.stops[0].summary).toContain('Explore Bengoh Dam');
    expect(trip.stops[0].place_photo_available).toBe(true);
  });

  it('derives the region from the meeting point for non-Kuching bookings', async () => {
    const klBooking: BookingJson = {
      ...booking,
      activity: 'KL street food crawl',
      meeting_point: { name: 'Petaling Street', lat: 3.1447, lng: 101.6958 },
    };
    const search = vi.fn(async (query: string) => [candidate(query, { lat: 3.14, lng: 101.69 })]);
    const trip = await createDynamicTrip(
      'trip-2', 'https://tiktok.com/video/2', klBooking, vision, providerWith(search),
    );

    expect(trip.region).toBe('Kuala Lumpur, Malaysia');
    expect(search).toHaveBeenCalledWith('Bengoh Dam', 'Kuala Lumpur, Malaysia');
  });
});

describe('anchorMeetingPoint', () => {
  it('overrides fused coordinates with the first places result', async () => {
    const search = vi.fn(async (query: string) => [
      candidate(query, { lat: 5.4141, lng: 100.3288 }),
    ]);
    const anchored = await anchorMeetingPoint(booking, providerWith(search));

    expect(search).toHaveBeenCalledWith('Bengoh Dam', 'Malaysia');
    expect(anchored.meeting_point).toEqual({ name: 'Bengoh Dam', lat: 5.4141, lng: 100.3288 });
  });

  it('keeps the fused meeting point when search finds nothing', async () => {
    const anchored = await anchorMeetingPoint(booking, providerWith(async () => []));
    expect(anchored).toBe(booking);
  });

  it('keeps the fused meeting point when search throws', async () => {
    const anchored = await anchorMeetingPoint(booking, providerWith(async () => {
      throw new Error('Google Places failed (500)');
    }));
    expect(anchored).toBe(booking);
  });

  it('keeps the fused meeting point when the result is outside Malaysia', async () => {
    const search = async (query: string): Promise<PlaceCandidate[]> => [
      candidate(query, { lat: 13.75, lng: 100.5 }),
    ];
    const anchored = await anchorMeetingPoint(booking, providerWith(search));
    expect(anchored).toBe(booking);
  });
});
