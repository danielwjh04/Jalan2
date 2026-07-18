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

  it('uses visible Chinese food context to ground an otherwise ambiguous venue name', async () => {
    const contextualVision = {
      frames: [{
        ts: '25.7s',
        on_screen_text: 'Sunny Hill 冰淇淋 回airbnb前先来吃个',
        price_candidates: [],
        phone_candidates: [],
        place_candidates: ['Sunny Hill'],
        operator_or_logo: null,
      }],
    };
    const search = vi.fn(async (query: string) => [candidate(query)]);

    const trip = await createDynamicTrip(
      'trip-ice-cream', 'https://xhslink.com/o/food-stop', booking, contextualVision, providerWith(search),
    );

    expect(search).toHaveBeenCalledWith('Sunny Hill Ice Cream', 'Sarawak, Malaysia');
    expect(trip.stops.map((stop) => stop.name)).toContain('Sunny Hill Ice Cream');
  });

  it('keeps more than eight evidenced stops from a multi-slide post', async () => {
    const manyPlaces = Array.from({ length: 13 }, (_, index) => `Venue ${index + 1}`);
    const carouselVision = {
      frames: manyPlaces.map((name, index) => ({
        ts: `${index + 1}.0s`,
        on_screen_text: name,
        price_candidates: [],
        phone_candidates: [],
        place_candidates: [name],
        operator_or_logo: null,
      })),
    };
    const search = vi.fn(async (query: string) => [candidate(query)]);

    const trip = await createDynamicTrip(
      'trip-carousel', 'https://xhslink.com/o/carousel', booking, carouselVision, providerWith(search),
    );

    expect(trip.stops).toHaveLength(14);
    expect(trip.stops.map((stop) => stop.name)).toContain('Venue 13');
  });

  it('merges caption venues that slide vision omitted', async () => {
    const search = vi.fn(async (query: string) => [candidate(query)]);
    const trip = await createDynamicTrip(
      'trip-caption', 'https://xhslink.com/o/caption', booking,
      { frames: [] }, providerWith(search),
      ['Ming Yue Confectionery', 'Weng Kee Seafood Restaurant', 'Foca Gelateria'],
    );

    expect(trip.stops.map((stop) => stop.name)).toEqual([
      'Bengoh Dam',
      'Ming Yue Confectionery',
      'Weng Kee Seafood Restaurant',
      'Foca Gelateria',
    ]);
  });

  it('normalizes bilingual Chinese source names and ignores a generic Airbnb label', async () => {
    const search = vi.fn(async (query: string) => [candidate(query)]);
    const trip = await createDynamicTrip(
      'trip-localized', 'https://xhslink.com/o/localized', booking,
      { frames: [{
        ts: '1.0s',
        on_screen_text: 'Airbnb 大树脚 明裕食品 怡保Ipoh',
        price_candidates: [], phone_candidates: [],
        place_candidates: ['Airbnb', '大树脚', '明裕食品', '怡保Ipoh'],
        operator_or_logo: null,
      }] }, providerWith(search),
    );

    expect(trip.stops.map((stop) => stop.name)).toEqual([
      'Bengoh Dam', 'Big Tree Foot Pasir Pinji', 'Ming Yue Confectionery',
    ]);
    expect(search).not.toHaveBeenCalledWith('Airbnb', expect.anything());
  });

  it('uses an evidenced city to disambiguate venue searches without adding a broad city stop', async () => {
    const ipohVision = {
      frames: [{
        ts: '2.0s',
        on_screen_text: 'Ipoh 新街场',
        price_candidates: [],
        phone_candidates: [],
        place_candidates: ['Ipoh', '新街场'],
        operator_or_logo: null,
      }],
    };
    const ipohBooking = {
      ...booking,
      meeting_point: { name: 'Gopeng Glamping Park', lat: 4.43, lng: 101.17 },
    };
    const search = vi.fn(async (query: string) => [candidate(query, { lat: 4.59, lng: 101.08 })]);

    const trip = await createDynamicTrip(
      'trip-ipoh', 'https://xhslink.com/o/ipoh', ipohBooking, ipohVision, providerWith(search),
    );

    expect(search).toHaveBeenCalledWith('Taman Jubilee', 'Ipoh, Perak, Malaysia');
    expect(trip.stops.map((stop) => stop.name)).not.toContain('Ipoh');
  });

  it('ranks a multilingual venue match above an unrelated first result', async () => {
    const multilingualVision = {
      frames: [{
        ts: '11.0s',
        on_screen_text: '永记海鲜饭店',
        price_candidates: [],
        phone_candidates: [],
        place_candidates: ['永记海鲜饭店 Ipoh'],
        operator_or_logo: null,
      }, {
        ts: '12.0s',
        on_screen_text: 'Ipoh',
        price_candidates: [],
        phone_candidates: [],
        place_candidates: ['Ipoh'],
        operator_or_logo: null,
      }],
    };
    const unrelated = candidate('Kedai Makanan Win Kee Baru', { lat: 4.6, lng: 101.1 });
    const matching = candidate('Weng Kee Seafood Restaurant • 永記海鮮飯店', { lat: 4.6, lng: 101.12 });
    unrelated.address = 'Taman Pertama, Ipoh, Perak';
    matching.address = 'Garden South, Ipoh, Perak';
    const search = vi.fn(async (query: string) => query === '永记海鲜饭店 Ipoh'
      ? [unrelated, matching]
      : [candidate(query)]);

    const trip = await createDynamicTrip(
      'trip-multilingual', 'https://xhslink.com/o/ipoh-food', booking,
      multilingualVision, providerWith(search),
    );

    expect(trip.stops.map((stop) => stop.name)).toContain('Weng Kee Seafood Restaurant • 永記海鮮飯店');
    expect(trip.stops.map((stop) => stop.name)).not.toContain('Kedai Makanan Win Kee Baru');
  });

  it('omits an ungrounded caption venue instead of cloning the meeting-point pin', async () => {
    const unrelated = candidate('Completely Different Shop', { lat: 1.56, lng: 110.35 });
    unrelated.address = 'Kuching, Sarawak';
    const search = vi.fn(async (query: string) => query === booking.meeting_point.name
      ? [candidate(query)]
      : [unrelated]);

    const trip = await createDynamicTrip(
      'trip-grounding-guard', 'https://xhslink.com/o/grounding-guard', booking,
      { frames: [] }, providerWith(search), ['Imaginary Riverside Cafe'],
    );

    expect(trip.stops.map((stop) => stop.name)).toEqual(['Bengoh Dam']);
    expect(trip.summary).toContain('Unmatched names are kept out');
  });

  it('rejects a name match outside Malaysia even when Google ranks it first', async () => {
    const overseas = candidate('La Playa Beach Bar & Restaurant', { lat: 18.08, lng: -63.02 });
    const search = vi.fn(async (query: string) => query === booking.meeting_point.name
      ? [candidate(query)]
      : [overseas]);
    const trip = await createDynamicTrip(
      'trip-country-guard', 'https://xhslink.com/o/port-dickson', booking,
      { frames: [] }, providerWith(search), ['La Playa Beach Bar & Restaurant'],
    );

    expect(trip.stops.map((stop) => stop.name)).toEqual(['Bengoh Dam']);
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
