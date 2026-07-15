import { describe, expect, it, vi } from 'vitest';
import type { PlacesProvider } from '../src/adapters/places/types';
import { withLicensedPlaceImages } from '../src/adapters/places/withImages';

const candidate = {
  place_id: 'ksl-city',
  name: 'KSL City Mall',
  address: 'Johor Bahru, Johor, Malaysia',
  location: { lat: 1.4856, lng: 103.7622 },
  google_maps_url: 'https://maps.google.com/?cid=1',
  opening_window: null,
  suggested_activity: 'Browse the shops and try local food.',
  place_photo_available: false,
  place_photo_attributions: [],
  image_url: null,
  image_attributions: [],
};

const photo = {
  imageUrl: 'https://upload.wikimedia.org/ksl-city.jpg',
  imageAttributions: [{
    label: 'Photo by Chongkian',
    source_url: 'https://commons.wikimedia.org/wiki/File:KSL_City.jpg',
    license: 'CC BY-SA 4.0',
  }],
};

describe('withLicensedPlaceImages', () => {
  it('adds an exact licensed fallback when Google has no photo', async () => {
    const places: PlacesProvider = {
      name: 'google',
      search: async () => [candidate],
      photo: async () => null,
    };
    const findPlacePhoto = vi.fn(async () => photo);

    const results = await withLicensedPlaceImages(places, {
      name: 'wikimedia',
      findPlacePhoto,
    }).search('KSL City Mall', 'Malaysia');

    expect(findPlacePhoto).toHaveBeenCalledWith('KSL City Mall', candidate.address);
    expect(results[0].image_url).toContain('wikimedia.org');
    expect(results[0].image_attributions[0]?.license).toBe('CC BY-SA 4.0');
  });

  it('does not request a fallback when Google has a photo', async () => {
    const places: PlacesProvider = {
      name: 'google',
      search: async () => [{ ...candidate, place_photo_available: true }],
      photo: async () => null,
    };
    const findPlacePhoto = vi.fn(async () => null);

    await withLicensedPlaceImages(places, { name: 'wikimedia', findPlacePhoto })
      .search('KSL City Mall', 'Malaysia');

    expect(findPlacePhoto).not.toHaveBeenCalled();
  });

  it('preserves and enriches popularity-ranked nearby results', async () => {
    const nearbyPopular = vi.fn(async () => [candidate]);
    const places: PlacesProvider = {
      name: 'google',
      search: async () => [],
      nearbyPopular,
      photo: async () => null,
    };
    const images = { name: 'wikimedia' as const, findPlacePhoto: vi.fn(async () => photo) };

    const results = await withLicensedPlaceImages(places, images).nearbyPopular?.(
      { lat: 1.55, lng: 110.34 },
      2500,
    );

    expect(nearbyPopular).toHaveBeenCalledOnce();
    expect(results?.[0].image_url).toBe(photo.imageUrl);
  });
});
