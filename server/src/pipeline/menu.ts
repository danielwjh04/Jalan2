import OpenAI from 'openai';
import type { MenuJson } from '@shared/menu';
import type { Config } from '../config';
import type { FoodImageProvider } from '../adapters/foodImages/types';
import { NotConfiguredError } from '../lib/errors';
import { loadCachedMenu } from '../lib/fixtures';
import { createOpenAIDishPhotoVerifier, type DishPhotoVerifier } from './dishPhotoVerifier';
import { readMenu } from './menuVision';

export interface MenuDeps {
  config: Config;
  openai: OpenAI | null;
  foodImages: FoodImageProvider;
}

export interface MenuProduceResult {
  menu: MenuJson;
  servedFrom: 'live' | 'cache';
}

export async function attachDishImages(
  foodImages: FoodImageProvider,
  menu: MenuJson,
  verifyPhoto?: DishPhotoVerifier,
): Promise<MenuJson> {
  if (!verifyPhoto) return menu;
  const dishes = await mapWithConcurrency(menu.dishes, 3, async (dish) => {
      if (dish.image_url) return dish;
      try {
        const query = {
          localName: dish.name_local,
          englishName: dish.name_english,
          searchQuery: dish.image_search_query,
        };
        const candidates = foodImages.findDishPhotos
          ? await foodImages.findDishPhotos(query, 5)
          : [await foodImages.findDishPhoto(query)].filter((photo) => photo !== null);
        const photo = await verifyPhoto(dish, candidates);
        if (!photo) return dish;
        return {
          ...dish,
          image_url: photo.imageUrl,
          image_attributions: photo.imageAttributions,
        };
      } catch {
        return dish;
      }
    });
  return { ...menu, dishes };
}

export async function produceMenu(
  deps: MenuDeps,
  imageBase64: string,
  mimeType: string,
): Promise<MenuProduceResult> {
  if (deps.config.PIPELINE_MODE === 'cached') {
    const cached = loadCachedMenu();
    if (!cached) throw new Error('No cached menu fixture available');
    return { menu: cached, servedFrom: 'cache' };
  }
  try {
    if (!deps.openai) {
      throw new NotConfiguredError('OpenAI', 'Set OPENAI_API_KEY or use PIPELINE_MODE=cached.');
    }
    const menu = await readMenu(
      deps.openai,
      deps.config.OPENAI_MENU_MODEL,
      imageBase64,
      mimeType,
      deps.config.OPENAI_MENU_LOCALIZATION_MODEL,
    );
    const verifier = createOpenAIDishPhotoVerifier(deps.openai, deps.config.OPENAI_MENU_MODEL);
    return { menu: await attachDishImages(deps.foodImages, menu, verifier), servedFrom: 'live' };
  } catch (error) {
    if (deps.config.PIPELINE_MODE === 'live') throw error;
    const cached = loadCachedMenu();
    if (!cached) throw error;
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[menu] live read failed (${reason}); serving cached menu`);
    return { menu: cached, servedFrom: 'cache' };
  }
}

async function mapWithConcurrency<T, R>(
  values: T[],
  limit: number,
  task: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor++;
      results[index] = await task(values[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, () => worker()));
  return results;
}
