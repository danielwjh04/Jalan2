import { beforeEach, describe, expect, it } from 'vitest';
import { loadCachedMenu } from '../src/lib/fixtures';
import { produceMenu, type MenuDeps } from '../src/pipeline/menu';
import { loadConfig } from '../src/config';
import { createFixtureRetrieval } from '../src/adapters/retrieval/fixture';
import { createMenu, getMenu, resetMenus } from '../src/store/menus';

function deps(mode: string): MenuDeps {
  return {
    config: loadConfig({ PIPELINE_MODE: mode }),
    openai: null,
    retrieval: createFixtureRetrieval(),
  };
}

describe('produceMenu', () => {
  it('serves the committed fixture as cache in cached mode', async () => {
    const result = await produceMenu(deps('cached'), 'irrelevant', 'image/jpeg');
    expect(result.servedFrom).toBe('cache');
    expect(result.menu.dishes.length).toBeGreaterThan(0);
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

  it('returns undefined for unknown ids', () => {
    expect(getMenu('nope')).toBeUndefined();
  });
});
