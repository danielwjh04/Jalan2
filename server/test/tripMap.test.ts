import { describe, expect, it } from 'vitest';
import type { TripStop } from '@shared/trip';
import { buildGoogleStaticTripMapUrl, selectTripMapStops } from '../src/services/tripMap';

const stops: TripStop[] = [
  stop('start', 'Kuala Lumpur', 3.139, 101.6869),
  stop('finish', 'Gopeng', 4.4721, 101.165),
];

describe('Google static trip map', () => {
  it('builds a labeled Google Maps image request with a route path', () => {
    const url = new URL(buildGoogleStaticTripMapUrl('server-secret', stops));
    expect(url.origin).toBe('https://maps.googleapis.com');
    expect(url.pathname).toBe('/maps/api/staticmap');
    expect(url.searchParams.get('key')).toBe('server-secret');
    expect(url.searchParams.getAll('markers')).toHaveLength(2);
    expect(url.searchParams.get('path')).toContain('3.139,101.6869|4.4721,101.165');
    expect(url.searchParams.get('scale')).toBe('2');
  });

  it('keeps the client stop order and rejects unknown stop IDs', () => {
    expect(selectTripMapStops(stops, ['finish', 'start']).map((stop) => stop.id)).toEqual(['finish', 'start']);
    expect(() => selectTripMapStops(stops, ['missing'])).toThrow('Unknown map stop missing');
  });
});

function stop(id: string, name: string, lat: number, lng: number): TripStop {
  return {
    id,
    name,
    summary: name,
    location: { lat, lng },
    image_url: null,
    place_photo_available: false,
    place_photo_attributions: [],
    image_attributions: [],
    estimated_spend_myr: null,
    duration_minutes: 60,
    sources: [{ title: name, url: 'https://example.com/place' }],
  };
}
