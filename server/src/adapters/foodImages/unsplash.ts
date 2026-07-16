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
      return (await this.findDishPhotos!(query, 1))[0] ?? null;
    },
    async findDishPhotos(query, limit) {
      const photos: DishPhoto[] = [];
      const seen = new Set<string>();
      for (const term of searchTerms(query)) {
        for (const photo of await searchUnsplash(accessKey, term, limit)) {
          if (seen.has(photo.imageUrl)) continue;
          photos.push(photo);
          seen.add(photo.imageUrl);
          if (photos.length >= limit) return photos;
        }
      }
      return photos;
    },
  };
}

async function searchUnsplash(accessKey: string, query: string, limit: number): Promise<DishPhoto[]> {
  const params = new URLSearchParams({
    query: `${query} food`,
    per_page: String(Math.min(8, Math.max(1, limit))),
    orientation: 'landscape',
    content_filter: 'high',
  });
  const response = await fetch(`${API_URL}?${params.toString()}`, {
    headers: { Authorization: `Client-ID ${accessKey}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Unsplash failed (${response.status})`);
  const parsed = ResponseSchema.safeParse(await response.json());
  if (!parsed.success) return [];
  return parsed.data.results.map((photo) => ({
    imageUrl: photo.urls.regular,
    imageAttributions: [{
      label: `Illustrative photo by ${photo.user.name} on Unsplash`,
      source_url: trackingUrl(photo.links.html),
      license: 'Unsplash License',
    }],
  }));
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
