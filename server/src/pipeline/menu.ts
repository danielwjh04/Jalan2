import OpenAI from 'openai';
import type { MenuJson } from '@shared/menu';
import type { Config } from '../config';
import type { FoodImageProvider } from '../adapters/foodImages/types';
import { NotConfiguredError } from '../lib/errors';
import { loadCachedMenu } from '../lib/fixtures';
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
): Promise<MenuJson> {
  const dishes = await Promise.all(
    menu.dishes.map(async (dish) => {
      if (dish.image_url) return dish;
      try {
        const photo = await foodImages.findDishPhoto({
          localName: dish.name_local,
          englishName: dish.name_english,
          searchQuery: dish.image_search_query,
        });
        if (!photo) return dish;
        return {
          ...dish,
          image_url: photo.imageUrl,
          image_attributions: photo.imageAttributions,
        };
      } catch {
        return dish;
      }
    }),
  );
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
    const menu = await readMenu(deps.openai, deps.config.OPENAI_MENU_MODEL, imageBase64, mimeType);
    return { menu: await attachDishImages(deps.foodImages, menu), servedFrom: 'live' };
  } catch (error) {
    if (deps.config.PIPELINE_MODE === 'live') throw error;
    const cached = loadCachedMenu();
    if (!cached) throw error;
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[menu] live read failed (${reason}); serving cached menu`);
    return { menu: cached, servedFrom: 'cache' };
  }
}
