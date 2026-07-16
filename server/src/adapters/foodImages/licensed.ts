import type { DishImageQuery, DishPhoto, FoodImageProvider } from './types';
import { createOpenverseFoodImages } from './openverse';
import { createUnsplashFoodImages } from './unsplash';
import { createWikimediaFoodImages } from './wikimedia';

export function createLicensedFoodImages(unsplashAccessKey?: string): FoodImageProvider {
  const providers: FoodImageProvider[] = [
    createOpenverseFoodImages(),
    createWikimediaFoodImages(),
  ];
  if (unsplashAccessKey) providers.push(createUnsplashFoodImages(unsplashAccessKey));
  return {
    name: 'licensed-chain',
    async findDishPhoto(query) {
      return (await findCandidates(providers, query, 1))[0] ?? null;
    },
    async findDishPhotos(query, limit) {
      return findCandidates(providers, query, limit);
    },
  };
}

async function findCandidates(
  providers: FoodImageProvider[],
  query: DishImageQuery,
  limit: number,
): Promise<DishPhoto[]> {
  const photos: DishPhoto[] = [];
  const seen = new Set<string>();
  for (const provider of providers) {
    try {
      const candidates = provider.findDishPhotos
        ? await provider.findDishPhotos(query, Math.max(2, limit - photos.length))
        : [await provider.findDishPhoto(query)].filter((photo) => photo !== null);
      for (const photo of candidates) {
        if (seen.has(photo.imageUrl)) continue;
        photos.push(photo);
        seen.add(photo.imageUrl);
        if (photos.length >= limit) return photos;
      }
    } catch {
      continue;
    }
  }
  return photos;
}
