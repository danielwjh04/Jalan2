import { haversineMeters, type GeoPoint, type PlaceCandidate, type TripPlan } from '@shared/trip';
import type { PlacesProvider } from '../adapters/places/types';
import { isTiomanPlace, tiomanZone } from '../planner/tiomanMobility';

const MAX_RESULTS = 5;

export async function recommendAlongRoute(
  trip: TripPlan,
  places: PlacesProvider,
): Promise<PlaceCandidate[]> {
  const path = routePath(trip);
  if (path.length === 0) return [];
  const candidates = places.nearbyPopular
    ? await nearbyAlongPath(path, places)
    : await places.search(`popular attractions in ${trip.region}`, trip.region);
  const ranked = rankCandidates(trip, path, candidates).slice(0, MAX_RESULTS);
  return places.withImages ? places.withImages(ranked) : ranked;
}

function routePath(trip: TripPlan): GeoPoint[] {
  const selected = new Set(trip.selected_stop_ids);
  const selectedStops = trip.stops.filter((stop) => selected.has(stop.id));
  const tiomanStops = selectedStops.filter(isTiomanPlace);
  if (tiomanStops.length > 0) return tiomanStops.map((stop) => stop.location);
  if (trip.route?.path && trip.route.path.length >= 2) return trip.route.path;
  return selectedStops.map((stop) => stop.location);
}

function centerOf(points: GeoPoint[]): GeoPoint {
  const total = points.reduce((sum, point) => ({
    lat: sum.lat + point.lat,
    lng: sum.lng + point.lng,
  }), { lat: 0, lng: 0 });
  return { lat: total.lat / points.length, lng: total.lng / points.length };
}

async function nearbyAlongPath(path: GeoPoint[], places: PlacesProvider): Promise<PlaceCandidate[]> {
  if (!places.nearbyPopular) return [];
  const groups = await Promise.all(searchCenters(path).map((center) => places.nearbyPopular?.(center, 12_000) ?? []));
  return [...new Map(groups.flat().map((place) => [place.place_id, place])).values()];
}

function searchCenters(path: GeoPoint[]): GeoPoint[] {
  const first = path[0];
  const last = path.at(-1) ?? first;
  if (haversineMeters(first, last) < 20_000) return [centerOf(path)];
  return [first, midpoint(first, last), last];
}

function midpoint(from: GeoPoint, to: GeoPoint): GeoPoint {
  return { lat: (from.lat + to.lat) / 2, lng: (from.lng + to.lng) / 2 };
}

function rankCandidates(
  trip: TripPlan,
  path: GeoPoint[],
  candidates: PlaceCandidate[],
): PlaceCandidate[] {
  const existingIds = new Set(trip.stops.map((stop) => stop.place_id).filter(Boolean));
  const existingNames = trip.stops.map((stop) => normalize(stop.name));
  const existingTypes = new Set(trip.stops.map((stop) => stop.primary_type).filter(Boolean));
  const selected = new Set(trip.selected_stop_ids);
  const islandZones = new Set(trip.stops
    .filter((stop) => selected.has(stop.id) && isTiomanPlace(stop))
    .map(tiomanZone)
    .filter(Boolean));
  const maxDetour = 5_000;
  return candidates
    .filter((place) => !existingIds.has(place.place_id) && !duplicatesName(place.name, existingNames))
    .filter((place) => islandZones.size === 0 || (isTiomanPlace(place) && islandZones.has(tiomanZone(place))))
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
  return value.trim().toLowerCase().replace(/[^a-z0-9\p{L}]+/gu, ' ').replace(/\s+/g, ' ');
}

function duplicatesName(value: string, existingNames: string[]): boolean {
  const candidate = normalize(value);
  return existingNames.some((existing) =>
    candidate === existing
    || (candidate.length >= 8 && existing.includes(candidate))
    || (existing.length >= 8 && candidate.includes(existing)));
}
