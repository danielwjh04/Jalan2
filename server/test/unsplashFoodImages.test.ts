import { afterEach, describe, expect, it, vi } from 'vitest';
import { createUnsplashFoodImages } from '../src/adapters/foodImages/unsplash';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Unsplash food images', () => {
  it('keeps the hotlinked image and required creator attribution', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      results: [{
        urls: { regular: 'https://images.unsplash.com/photo-food' },
        links: { html: 'https://unsplash.com/photos/food-photo' },
        user: { name: 'Aisha Lee' },
      }],
    })));
    vi.stubGlobal('fetch', fetchMock);

    const photo = await createUnsplashFoodImages('demo-key').findDishPhoto({
      localName: 'Mi Kari',
      englishName: 'Malaysian curry noodles',
      searchQuery: 'curry mee',
    });

    expect(photo?.imageUrl).toBe('https://images.unsplash.com/photo-food');
    expect(photo?.imageAttributions[0]?.label).toContain('Aisha Lee on Unsplash');
    expect(photo?.imageAttributions[0]?.source_url).toContain('utm_source=jalan2');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('query=curry+mee+food'),
      expect.objectContaining({ headers: { Authorization: 'Client-ID demo-key' } }),
    );
  });
});
