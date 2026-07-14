import { describe, expect, it, vi } from 'vitest';
import type { BookingJson } from '@shared/booking';
import type { PlacesProvider } from '../src/adapters/places/types';
import { createDynamicTrip } from '../src/pipeline/trip';

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

describe('createDynamicTrip', () => {
  it('turns every distinct evidenced place into a resolved editable stop', async () => {
    const search = vi.fn(async (query: string) => [{
      place_id: `google-${query}`,
      name: query,
      address: `${query}, Sarawak`,
      location: { lat: 1.5, lng: 110.3 },
      google_maps_url: `https://maps.google.com/?q=${encodeURIComponent(query)}`,
      opening_window: null,
      suggested_activity: `Explore ${query} and check the latest visitor information.`,
      place_photo_available: true,
      place_photo_attributions: [],
      image_url: null,
      image_attributions: [],
    }]);
    const places: PlacesProvider = { name: 'google', search, photo: async () => null };
    const trip = await createDynamicTrip('trip-1', 'https://tiktok.com/video/1', booking, {
      frames: [{
        ts: '4.0s',
        on_screen_text: 'Bengoh Dam and Susung Waterfall',
        price_candidates: [],
        phone_candidates: [],
        place_candidates: ['Bengoh Dam', 'Susung Waterfall', 'Sarawak'],
        operator_or_logo: null,
      }],
    }, places);

    expect(search).toHaveBeenCalledTimes(2);
    expect(trip.demo).toBe(false);
    expect(trip.stops.map((stop) => stop.name)).toEqual(['Bengoh Dam', 'Susung Waterfall']);
    expect(trip.selected_stop_ids).toHaveLength(2);
    expect(trip.stops[0].summary).toContain('Explore Bengoh Dam');
    expect(trip.stops[0].place_photo_available).toBe(true);
  });
});
