import { haversineMeters, type PlaceCandidate } from '@shared/trip';
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
    async nearbyPopular(center, radiusMeters) {
      return KUCHING_GAZETTEER
        .map(toCandidate)
        .filter((place) => haversineMeters(center, place.location) <= radiusMeters)
        .slice(0, 5);
    },
    async photo() {
      return null;
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
    suggested_activity: `Explore ${place.name} and check the latest visitor information before you go.`,
    place_photo_available: false,
    place_photo_attributions: [],
    image_url: null,
    image_attributions: [],
  };
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
