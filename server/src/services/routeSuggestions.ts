import { haversineMeters, type GeoPoint, type PlaceCandidate, type TripPlan } from '@shared/trip';
import type { PlacesProvider } from '../adapters/places/types';

const MAX_RESULTS = 5;

export async function recommendAlongRoute(
  trip: TripPlan,
  places: PlacesProvider,
): Promise<PlaceCandidate[]> {
  const path = routePath(trip);
  if (path.length === 0) return [];
  const center = centerOf(path);
  const radius = searchRadius(center, path);
  const candidates = places.nearbyPopular
    ? await places.nearbyPopular(center, radius)
    : await places.search(`popular attractions in ${trip.region}`, trip.region);
  return rankCandidates(trip, path, candidates, radius).slice(0, MAX_RESULTS);
}

function routePath(trip: TripPlan): GeoPoint[] {
  if (trip.route?.path && trip.route.path.length >= 2) return trip.route.path;
  const selected = new Set(trip.selected_stop_ids);
  return trip.stops.filter((stop) => selected.has(stop.id)).map((stop) => stop.location);
}

function centerOf(points: GeoPoint[]): GeoPoint {
  const total = points.reduce((sum, point) => ({
    lat: sum.lat + point.lat,
    lng: sum.lng + point.lng,
  }), { lat: 0, lng: 0 });
  return { lat: total.lat / points.length, lng: total.lng / points.length };
}

function searchRadius(center: GeoPoint, path: GeoPoint[]): number {
  const spread = Math.max(...path.map((point) => haversineMeters(center, point)));
  return Math.min(Math.max(spread + 2_500, 1_500), 50_000);
}

function rankCandidates(
  trip: TripPlan,
  path: GeoPoint[],
  candidates: PlaceCandidate[],
  radius: number,
): PlaceCandidate[] {
  const existingIds = new Set(trip.stops.map((stop) => stop.place_id).filter(Boolean));
  const existingNames = new Set(trip.stops.map((stop) => normalize(stop.name)));
  const existingTypes = new Set(trip.stops.map((stop) => stop.primary_type).filter(Boolean));
  const maxDetour = Math.min(Math.max(radius * 0.2, 1_500), 5_000);
  return candidates
    .filter((place) => !existingIds.has(place.place_id) && !existingNames.has(normalize(place.name)))
    .map((place) => ({ ...place, route_distance_meters: distanceToPath(place.location, path) }))
    .filter((place) => (place.route_distance_meters ?? Infinity) <= maxDetour)
    .sort((left, right) => score(right, existingTypes) - score(left, existingTypes));
}

function score(place: PlaceCandidate, existingTypes: Set<string | null | undefined>): number {
  const rating = (place.rating ?? 0) * 20;
  const popularity = Math.log10((place.user_rating_count ?? 0) + 1) * 14;
  const variety = place.primary_type && !existingTypes.has(place.primary_type) ? 12 : 0;
  const detour = (place.route_distance_meters ?? 0) / 180;
  return rating + popularity + variety - detour;
}

function distanceToPath(point: GeoPoint, path: GeoPoint[]): number {
  if (path.length === 1) return haversineMeters(point, path[0]);
  let nearest = Infinity;
  for (let index = 1; index < path.length; index += 1) {
    nearest = Math.min(nearest, segmentDistance(point, path[index - 1], path[index]));
  }
  return nearest;
}

function segmentDistance(point: GeoPoint, start: GeoPoint, end: GeoPoint): number {
  const scaleX = 111_320 * Math.cos((point.lat * Math.PI) / 180);
  const startX = (start.lng - point.lng) * scaleX;
  const startY = (start.lat - point.lat) * 110_540;
  const endX = (end.lng - point.lng) * scaleX;
  const endY = (end.lat - point.lat) * 110_540;
  const lengthSquared = (endX - startX) ** 2 + (endY - startY) ** 2;
  if (lengthSquared === 0) return Math.hypot(startX, startY);
  const projection = Math.max(0, Math.min(1, -(startX * (endX - startX) + startY * (endY - startY)) / lengthSquared));
  return Math.hypot(startX + projection * (endX - startX), startY + projection * (endY - startY));
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
