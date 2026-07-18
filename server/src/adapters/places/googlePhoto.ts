import { z } from 'zod';
import type { PlacePhoto } from './types';

const PLACE_URL = 'https://places.googleapis.com/v1/places';
const PhotoResponseSchema = z.object({
  photos: z.array(z.object({
    name: z.string().min(1),
    authorAttributions: z.array(z.object({
      displayName: z.string(),
      uri: z.string().optional(),
    })).optional(),
  })).optional(),
});

export async function fetchGooglePlacePhoto(
  apiKey: string,
  placeId: string,
  index = 0,
): Promise<PlacePhoto | null> {
  const details = await fetch(`${PLACE_URL}/${encodeURIComponent(placeId)}`, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'photos',
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!details.ok) throw new Error(`Google Place Details failed (${details.status})`);
  const parsed = PhotoResponseSchema.safeParse(await details.json());
  if (!parsed.success) throw new Error('Google Place Details returned invalid photo data');
  const record = parsed.data.photos?.[index];
  if (!record) return null;
  const photo = await downloadPhoto(apiKey, record.name);
  return {
    ...photo,
    attributions: (record.authorAttributions ?? []).map((author) => ({
      label: `Photo by ${author.displayName} on Google Maps`,
      source_url: author.uri ?? `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(placeId)}`,
      license: null,
    })),
  };
}

async function downloadPhoto(apiKey: string, name: string): Promise<PlacePhoto> {
  const params = new URLSearchParams({
    maxWidthPx: '1200',
    maxHeightPx: '800',
    key: apiKey,
  });
  const response = await fetch(
    `https://places.googleapis.com/v1/${name}/media?${params.toString()}`,
    { signal: AbortSignal.timeout(10_000) },
  );
  if (!response.ok) throw new Error(`Google Place Photos failed (${response.status})`);
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) throw new Error('Google Place Photos returned non-image data');
  return { bytes: new Uint8Array(await response.arrayBuffer()), contentType };
}
