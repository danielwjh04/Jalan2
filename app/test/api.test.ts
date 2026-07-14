import { describe, expect, it } from 'vitest';
import * as baseUrls from '../src/lib/baseUrl';

describe('resolveBaseUrl', () => {
  it('uses EXPO_PUBLIC_API_BASE_URL when the primary API URL is absent', () => {
    expect(
      baseUrls.resolveBaseUrl({
        apiUrl: undefined,
        apiBaseUrl: 'http://192.168.1.23:3001',
        hostUri: 'localhost:8081',
      }),
    ).toBe('http://192.168.1.23:3001');
  });
});

describe('placePhotoUrl', () => {
  it('encodes the place ID and keeps the Google key on the backend', () => {
    expect(baseUrls.buildPlacePhotoUrl('http://192.168.1.23:3001', 'place/id')).toBe(
      'http://192.168.1.23:3001/places/place%2Fid/photo',
    );
  });
});
