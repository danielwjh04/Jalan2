import { z } from 'zod';
import type { DishPhoto, FoodImageProvider, PlaceImageProvider } from './types';

const API_URL = 'https://commons.wikimedia.org/w/api.php';
const MetadataSchema = z.object({ value: z.string() });
const ImageInfoSchema = z.object({
  url: z.string().url(),
  thumburl: z.string().url().optional(),
  descriptionurl: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  user: z.string().optional(),
  extmetadata: z.object({
    Artist: MetadataSchema.optional(),
    LicenseShortName: MetadataSchema.optional(),
    LicenseUrl: MetadataSchema.optional(),
  }).optional(),
});
const PageSchema = z.object({ imageinfo: z.array(ImageInfoSchema).optional() });
const ResponseSchema = z.object({
  query: z.object({ pages: z.record(PageSchema) }).optional(),
});

export function parseWikimediaDishPhoto(payload: unknown): DishPhoto | null {
  const parsed = ResponseSchema.safeParse(payload);
  if (!parsed.success) return null;
  for (const page of Object.values(parsed.data.query?.pages ?? {})) {
    const photo = toDishPhoto(page.imageinfo?.[0]);
    if (photo) return photo;
  }
  return null;
}

export function createWikimediaFoodImages(): FoodImageProvider {
  return {
    name: 'wikimedia',
    async findDishPhoto(name) {
      return fetchWikimediaPhoto(`"${name}" Malaysian food filetype:bitmap`);
    },
  };
}

export function createWikimediaPlaceImages(): PlaceImageProvider {
  return {
    name: 'wikimedia',
    async findPlacePhoto(name) {
      return fetchWikimediaPhoto(`${name} Malaysia filetype:bitmap`);
    },
  };
}

async function fetchWikimediaPhoto(query: string): Promise<DishPhoto | null> {
  const response = await fetch(searchUrl(query), { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`Wikimedia Commons failed (${response.status})`);
  return parseWikimediaDishPhoto(await response.json());
}

function searchUrl(query: string): string {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: '5',
    prop: 'imageinfo',
    iiprop: 'url|size|user|extmetadata',
    iiurlwidth: '1200',
    iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl',
  });
  return `${API_URL}?${params.toString()}`;
}

function toDishPhoto(info?: z.infer<typeof ImageInfoSchema>): DishPhoto | null {
  const license = info?.extmetadata?.LicenseShortName?.value.trim();
  if (!info || !license || Math.max(info.width, info.height) < 1200) return null;
  const artist = cleanText(info.extmetadata?.Artist?.value ?? info.user ?? 'Wikimedia contributor');
  return {
    imageUrl: info.thumburl ?? info.url,
    imageAttributions: [{
      label: `Photo by ${artist}`,
      source_url: info.descriptionurl,
      license,
    }],
  };
}

function cleanText(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}
