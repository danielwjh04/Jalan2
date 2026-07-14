import { z } from 'zod';
import type { PlaceCandidate } from '@shared/trip';
import type { PlacesProvider } from './types';

const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.googleMapsUri',
  'places.regularOpeningHours.periods',
].join(',');

const TimeSchema = z.object({ hour: z.number(), minute: z.number().optional() });
const PeriodSchema = z.object({ open: TimeSchema, close: TimeSchema.optional() });
const PlaceSchema = z.object({
  id: z.string(),
  displayName: z.object({ text: z.string() }),
  formattedAddress: z.string().optional(),
  location: z.object({ latitude: z.number(), longitude: z.number() }),
  googleMapsUri: z.string().url().optional(),
  regularOpeningHours: z.object({
    periods: z.array(PeriodSchema),
  }).optional(),
});
const ResponseSchema = z.object({ places: z.array(PlaceSchema).optional() });

export function createGooglePlaces(apiKey: string): PlacesProvider {
  return {
    name: 'google',
    async search(query) {
      const response = await fetch(SEARCH_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': FIELD_MASK,
        },
        body: JSON.stringify({
          textQuery: `${query}, Malaysia`,
          pageSize: 5,
          languageCode: 'en',
          regionCode: 'MY',
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`Google Places failed (${response.status})`);
      return parseGooglePlaces(await response.json());
    },
  };
}

export function parseGooglePlaces(payload: unknown): PlaceCandidate[] {
  const parsed = ResponseSchema.safeParse(payload);
  if (!parsed.success) throw new Error('Google Places returned an invalid response');
  return (parsed.data.places ?? []).map((place) => ({
    place_id: place.id,
    name: place.displayName.text,
    address: place.formattedAddress ?? place.displayName.text,
    location: { lat: place.location.latitude, lng: place.location.longitude },
    google_maps_url: place.googleMapsUri ?? mapsSearchUrl(place.displayName.text),
    opening_window: firstOpeningWindow(place.regularOpeningHours?.periods ?? []),
  }));
}

function firstOpeningWindow(
  periods: z.infer<typeof PeriodSchema>[],
): PlaceCandidate['opening_window'] {
  const first = periods[0];
  if (!first?.close) return null;
  const open = first.open.hour * 60 + (first.open.minute ?? 0);
  const close = first.close.hour * 60 + (first.close.minute ?? 0);
  return close > open ? { open_minute: open, close_minute: close } : null;
}

function mapsSearchUrl(name: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
}
