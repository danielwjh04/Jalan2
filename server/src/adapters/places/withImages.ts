import type { PlaceCandidate } from '@shared/trip';
import type { PlaceImageProvider } from '../foodImages/types';
import type { PlacesProvider } from './types';

export function withLicensedPlaceImages(
  places: PlacesProvider,
  images: PlaceImageProvider,
): PlacesProvider {
  return {
    name: places.name,
    photo: (placeId) => places.photo(placeId),
    async search(query, region) {
      const candidates = await places.search(query, region);
      return Promise.all(candidates.map((candidate) => attachFallback(candidate, images)));
    },
  };
}

async function attachFallback(
  candidate: PlaceCandidate,
  images: PlaceImageProvider,
): Promise<PlaceCandidate> {
  if (candidate.place_photo_available || candidate.image_url) return candidate;
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
