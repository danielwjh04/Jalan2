import type { FoodImageProvider } from './types';
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
      for (const provider of providers) {
        try {
          const photo = await provider.findDishPhoto(query);
          if (photo) return photo;
        } catch {
          continue;
        }
      }
      return null;
    },
  };
}
