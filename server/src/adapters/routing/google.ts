import type { GeoPoint, OptimizedRoute, TripStop } from "@shared/trip";
import type { RoutingProvider } from "./types";
import type { TransitRoute } from "./types";
import { orderWithConstraints, scheduleFor } from '../../services/routeConstraints';

const MATRIX_URL =
  "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix";
const ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";

interface MatrixElement {
  originIndex: number;
  destinationIndex: number;
  duration?: string;
}

interface RouteResponse {
  routes?: Array<{
    distanceMeters?: number;
    duration?: string;
    polyline?: { encodedPolyline?: string };
  }>;
}

interface TransitRouteResponse {
  routes?: Array<{
    distanceMeters?: number;
    duration?: string;
    legs?: Array<{ steps?: Array<{
      travelMode?: string;
      transitDetails?: { transitLine?: { name?: string; vehicle?: { type?: string } } };
    }> }>;
  }>;
}

function durationSeconds(value: string | undefined): number {
  const parsed = Number(value?.replace(/s$/, ""));
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

export function orderByTravelDuration(
  stopIds: string[],
  startId: string,
  matrix: MatrixElement[],
): string[] {
  const startIndex = stopIds.indexOf(startId);
  if (startIndex < 0) throw new Error(`Unknown start stop ${startId}`);
  const remaining = stopIds
    .map((_, index) => index)
    .filter((index) => index !== startIndex);
  const ordered = [startIndex];
  while (remaining.length > 0) {
    const current = ordered[ordered.length - 1];
    let best = 0;
    for (let index = 1; index < remaining.length; index += 1) {
      if (
        matrixDuration(matrix, current, remaining[index]) <
        matrixDuration(matrix, current, remaining[best])
      ) {
        best = index;
      }
    }
    ordered.push(remaining.splice(best, 1)[0]);
  }
  return ordered.map((index) => stopIds[index]);
}

function matrixDuration(
  matrix: MatrixElement[],
  origin: number,
  destination: number,
): number {
  const element = matrix.find(
    (candidate) =>
      candidate.originIndex === origin &&
      candidate.destinationIndex === destination,
  );
  return durationSeconds(element?.duration);
}

function decodeChunk(encoded: string, state: { index: number }): number {
  let result = 0;
  let shift = 0;
  let value: number;
  do {
    value = encoded.charCodeAt(state.index) - 63;
    state.index += 1;
    result |= (value & 0x1f) << shift;
    shift += 5;
  } while (value >= 0x20);
  return result & 1 ? ~(result >> 1) : result >> 1;
}

export function decodePolyline(encoded: string): GeoPoint[] {
  const state = { index: 0 };
  let lat = 0;
  let lng = 0;
  const points: GeoPoint[] = [];
  while (state.index < encoded.length) {
    lat += decodeChunk(encoded, state);
    lng += decodeChunk(encoded, state);
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

export function googleWaypoint(stop: TripStop): {
  waypoint: {
    location: { latLng: { latitude: number; longitude: number } };
  };
} {
  return {
    waypoint: {
      location: {
        latLng: {
          latitude: stop.location.lat,
          longitude: stop.location.lng,
        },
      },
    },
  };
}

async function requestJson<T>(
  url: string,
  apiKey: string,
  fieldMask: string,
  body: object,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok)
    throw new Error(
      `Google Routes failed (${response.status}): ${(await response.text()).slice(0, 200)}`,
    );
  return (await response.json()) as T;
}

async function routeMatrix(
  stops: TripStop[],
  apiKey: string,
): Promise<MatrixElement[]> {
  const locations = stops.map(googleWaypoint);
  return requestJson(
    MATRIX_URL,
    apiKey,
    "originIndex,destinationIndex,duration",
    {
      origins: locations,
      destinations: locations,
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_UNAWARE",
    },
  );
}

async function detailedRoute(
  stops: TripStop[],
  apiKey: string,
): Promise<RouteResponse> {
  return requestJson(
    ROUTES_URL,
    apiKey,
    "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
    {
      origin: googleWaypoint(stops[0]).waypoint,
      destination: googleWaypoint(stops[stops.length - 1]).waypoint,
      intermediates: stops.slice(1, -1).map((stop) => googleWaypoint(stop).waypoint),
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_UNAWARE",
      polylineQuality: "OVERVIEW",
      polylineEncoding: "ENCODED_POLYLINE",
    },
  );
}

export function createGoogleRouting(apiKey: string): RoutingProvider {
  return {
    name: "google",
    async optimize(stops, preferences): Promise<OptimizedRoute> {
      const matrix = await routeMatrix(stops, apiKey);
      const travel = matrixTravel(stops, matrix);
      const ordered = orderWithConstraints(stops, preferences, travel);
      const route = (await detailedRoute(ordered, apiKey)).routes?.[0];
      if (!route?.polyline?.encodedPolyline)
        throw new Error("Google Routes returned no route");
      const metadata = scheduleFor(ordered, preferences, travel);
      return {
        ordered_stop_ids: ordered.map((stop) => stop.id),
        distance_meters: route.distanceMeters ?? 0,
        duration_minutes: Math.max(1,
          (metadata.schedule.at(-1)?.departure_minute ?? preferences.day_start_minute) -
            preferences.day_start_minute),
        path: decodePolyline(route.polyline.encodedPolyline),
        provider: "google",
        ...metadata,
      };
    },
    async transit(origin, destination): Promise<TransitRoute | null> {
      const response = await requestJson<TransitRouteResponse>(
        ROUTES_URL,
        apiKey,
        'routes.distanceMeters,routes.duration,routes.legs.steps.travelMode,routes.legs.steps.transitDetails.transitLine.name,routes.legs.steps.transitDetails.transitLine.vehicle.type',
        {
          origin: googleWaypoint(origin).waypoint,
          destination: googleWaypoint(destination).waypoint,
          travelMode: 'TRANSIT',
          languageCode: 'en',
          regionCode: 'MY',
        },
      );
      const route = response.routes?.[0];
      if (!route?.duration) return null;
      const steps = route.legs?.flatMap((leg) => leg.steps ?? []) ?? [];
      const labels = steps.flatMap((step) => {
        if (step.travelMode === 'WALK') return [];
        const vehicle = step.transitDetails?.transitLine?.vehicle?.type;
        const name = step.transitDetails?.transitLine?.name;
        return [name ? `${vehicleLabel(vehicle)} ${name}` : vehicleLabel(vehicle ?? step.travelMode)];
      });
      const modes = [...new Set(labels.filter(Boolean))];
      if (modes.length === 0) return null;
      return {
        duration_minutes: Math.max(1, Math.ceil(durationSeconds(route.duration) / 60)),
        distance_meters: route.distanceMeters ?? 0,
        modes,
        summary: modes.join(' → '),
        directions_url: transitDirectionsUrl(origin, destination),
      };
    },
  };
}

function vehicleLabel(value?: string): string {
  const normalized = value?.replace(/_/g, ' ').toLowerCase() ?? 'public transport';
  return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function transitDirectionsUrl(origin: TripStop, destination: TripStop): string {
  const params = new URLSearchParams({
    api: '1',
    origin: `${origin.location.lat},${origin.location.lng}`,
    destination: `${destination.location.lat},${destination.location.lng}`,
    travelmode: 'transit',
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function matrixTravel(stops: TripStop[], matrix: MatrixElement[]) {
  const indexes = new Map(stops.map((stop, index) => [stop.id, index]));
  return (from: TripStop, to: TripStop): number => {
    const origin = indexes.get(from.id) ?? -1;
    const destination = indexes.get(to.id) ?? -1;
    return Math.max(1, Math.ceil(matrixDuration(matrix, origin, destination) / 60));
  };
}
