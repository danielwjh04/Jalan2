import type { BookingJson } from '@shared/booking';
import {
  DEFAULT_TRIP_PREFERENCES,
  type PlaceCandidate,
  type TripPlan,
  type TripStop,
} from '@shared/trip';
import type { PlacesProvider } from '../adapters/places/types';
import { inMalaysiaBounds, regionFromCoordinates } from './region';
import type { VisionReadout } from './vision';

const GENERIC_PLACE_NAMES = new Set([
  'malaysia', 'sarawak', 'borneo',
  // These are zones/features inside a separately named attraction, not
  // independent bookable stops.
  'sunway night park', 'luminous forest', 'airbnb',
]);
const LOCAL_NAME_ALIASES = new Map<string, string>([
  ['怡保ipoh', 'Ipoh'],
  ['南香茶餐室', 'Kedai Makanan Nam Heong'],
  ['南香茶餐厅', 'Kedai Makanan Nam Heong'],
  ['明裕食品', 'Ming Yue Confectionery'],
  ['大树脚', 'Big Tree Foot Pasir Pinji'],
  ['大樹腳', 'Big Tree Foot Pasir Pinji'],
  ['永记海鲜饭店', 'Weng Kee Seafood Restaurant'],
  ['永記海鮮飯店', 'Weng Kee Seafood Restaurant'],
  ['富山茶楼', 'Foh San Restaurant'],
  ['富山茶樓', 'Foh San Restaurant'],
]);
const CITY_CONTEXTS = [
  'ipoh', 'kuching', 'kuala lumpur', 'george town', 'penang', 'gopeng',
  'melaka', 'malacca', 'johor bahru', 'kota kinabalu', 'kuala terengganu',
  'port dickson',
];

// Fused coordinates are a model-provided seed; re-anchor them to the places
// database so the map pin and region label rest on verified data.
export async function anchorMeetingPoint(
  booking: BookingJson,
  places: PlacesProvider,
): Promise<BookingJson> {
  const anchored = await places
    .search(booking.meeting_point.name, 'Malaysia')
    .then((items) => bestPlaceMatch(booking.meeting_point.name, items, null))
    .catch(() => null);
  if (!anchored || !inMalaysiaBounds(anchored.location)) return booking;
  return {
    ...booking,
    meeting_point: {
      name: booking.meeting_point.name,
      lat: anchored.location.lat,
      lng: anchored.location.lng,
    },
  };
}

export async function createDynamicTrip(
  id: string,
  sourceUrl: string,
  booking: BookingJson,
  vision: VisionReadout,
  places: PlacesProvider,
  captionPlaceNames: string[] = [],
): Promise<TripPlan> {
  const region = regionFromCoordinates(booking.meeting_point);
  const evidencedNames = evidencePlaceNames(booking, vision, captionPlaceNames);
  const cityContext = evidencedNames.find(isCityContext) ?? null;
  const searchRegion = cityContext ? `${cityContext}, ${region}` : region;
  const names = evidencedNames
    .filter((name) => name === booking.meeting_point.name || !isCityContext(name))
    .slice(0, 20);
  const resolved = await Promise.all(
    names.map((name) => places.search(name, searchRegion)
      .then((items) => bestPlaceMatch(name, items, cityContext))
      .catch(() => null)),
  );
  // Only the fused meeting point is allowed to retain a source coordinate when
  // Google cannot resolve it. Other OCR/caption names are omitted rather than
  // being rendered as several convincing-looking pins at the same location.
  const stops = applyBookingPrice(uniqueStops(
    resolved.flatMap((place, index) => {
      if (place) return [toStop(place, sourceUrl)];
      return names[index] === booking.meeting_point.name
        ? [toStop(fallbackPlace(names[index], booking, region), sourceUrl)]
        : [];
    }),
  ), booking);
  const groundedCount = stops.filter((stop) => !stop.place_id?.startsWith('source-')).length;
  return {
    id,
    title: booking.activity,
    summary: `${groundedCount} place${groundedCount === 1 ? '' : 's'} grounded from the submitted travel post. Unmatched names are kept out of the route until they can be verified.`,
    region,
    source_creator: booking.operator_name,
    source_url: sourceUrl,
    cover_url: null,
    demo: false,
    origin: 'video',
    source_discovery_id: null,
    stops,
    selected_stop_ids: stops.map((stop) => stop.id),
    preferences: {
      ...DEFAULT_TRIP_PREFERENCES,
      start_stop_id: stops[0]?.id ?? null,
    },
    route: null,
    planning: null,
  };
}

function bestPlaceMatch(
  query: string,
  candidates: PlaceCandidate[],
  cityContext: string | null,
): PlaceCandidate | null {
  if (candidates.length === 0) return null;
  const ranked = candidates.filter((candidate) => inMalaysiaBounds(candidate.location)).map((candidate) => ({
    candidate,
    textScore: textualPlaceMatchScore(candidate, query),
    score: placeMatchScore(candidate, query, cityContext),
  })).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  // A matching city is useful for disambiguation, but can never make an
  // unrelated venue a valid result on its own.
  // Simplified/traditional Chinese variants can differ in several characters;
  // 0.45 still requires real name overlap while rejecting a city-only match.
  return best && best.textScore >= 0.45 ? best.candidate : null;
}

