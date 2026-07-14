import { describe, expect, it } from 'vitest';
import { parseGooglePlaces } from '../src/adapters/places/google';

describe('parseGooglePlaces', () => {
  it('returns source-backed place data and an opening window', () => {
    const places = parseGooglePlaces({
      places: [{
        id: 'place-1',
        displayName: { text: 'Borneo Cultures Museum' },
        formattedAddress: 'Kuching, Sarawak, Malaysia',
        location: { latitude: 1.555, longitude: 110.342 },
        googleMapsUri: 'https://maps.google.com/?cid=1',
        regularOpeningHours: {
          periods: [{ open: { hour: 9 }, close: { hour: 16, minute: 30 } }],
        },
      }],
    });
    expect(places[0]).toMatchObject({
      place_id: 'place-1',
      name: 'Borneo Cultures Museum',
      opening_window: { open_minute: 540, close_minute: 990 },
    });
  });
});
