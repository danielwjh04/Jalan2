import {
  haversineMeters,
  optimizeStopOrder,
  type OptimizedRoute,
  type TripStop,
} from "@shared/trip";
import type { RoutingProvider } from "./types";

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
    async optimize(stops, startId): Promise<OptimizedRoute> {
      const order = optimizeStopOrder(stops, startId);
      const byId = new Map(stops.map((stop) => [stop.id, stop]));
      const ordered = order
        .map((id) => byId.get(id))
        .filter((stop): stop is TripStop => !!stop);
      const distance = totalDistance(ordered);
      return {
        ordered_stop_ids: order,
        distance_meters: distance,
        duration_minutes: Math.max(
          1,
          Math.ceil((distance / 1000 / ASSUMED_SPEED_KMH) * 60),
        ),
        path: ordered.map((stop) => stop.location),
        provider: "offline",
      };
    },
  };
}
