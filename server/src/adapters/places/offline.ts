import type { PlaceCandidate } from '@shared/trip';
import { KUCHING_GAZETTEER } from '../../pipeline/gazetteer';
import type { PlacesProvider } from './types';

export function createOfflinePlaces(): PlacesProvider {
  return {
    name: 'offline',
    async search(query) {
      const words = query.toLowerCase().split(/\s+/).filter(Boolean);
      return KUCHING_GAZETTEER
        .filter((place) => words.some((word) => place.name.toLowerCase().includes(word)))
        .slice(0, 5)
        .map(toCandidate);
    },
  };
}

function toCandidate(place: { name: string; lat: number; lng: number }): PlaceCandidate {
  return {
    place_id: `offline-${slug(place.name)}`,
    name: place.name,
    address: `${place.name}, Sarawak, Malaysia`,
    location: { lat: place.lat, lng: place.lng },
    google_maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`,
    opening_window: null,
  };
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
