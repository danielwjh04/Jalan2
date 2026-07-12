import type { OptimizedRoute, TripStop } from "@shared/trip";

export interface RoutingProvider {
  name: "google" | "offline";
  optimize(stops: TripStop[], startId: string): Promise<OptimizedRoute>;
}
