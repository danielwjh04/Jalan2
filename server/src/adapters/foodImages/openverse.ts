import { z } from 'zod';
import type { DishImageQuery, DishPhoto, FoodImageProvider } from './types';

const API_URL = 'https://api.openverse.org/v1/images/';
const ResultSchema = z.object({
  title: z.string().nullable(),
  url: z.string().url(),
  creator: z.string().nullable(),
  license: z.string(),
  license_version: z.string().nullable(),
  foreign_landing_url: z.string().url(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  mature: z.boolean(),
  tags: z.array(z.object({ name: z.string() })).default([]),
});
const ResponseSchema = z.object({ results: z.array(ResultSchema) });

export function createOpenverseFoodImages(): FoodImageProvider {
  const cache = new Map<string, DishPhoto | null>();
  return {
    name: 'openverse',
    async findDishPhoto(query) {
      const key = query.searchQuery.trim().toLowerCase();
      if (cache.has(key)) return cache.get(key) ?? null;
      const photo = await searchQueries(query);
      cache.set(key, photo);
      return photo;
    },
  };
}

async function searchQueries(query: DishImageQuery): Promise<DishPhoto | null> {
  const terms = uniqueTerms([
    query.searchQuery,
    simplifyQuery(query.searchQuery),
    romanName(query.localName),
    query.englishName,
  ]);
  for (const term of terms) {
    const photo = await searchOpenverse(term);
    if (photo) return photo;
  }
  return null;
}

async function searchOpenverse(query: string): Promise<DishPhoto | null> {
  const response = await fetch(searchUrl(query), {
    headers: { 'User-Agent': 'Jalan2/0.1 (licensed food image lookup)' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Openverse failed (${response.status})`);
  const parsed = ResponseSchema.safeParse(await response.json());
  if (!parsed.success) return null;
  const candidates = parsed.data.results.filter((photo) => (
    isUsablePhoto(photo) && isRelevant(photo, query)
  ));
  const photo = candidates.sort((a, b) => score(b, query) - score(a, query))[0];
  return photo ? toDishPhoto(photo) : null;
}

function searchUrl(query: string): string {
  const params = new URLSearchParams({
    q: query,
    category: 'photograph',
    license: 'by,by-sa,cc0,pdm',
    page_size: '10',
  });
  return `${API_URL}?${params.toString()}`;
}

function isUsablePhoto(photo: z.infer<typeof ResultSchema>): boolean {
  return !photo.mature && (photo.width ?? 0) >= 800 && (photo.height ?? 0) >= 500;
}

function score(photo: z.infer<typeof ResultSchema>, query: string): number {
  const text = `${photo.title ?? ''} ${photo.tags.map((tag) => tag.name).join(' ')}`.toLowerCase();
  const textTokens = new Set(text.split(/[^a-z0-9]+/).filter(Boolean));
  const tokens = query.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
  const matches = tokens.filter((token) => [...textTokens].some((word) => (
    word === token || (token.length >= 4 && word.includes(token))
  ))).length;
  const landscape = (photo.width ?? 0) >= (photo.height ?? 0) ? 2 : 0;
  return matches * 3 + landscape;
}

function isRelevant(photo: z.infer<typeof ResultSchema>, query: string): boolean {
  const foodWords = new Set([
    'food', 'dish', 'meal', 'cuisine', 'restaurant', 'noodle', 'noodles',
    'soup', 'bun', 'vermicelli', 'pasta', 'rice', 'pork', 'chicken', 'prawn',
  ]);
  const text = `${photo.title ?? ''} ${photo.tags.map((tag) => tag.name).join(' ')}`;
  const words = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return score(photo, query) >= 3 && words.some((word) => foodWords.has(word));
}

function toDishPhoto(photo: z.infer<typeof ResultSchema>): DishPhoto {
  const creator = photo.creator?.trim() || 'Openverse contributor';
  const version = photo.license_version ? ` ${photo.license_version}` : '';
  return {
    imageUrl: photo.url,
    imageAttributions: [{
      label: `Illustrative photo by ${creator}`,
      source_url: photo.foreign_landing_url,
      license: `${photo.license.toUpperCase()}${version}`,
    }],
  };
}

function uniqueTerms(terms: string[]): string[] {
  return [...new Set(terms.map((term) => term.trim()).filter(Boolean))];
}

function simplifyQuery(value: string): string {
  return value.replace(/\b(?:Malaysian|Malaysia)\b/gi, '').replace(/\s+/g, ' ').trim();
}

function romanName(value: string): string {
  return value.split('/').at(-1)?.trim() ?? value;
}
