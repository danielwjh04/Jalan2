import type { BookingJson } from '@shared/booking';
import {
  DEFAULT_TRIP_PREFERENCES,
  type PlaceCandidate,
  type TripPlan,
  type TripStop,
} from '@shared/trip';
import type { PlacesProvider } from '../adapters/places/types';
import type { VisionReadout } from './vision';

const GENERIC_PLACE_NAMES = new Set(['malaysia', 'sarawak', 'borneo']);

export async function createDynamicTrip(
  id: string,
  sourceUrl: string,
  booking: BookingJson,
  vision: VisionReadout,
  places: PlacesProvider,
): Promise<TripPlan> {
  const names = evidencePlaceNames(booking, vision).slice(0, 8);
  const resolved = await Promise.all(
    names.map((name) => places.search(name, 'Sarawak').then((items) => items[0]).catch(() => null)),
  );
  const stops = applyBookingPrice(uniqueStops(
    resolved.map((place, index) => toStop(place ?? fallbackPlace(names[index], booking), sourceUrl)),
  ), booking);
  return {
    id,
    title: booking.activity,
    summary: 'A flexible route built from the submitted travel post.',
    region: 'Sarawak, Malaysia',
    source_creator: booking.operator_name,
    source_url: sourceUrl,
    cover_url: null,
    demo: false,
    origin: 'video',
    stops,
    selected_stop_ids: stops.map((stop) => stop.id),
    preferences: {
      ...DEFAULT_TRIP_PREFERENCES,
      start_stop_id: stops[0]?.id ?? null,
    },
    route: null,
  };
}

function evidencePlaceNames(booking: BookingJson, vision: VisionReadout): string[] {
  const names = [
    booking.meeting_point.name,
    ...vision.frames.flatMap((frame) => frame.place_candidates),
  ];
  const seen = new Set<string>();
  return names.filter((name) => {
    const key = name.trim().toLowerCase();
    if (!key || GENERIC_PLACE_NAMES.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fallbackPlace(name: string, booking: BookingJson): PlaceCandidate {
  return {
    place_id: `source-${slug(name)}`,
    name,
    address: `${name}, Sarawak, Malaysia`,
    location: booking.meeting_point,
    google_maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`,
    opening_window: null,
    suggested_activity: `Explore ${name} and use the submitted travel post as your guide.`,
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
    place_photo_available: place.place_photo_available,
    place_photo_attributions: place.place_photo_attributions,
    image_attributions: place.image_attributions,
    easybook_url: null,
  };
}

function uniqueStops(stops: TripStop[]): TripStop[] {
  const seen = new Set<string>();
  return stops.filter((stop) => !seen.has(stop.id) && Boolean(seen.add(stop.id)));
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
