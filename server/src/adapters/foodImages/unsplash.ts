import { z } from 'zod';
import type { DishImageQuery, DishPhoto, FoodImageProvider } from './types';

const API_URL = 'https://api.unsplash.com/search/photos';
const ResponseSchema = z.object({
  results: z.array(z.object({
    urls: z.object({ regular: z.string().url() }),
    links: z.object({ html: z.string().url() }),
    user: z.object({ name: z.string() }),
  })),
});

export function createUnsplashFoodImages(accessKey: string): FoodImageProvider {
  return {
    name: 'unsplash',
    async findDishPhoto(query) {
      for (const term of searchTerms(query)) {
        const photo = await searchUnsplash(accessKey, term);
        if (photo) return photo;
      }
      return null;
    },
  };
}

async function searchUnsplash(accessKey: string, query: string): Promise<DishPhoto | null> {
  const params = new URLSearchParams({
    query: `${query} food`,
    per_page: '1',
    orientation: 'landscape',
    content_filter: 'high',
  });
  const response = await fetch(`${API_URL}?${params.toString()}`, {
    headers: { Authorization: `Client-ID ${accessKey}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Unsplash failed (${response.status})`);
  const parsed = ResponseSchema.safeParse(await response.json());
  const photo = parsed.success ? parsed.data.results[0] : null;
  if (!photo) return null;
  return {
    imageUrl: photo.urls.regular,
    imageAttributions: [{
      label: `Illustrative photo by ${photo.user.name} on Unsplash`,
      source_url: trackingUrl(photo.links.html),
      license: 'Unsplash License',
    }],
  };
}

function searchTerms(query: DishImageQuery): string[] {
  return [...new Set([query.searchQuery, query.englishName].map((term) => term.trim()))];
}

function trackingUrl(value: string): string {
  const url = new URL(value);
  url.searchParams.set('utm_source', 'jalan2');
  url.searchParams.set('utm_medium', 'referral');
  return url.toString();
}
