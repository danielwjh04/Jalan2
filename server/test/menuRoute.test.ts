import { beforeEach, describe, expect, it } from 'vitest';
import { loadCachedMenu } from '../src/lib/fixtures';
import { attachDishImages, produceMenu, type MenuDeps } from '../src/pipeline/menu';
import { loadConfig } from '../src/config';
import { createMenu, getMenu, resetMenus } from '../src/store/menus';

function deps(mode: string): MenuDeps {
  return {
    config: loadConfig({ PIPELINE_MODE: mode }),
    openai: null,
    foodImages: { name: 'wikimedia', findDishPhoto: async () => null },
  };
}

describe('produceMenu', () => {
  it('serves the committed fixture as cache in cached mode', async () => {
    const result = await produceMenu(deps('cached'), 'irrelevant', 'image/jpeg');
    expect(result.servedFrom).toBe('cache');
    expect(result.menu.dishes.length).toBeGreaterThanOrEqual(20);
    for (const dish of result.menu.dishes) {
      expect(dish.taste_profile.length).toBeGreaterThan(20);
      expect(dish.texture_profile.length).toBeGreaterThan(10);
      if (dish.image_url) expect(dish.image_attributions).not.toHaveLength(0);
    }
    expect(result.menu.dishes.some((dish) => dish.name_local.includes('Mi Udang'))).toBe(true);
  });

  it('falls back to the fixture in auto mode without OpenAI', async () => {
    const result = await produceMenu(deps('auto'), 'irrelevant', 'image/jpeg');
    expect(result.servedFrom).toBe('cache');
  });

  it('fails hard in live mode without OpenAI', async () => {
    await expect(produceMenu(deps('live'), 'irrelevant', 'image/jpeg')).rejects.toThrow(
      'OpenAI',
    );
  });
});

describe('attachDishImages', () => {
  it('attaches a licensed dish-specific photo and its credit', async () => {
    const menu = loadCachedMenu();
    if (!menu) throw new Error('Missing cached menu');
    const dish = { ...menu.dishes[0], image_url: null, image_attributions: [] };
    const foodImages = {
      name: 'wikimedia' as const,
      findDishPhoto: async () => ({
        imageUrl: 'https://upload.wikimedia.org/kolo-mee.jpg',
        imageAttributions: [{
          label: 'Photo by Lemmas123',
          source_url: 'https://commons.wikimedia.org/wiki/File:Sarawak_Kolo_Mee_Noodle_Dish.jpg',
          license: 'CC0 1.0',
        }],
      }),
    };

    const result = await attachDishImages(
      foodImages,
      { stall_name: null, dishes: [dish] },
      async (_dish, candidates) => candidates[0] ?? null,
    );

    expect(result.dishes[0].image_url).toContain('wikimedia.org');
    expect(result.dishes[0].image_attributions[0]?.license).toBe('CC0 1.0');
  });

  it('uses the AI canonical food name for image search', async () => {
    const menu = loadCachedMenu();
    if (!menu) throw new Error('Missing cached menu');
    const dish = { ...menu.dishes[0], image_url: null, image_attributions: [] };
    let received = '';
    const foodImages = {
      name: 'openverse' as const,
      findDishPhoto: async (query: { searchQuery: string }) => {
        received = query.searchQuery;
        return null;
      },
    };

    await attachDishImages(
      foodImages,
      { stall_name: null, dishes: [dish] },
      async () => null,
    );

    expect(received).toBe('Malaysian mee udang prawn noodles');
  });

  it('does not attach an unverified keyword-search result', async () => {
    const menu = loadCachedMenu();
    if (!menu) throw new Error('Missing cached menu');
    const dish = { ...menu.dishes[0], image_url: null, image_attributions: [] };
    const foodImages = {
      name: 'openverse' as const,
      findDishPhoto: async () => ({
        imageUrl: 'https://example.com/unrelated-curry.jpg',
        imageAttributions: [],
      }),
    };

    const result = await attachDishImages(
      foodImages,
      { stall_name: null, dishes: [dish] },
      async () => null,
    );

    expect(result.dishes[0].image_url).toBeNull();
  });
});

describe('menu store', () => {
  beforeEach(() => {
    resetMenus();
  });

  it('round-trips a stored menu with aligned dish audio', () => {
    const menu = loadCachedMenu();
    expect(menu).not.toBeNull();
    if (!menu) return;
    const stored = createMenu(menu, 'cache', menu.dishes.map(() => null));
    const found = getMenu(stored.id);
    expect(found?.menu.dishes.length).toBe(menu.dishes.length);
    expect(found?.dishAudio.length).toBe(menu.dishes.length);
    expect(found?.servedFrom).toBe('cache');
  });

  it('keeps the scanned menu photo with its result', () => {
    const menu = loadCachedMenu();
    if (!menu) throw new Error('Missing cached menu');
    const sourceImage = { bytes: Buffer.from('menu photo'), mimeType: 'image/png' as const };
    const stored = createMenu(menu, 'cache', menu.dishes.map(() => null), sourceImage);

    expect(getMenu(stored.id)?.sourceImage).toEqual(sourceImage);
  });

  it('returns undefined for unknown ids', () => {
    expect(getMenu('nope')).toBeUndefined();
  });
});
