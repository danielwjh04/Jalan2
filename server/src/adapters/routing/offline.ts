import {
  haversineMeters,
  type OptimizedRoute,
  type TripStop,
} from "@shared/trip";
import type { RoutingProvider } from "./types";
import { orderWithConstraints, scheduleFor } from '../../services/routeConstraints';

const ASSUMED_SPEED_KMH = 25;

function totalDistance(stops: TripStop[]): number {
  let distance = 0;
  for (let index = 1; index < stops.length; index += 1) {
    distance += haversineMeters(
      stops[index - 1].location,
      stops[index].location,
    );
  }
  return Math.round(distance);
}

export function createOfflineRouting(): RoutingProvider {
  return {
    name: "offline",
    async optimize(stops, preferences): Promise<OptimizedRoute> {
      const ordered = orderWithConstraints(stops, preferences, travelMinutes);
      const distance = totalDistance(ordered);
      const metadata = scheduleFor(ordered, preferences, travelMinutes);
      return {
        ordered_stop_ids: ordered.map((stop) => stop.id),
        distance_meters: distance,
        duration_minutes: Math.max(1,
          (metadata.schedule.at(-1)?.departure_minute ?? preferences.day_start_minute) -
            preferences.day_start_minute),
        path: ordered.map((stop) => stop.location),
        provider: "offline",
        ...metadata,
      };
    },
  };
}

function travelMinutes(from: TripStop, to: TripStop): number {
  return Math.max(1, Math.ceil((haversineMeters(from.location, to.location) / 1000 /
    ASSUMED_SPEED_KMH) * 60));
}
