import type { OptimizedRoute, TripPreferences, TripStop } from "@shared/trip";

export interface RoutingProvider {
  name: "google" | "offline";
  optimize(stops: TripStop[], preferences: TripPreferences): Promise<OptimizedRoute>;
}
