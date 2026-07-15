import { describe, expect, it } from 'vitest';
import type { TripStop } from '@shared/trip';
import { findMeetingPointStop } from '../src/lib/meetingPointStop';

function stop(name: string, lat: number, lng: number): TripStop {
  return {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    summary: `Explore ${name}.`,
    location: { lat, lng },
    image_url: null,
    estimated_spend_myr: null,
    duration_minutes: 60,
    sources: [],
    place_id: `place-${name}`,
    address: `${name}, Malaysia`,
    google_maps_url: 'https://maps.google.com/?q=x',
    opening_window: null,
    primary_type: null,
    reservation_hint: null,
    place_photo_available: true,
    place_photo_attributions: [],
    image_attributions: [],
    easybook_url: null,
  };
}

const stops = [
  stop('Sri Bintang Hill', 3.1842, 101.6438),
  stop('Kepong Metropolitan Park', 3.2072, 101.6412),
];

describe('findMeetingPointStop', () => {
  it('matches a stop by name regardless of casing', () => {
    const found = findMeetingPointStop({ stops }, {
      name: 'sri bintang hill',
      lat: 0,
      lng: 0,
    });
    expect(found?.place_id).toBe('place-Sri Bintang Hill');
  });

  it('falls back to the nearest stop within 500 meters', () => {
    const found = findMeetingPointStop({ stops }, {
      name: 'Trailhead carpark',
      lat: 3.1858,
      lng: 101.6442,
    });
    expect(found?.name).toBe('Sri Bintang Hill');
  });

  it('returns null when nothing is close enough', () => {
    const found = findMeetingPointStop({ stops }, {
      name: 'Batu Caves',
      lat: 3.2379,
      lng: 101.684,
    });
    expect(found).toBeNull();
  });

  it('returns null without a trip', () => {
    expect(findMeetingPointStop(null, { name: 'Anywhere', lat: 3, lng: 101 })).toBeNull();
  });
});
