import { describe, expect, it } from 'vitest';
import { inMalaysiaBounds, regionFromCoordinates } from '../src/pipeline/region';

describe('regionFromCoordinates', () => {
  it('labels Kuala Lumpur coordinates', () => {
    expect(regionFromCoordinates({ lat: 3.139, lng: 101.6869 })).toBe('Kuala Lumpur, Malaysia');
  });

  it('labels George Town coordinates as Penang', () => {
    expect(regionFromCoordinates({ lat: 5.4141, lng: 100.3288 })).toBe('Penang, Malaysia');
  });

  it('labels the Kuching waterfront as Sarawak', () => {
    expect(regionFromCoordinates({ lat: 1.5593, lng: 110.3439 })).toBe('Sarawak, Malaysia');
  });

  it('labels Kota Kinabalu as Sabah', () => {
    expect(regionFromCoordinates({ lat: 5.9788, lng: 116.0753 })).toBe('Sabah, Malaysia');
  });

  it('falls back to Malaysia for out-of-bounds coordinates', () => {
    expect(regionFromCoordinates({ lat: 13.75, lng: 100.5 })).toBe('Malaysia');
  });
});

describe('inMalaysiaBounds', () => {
  it('accepts points inside the bounding box', () => {
    expect(inMalaysiaBounds({ lat: 3.139, lng: 101.6869 })).toBe(true);
  });

  it('rejects points outside the bounding box', () => {
    expect(inMalaysiaBounds({ lat: 40.7, lng: -74.0 })).toBe(false);
  });
});
