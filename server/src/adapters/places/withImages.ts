import type { PlaceCandidate } from '@shared/trip';
import type { PlaceImageProvider } from '../foodImages/types';
import type { PlacesProvider } from './types';

export function withLicensedPlaceImages(
  places: PlacesProvider,
  images: PlaceImageProvider,
): PlacesProvider {
  return {
    name: places.name,
    photo: (placeId, index) => places.photo(placeId, index),
    withImages: (candidates) => attachAll(candidates, images),
    nearbyPopular: places.nearbyPopular
      ? async (center, radiusMeters) => places.nearbyPopular?.(center, radiusMeters) ?? []
      : undefined,
    async search(query, region) {
      const candidates = await places.search(query, region);
      return attachAll(candidates, images);
    },
  };
}

function attachAll(candidates: PlaceCandidate[], images: PlaceImageProvider): Promise<PlaceCandidate[]> {
  return Promise.all(candidates.map((candidate) => attachFallback(candidate, images)));
}

async function attachFallback(
  candidate: PlaceCandidate,
  images: PlaceImageProvider,
): Promise<PlaceCandidate> {
  // Keep a licensed fallback even when Google advertises a photo. The proxied
  // Google media request can still fail because of quota, billing or a stale
  // photo reference; the client can then switch sources instead of showing a
  // blank tile.
  if (candidate.image_url) return candidate;
  try {
    const photo = await images.findPlacePhoto(candidate.name, candidate.address);
    return photo ? {
      ...candidate,
      image_url: photo.imageUrl,
      image_attributions: photo.imageAttributions,
    } : candidate;
  } catch {
    return candidate;
  }
}