function placeMatchScore(candidate: PlaceCandidate, query: string, cityContext: string | null): number {
  const textScore = textualPlaceMatchScore(candidate, query);
  const cityBonus = cityContext && candidate.address.toLowerCase().includes(cityContext.toLowerCase()) ? 0.35 : 0;
  return textScore + cityBonus;
}

function textualPlaceMatchScore(candidate: PlaceCandidate, query: string): number {
  const queryLatin = latinTokens(query);
  const candidateLatin = latinTokens(candidate.name);
  const latinMatches = queryLatin.filter((token) => candidateLatin.includes(token)).length;
  const queryCjk = cjkCharacters(query);
  const candidateCjk = new Set(cjkCharacters(candidate.name));
  const cjkMatches = queryCjk.filter((character) => candidateCjk.has(character)).length;
  const normalizedQuery = [...queryLatin, ...queryCjk].join('');
  const normalizedCandidate = [...candidateLatin, ...cjkCharacters(candidate.name)].join('');
  const exactBonus = normalizedQuery && normalizedCandidate
    && (normalizedQuery.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedQuery)) ? 1 : 0;
  return exactBonus
    + (queryLatin.length > 0 ? latinMatches / queryLatin.length : 0)
    + (queryCjk.length > 0 ? cjkMatches / queryCjk.length : 0);
}

function latinTokens(value: string): string[] {
  return value.toLowerCase().match(/[a-z0-9]{2,}/g) ?? [];
}

function cjkCharacters(value: string): string[] {
  return value.match(/[\u3400-\u9fff]/gu) ?? [];
}

function isCityContext(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return CITY_CONTEXTS.some((city) => normalized === city || normalized === `${city}, malaysia`);
}

function evidencePlaceNames(
  booking: BookingJson,
  vision: VisionReadout,
  captionPlaceNames: string[],
): string[] {
  const names = [
    booking.meeting_point.name,
    ...captionPlaceNames.map((name) => contextualPlaceName(name, '')),
    ...vision.frames.flatMap((frame) => frame.place_candidates.map((name) => contextualPlaceName(
      name,
      frame.on_screen_text,
    ))),
  ];
  const seen = new Set<string>();
  return names.filter((name) => {
    const key = name.trim().toLowerCase();
    if (!key || GENERIC_PLACE_NAMES.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function contextualPlaceName(name: string, visibleText: string): string {
  const trimmed = name.trim();
  const normalized = trimmed.toLowerCase().replace(/[\s/·•-]+/gu, '');
  const alias = LOCAL_NAME_ALIASES.get(normalized);
  if (alias) return alias;
  if (/^新街[场場]$/u.test(trimmed)) return 'Taman Jubilee';
  if (/sunny\s+hill/i.test(name) && /(?:ice\s*cream|冰淇淋|雪糕)/iu.test(visibleText)
      && !/(?:ice\s*cream|冰淇淋|雪糕)/iu.test(name)) {
    return `${name} Ice Cream`;
  }
  return name;
}

function fallbackPlace(name: string, booking: BookingJson, region: string): PlaceCandidate {
  return {
    place_id: `source-${slug(name)}`,
    name,
    address: `${name}, ${region}`,
    location: booking.meeting_point,
    google_maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`,
    opening_window: null,
    opening_periods: [],
    opening_hours_text: [],
    suggested_activity: `Explore ${name} and use the submitted travel post as your guide.`,
    primary_type: null,
    reservation_hint: null,
    place_photo_available: false,
    place_photo_attributions: [],
    image_url: null,
    image_attributions: [],
  };
}

export function toStop(place: PlaceCandidate, sourceUrl: string): TripStop {
  return {
    id: slug(place.place_id),
    name: place.name,
    summary: place.suggested_activity,
    location: place.location,
    image_url: place.image_url,
    estimated_spend_myr: null,
    duration_minutes: 60,
    sources: [{ title: 'Submitted travel post', url: sourceUrl }],
    place_id: place.place_id,
    address: place.address,
    google_maps_url: place.google_maps_url,
    opening_window: place.opening_window,
    opening_periods: place.opening_periods ?? [],
    opening_hours_text: place.opening_hours_text ?? [],
    primary_type: place.primary_type,
    reservation_hint: place.reservation_hint,
    place_photo_available: place.place_photo_available,
    place_photo_attributions: place.place_photo_attributions,
    image_attributions: place.image_attributions,
    easybook_url: null,
  };
}

function uniqueStops(stops: TripStop[]): TripStop[] {
  const ids = new Set<string>();
  const placeIds = new Set<string>();
  return stops.filter((stop) => {
    const placeId = stop.place_id ?? '';
    if (ids.has(stop.id) || (placeId && placeIds.has(placeId))) return false;
    ids.add(stop.id);
    if (placeId) placeIds.add(placeId);
    return true;
  });
}

function applyBookingPrice(stops: TripStop[], booking: BookingJson): TripStop[] {
  if (booking.price_myr === null) return stops;
  const words = booking.activity.toLowerCase().split(/\s+/).filter((word) => word.length >= 4);
  const match = stops.find((stop) => words.some((word) => stop.name.toLowerCase().includes(word)));
  const pricedId = match?.id ?? (stops.length === 1 ? stops[0].id : null);
  return stops.map((stop) => stop.id === pricedId
    ? { ...stop, estimated_spend_myr: booking.price_myr }
    : stop);
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'place';
}
