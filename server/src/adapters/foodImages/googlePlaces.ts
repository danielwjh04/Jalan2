import type { DishImageQuery, DishPhoto, FoodImageProvider } from './types';
import type { PlacesProvider } from '../places/types';

export function createGooglePlacesFoodImages(places: PlacesProvider): FoodImageProvider {
  return {
    name: 'google-places',
    async findDishPhoto(query) {
      return (await this.findDishPhotos!(query, 1))[0] ?? null;
    },
    async findDishPhotos(query, limit) {
      const stall = await groundedStall(query, places);
      if (!stall?.place_photo_available) return [];
      const photos: DishPhoto[] = [];
      for (let index = 0; index < Math.min(8, Math.max(1, limit)); index += 1) {
        const photo = await places.photo(stall.place_id, index).catch(() => null);
        if (!photo) break;
        photos.push({
          imageUrl: `data:${photo.contentType};base64,${Buffer.from(photo.bytes).toString('base64')}`,
          displayUrl: `/places/${encodeURIComponent(stall.place_id)}/photo?index=${index}`,
          imageAttributions: photo.attributions ?? stall.place_photo_attributions,
        });
      }
      return photos;
    },
  };
}

async function groundedStall(query: DishImageQuery, places: PlacesProvider) {
  const wanted = normalize(query.stallName ?? '');
  if (wanted.length < 3) return null;
  const candidates = await places.search(query.stallName!, 'Malaysia');
  return candidates.find((candidate) => {
    const name = normalize(candidate.name);
    return name === wanted || name.includes(wanted) || wanted.includes(name);
  }) ?? null;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]+/gu, ' ').trim();
}
