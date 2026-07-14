import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGooglePlaces, parseGooglePlaces } from '../src/adapters/places/google';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('parseGooglePlaces', () => {
  it('returns source-backed place data and an opening window', () => {
    const places = parseGooglePlaces({
      places: [{
        id: 'place-1',
        displayName: { text: 'Borneo Cultures Museum' },
        formattedAddress: 'Kuching, Sarawak, Malaysia',
        location: { latitude: 1.555, longitude: 110.342 },
        googleMapsUri: 'https://maps.google.com/?cid=1',
        primaryType: 'museum',
        primaryTypeDisplayName: { text: 'Museum' },
        photos: [{
          name: 'places/place-1/photos/photo-1',
          widthPx: 1600,
          heightPx: 900,
          authorAttributions: [{
            displayName: 'Sarawak Traveller',
            uri: '//maps.google.com/maps/contrib/123',
            photoUri: '//lh3.googleusercontent.com/avatar',
          }],
        }],
        regularOpeningHours: {
          periods: [{ open: { hour: 9 }, close: { hour: 16, minute: 30 } }],
        },
      }],
    });
    expect(places[0]).toMatchObject({
      place_id: 'place-1',
      name: 'Borneo Cultures Museum',
      opening_window: { open_minute: 540, close_minute: 990 },
      suggested_activity: 'Explore the exhibitions and learn about local history and culture.',
      place_photo_available: true,
      place_photo_attributions: [{
        label: 'Photo by Sarawak Traveller',
        source_url: 'https://maps.google.com/maps/contrib/123',
        license: null,
      }],
    });
  });

  it('refreshes the photo name before downloading Google media', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        photos: [{ name: 'places/place-1/photos/current-photo' }],
      }), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(Uint8Array.from([1, 2, 3]), {
        status: 200,
        headers: { 'content-type': 'image/jpeg' },
      }));
    vi.stubGlobal('fetch', fetchMock);

    const photo = await createGooglePlaces('server-secret').photo('place-1');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/v1/places/place-1');
    expect(String(fetchMock.mock.calls[1][0])).toContain('/current-photo/media');
    expect(photo?.contentType).toBe('image/jpeg');
    expect(Array.from(photo?.bytes ?? [])).toEqual([1, 2, 3]);
  });
});
