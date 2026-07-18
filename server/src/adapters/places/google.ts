import { z } from 'zod';
import type { ImageAttribution } from '@shared/media';
import type { GeoPoint, PlaceCandidate } from '@shared/trip';
import { fetchGooglePlacePhoto } from './googlePhoto';
import type { PlacesProvider } from './types';

const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const NEARBY_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.googleMapsUri',
  'places.primaryType',
  'places.primaryTypeDisplayName',
  'places.photos',
  'places.regularOpeningHours.periods',
  'places.regularOpeningHours.weekdayDescriptions',
  'places.rating',
  'places.userRatingCount',
].join(',');

const TimeSchema = z.object({ day: z.number().int().min(0).max(6).default(0), hour: z.number(), minute: z.number().optional() });
const PeriodSchema = z.object({ open: TimeSchema, close: TimeSchema.optional() });
const AttributionSchema = z.object({
  displayName: z.string(),
  uri: z.string().optional(),
  photoUri: z.string().optional(),
});
const PhotoSchema = z.object({
  name: z.string(),
  widthPx: z.number().optional(),
  heightPx: z.number().optional(),
  authorAttributions: z.array(AttributionSchema).optional(),
});
const PlaceSchema = z.object({
  id: z.string(),
  displayName: z.object({ text: z.string() }),
  formattedAddress: z.string().optional(),
  location: z.object({ latitude: z.number(), longitude: z.number() }),
  googleMapsUri: z.string().url().optional(),
  primaryType: z.string().optional(),
  primaryTypeDisplayName: z.object({ text: z.string() }).optional(),
  photos: z.array(PhotoSchema).optional(),
  regularOpeningHours: z.object({
    periods: z.array(PeriodSchema),
    weekdayDescriptions: z.array(z.string()).optional(),
  }).optional(),
  rating: z.number().optional(),
  userRatingCount: z.number().int().nonnegative().optional(),
});
const ResponseSchema = z.object({ places: z.array(PlaceSchema).optional() });

export function createGooglePlaces(apiKey: string): PlacesProvider {
  return {
    name: 'google',
    async search(query, region) {
      const response = await fetch(SEARCH_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': FIELD_MASK,
        },
        body: JSON.stringify({
          textQuery: searchTextQuery(query, region),
          pageSize: 5,
          languageCode: 'en',
          regionCode: 'MY',
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`Google Places failed (${response.status})`);
      return parseGooglePlaces(await response.json());
    },
    async nearbyPopular(center, radiusMeters) {
      const response = await fetch(NEARBY_URL, nearbyRequest(apiKey, center, radiusMeters));
      if (!response.ok) throw new Error(`Google Places Nearby failed (${response.status})`);
      return parseGooglePlaces(await response.json());
    },
    photo(placeId, index) {
      return fetchGooglePlacePhoto(apiKey, placeId, index);
    },
  };
}

// Region is a display-style label such as "Penang, Malaysia"; skip appending
// it when the query already names the region to avoid doubled suffixes.
export function searchTextQuery(query: string, region: string): string {
  return query.toLowerCase().includes(region.toLowerCase()) ? query : `${query}, ${region}`;
}

export function parseGooglePlaces(payload: unknown): PlaceCandidate[] {
  const parsed = ResponseSchema.safeParse(payload);
  if (!parsed.success) throw new Error('Google Places returned an invalid response');
  return (parsed.data.places ?? []).map(toCandidate);
}

function toCandidate(place: z.infer<typeof PlaceSchema>): PlaceCandidate {
  const mapsUrl = place.googleMapsUri ?? mapsSearchUrl(place.displayName.text);
  const photo = place.photos?.[0];
  return {
    place_id: place.id,
    name: place.displayName.text,
    address: place.formattedAddress ?? place.displayName.text,
    location: { lat: place.location.latitude, lng: place.location.longitude },
    google_maps_url: mapsUrl,
    opening_window: firstOpeningWindow(place.regularOpeningHours?.periods ?? []),
    opening_periods: openingPeriods(place.regularOpeningHours?.periods ?? []),
    opening_hours_text: place.regularOpeningHours?.weekdayDescriptions ?? [],
    suggested_activity: activityFor(place.primaryType, place.primaryTypeDisplayName?.text),
    primary_type: place.primaryType ?? null,
    reservation_hint: null,
    place_photo_available: Boolean(photo),
    place_photo_attributions: attributionsFor(photo, mapsUrl),
    image_url: null,
    image_attributions: [],
    rating: place.rating ?? null,
    user_rating_count: place.userRatingCount,
  };
}

function nearbyRequest(apiKey: string, center: GeoPoint, radiusMeters: number): RequestInit {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: ['tourist_attraction', 'museum', 'park', 'cafe'],
      maxResultCount: 15,
      rankPreference: 'POPULARITY',
      locationRestriction: {
        circle: {
          center: { latitude: center.lat, longitude: center.lng },
          radius: Math.min(Math.max(radiusMeters, 500), 50_000),
        },
      },
      languageCode: 'en',
      regionCode: 'MY',
    }),
    signal: AbortSignal.timeout(10_000),
  };
}

const ACTIVITIES: Record<string, string> = {
  museum: 'Explore the exhibitions and learn about local history and culture.',
  shopping_mall: 'Browse the shops, try local food, and take an indoor break.',
  restaurant: 'Try the local specialities and allow time for a relaxed meal.',
  cafe: 'Stop for a local drink or snack and take a short break.',
  park: 'Walk the trails, enjoy the scenery, and look out for local wildlife.',
  tourist_attraction: 'Explore the main sights and allow time to look around.',
};

function activityFor(primaryType?: string, displayType?: string): string {
  if (primaryType && ACTIVITIES[primaryType]) return ACTIVITIES[primaryType];
  const placeType = displayType?.toLowerCase() ?? 'destination';
  return `Explore this ${placeType} and check the latest visitor information before you go.`;
}

function attributionsFor(
  photo: z.infer<typeof PhotoSchema> | undefined,
  mapsUrl: string,
): ImageAttribution[] {
  return (photo?.authorAttributions ?? []).map((author) => ({
    label: `Photo by ${author.displayName}`,
    source_url: normalizeUrl(author.uri) ?? mapsUrl,
    license: null,
  }));
}

function normalizeUrl(value?: string): string | null {
  if (!value) return null;
  return value.startsWith('//') ? `https:${value}` : value;
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

function openingPeriods(periods: z.infer<typeof PeriodSchema>[]): NonNullable<PlaceCandidate['opening_periods']> {
  return periods.flatMap((period) => {
    if (!period.close) return [];
    const open = period.open.hour * 60 + (period.open.minute ?? 0);
    const close = period.close.day === period.open.day
      ? period.close.hour * 60 + (period.close.minute ?? 0)
      : 1440;
    return close > open ? [{ day: period.open.day, open_minute: open, close_minute: close }] : [];
  });
}

function mapsSearchUrl(name: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
}
