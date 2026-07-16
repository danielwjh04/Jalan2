import { describe, expect, it, vi } from 'vitest';
import type { PlaceCandidate } from '@shared/trip';
import type { PlacesProvider } from '../src/adapters/places/types';
import { loadCachedTrip } from '../src/lib/fixtures';
import { recommendAlongRoute } from '../src/services/routeSuggestions';

function candidate(id: string, lat: number, lng: number, rating: number, count: number): PlaceCandidate {
  return {
    place_id: id,
    name: id,
    address: `${id}, Kuching`,
    location: { lat, lng },
    google_maps_url: `https://maps.google.com/?q=${id}`,
    opening_window: null,
    suggested_activity: `Visit ${id}.`,
    primary_type: 'tourist_attraction',
    reservation_hint: null,
    place_photo_available: true,
    place_photo_attributions: [],
    image_url: null,
    image_attributions: [],
    rating,
    user_rating_count: count,
  };
}

describe('recommendAlongRoute', () => {
  it('ranks popular low-detour stops and rejects existing or distant places', async () => {
    const trip = loadCachedTrip('kuching-city-guide-01');
    if (!trip) throw new Error('Missing city fixture');
    const nearbyPopular = vi.fn(async () => [
      candidate('popular-midpoint', 1.556, 110.350, 4.8, 2400),
      candidate('quiet-midpoint', 1.556, 110.351, 3.7, 12),
      candidate('far-away', 1.63, 110.50, 5, 9000),
      candidate('ChIJJQQqoDGn-zERTw2i1LGpqnk', 1.555, 110.342, 4.9, 5000),
      { ...candidate('duplicate-by-name', 1.556, 110.350, 5, 9000), name: 'Borneo Cultures Museum' },
    ]);
    const withImages = vi.fn(async (candidates: PlaceCandidate[]) => candidates);
    const places: PlacesProvider = {
      name: 'google',
      search: async () => [],
      nearbyPopular,
      withImages,
      photo: async () => null,
    };

    const suggestions = await recommendAlongRoute(trip, places);

    expect(nearbyPopular).toHaveBeenCalled();
    expect(withImages).toHaveBeenCalledOnce();
    expect(withImages.mock.calls[0][0]).toHaveLength(2);
    expect(suggestions.map((place) => place.place_id)).toEqual([
      'popular-midpoint',
      'quiet-midpoint',
    ]);
    expect(suggestions[0].route_distance_meters).toBeLessThan(1500);
  });
});
