import { describe, expect, it, vi } from 'vitest';
import type { PlacesProvider } from '../src/adapters/places/types';
import { createGooglePlacesFoodImages } from '../src/adapters/foodImages/googlePlaces';

describe('Google Places food photos', () => {
  it('uses photos only after the scanned stall name grounds to the same venue', async () => {
    const photo = vi.fn(async (_id: string, index = 0) => index === 0 ? {
      bytes: new Uint8Array([1, 2, 3]), contentType: 'image/jpeg',
      attributions: [{ label: 'Photo by A on Google Maps', source_url: 'https://maps.google.com/a', license: null }],
    } : null);
    const places: PlacesProvider = {
      name: 'google',
      search: async () => [{
        place_id: 'stall-123', name: 'Nam Heong Coffee Shop', address: 'Ipoh',
        location: { lat: 4.59, lng: 101.08 }, google_maps_url: 'https://maps.google.com/stall',
        opening_window: null, suggested_activity: 'Eat.', place_photo_available: true,
        place_photo_attributions: [], image_url: null, image_attributions: [],
      }],
      photo,
    };
    const candidates = await createGooglePlacesFoodImages(places).findDishPhotos!({
      localName: '伊面', englishName: 'Yee mee', searchQuery: 'Malaysian yee mee',
      stallName: 'Nam Heong Coffee Shop',
    }, 3);

    expect(candidates).toHaveLength(1);
    expect(candidates[0].imageUrl).toMatch(/^data:image\/jpeg;base64,/);
    expect(candidates[0].displayUrl).toBe('/places/stall-123/photo?index=0');
    expect(candidates[0].imageAttributions[0].label).toContain('Google Maps');
  });

  it('does not search random venues when the menu has no grounded stall name', async () => {
    const search = vi.fn(async () => []);
    const provider = createGooglePlacesFoodImages({ name: 'google', search, photo: async () => null });
    expect(await provider.findDishPhotos!({
      localName: '伊面', englishName: 'Yee mee', searchQuery: 'Malaysian yee mee', stallName: null,
    }, 3)).toEqual([]);
    expect(search).not.toHaveBeenCalled();
  });
});
