import type { OptimizedRoute, TripPreferences, TripStop } from "@shared/trip";

export interface RoutingProvider {
  name: "google" | "offline";
  optimize(stops: TripStop[], preferences: TripPreferences): Promise<OptimizedRoute>;
  transit?(origin: TripStop, destination: TripStop): Promise<TransitRoute | null>;
}

export interface TransitRoute {
  duration_minutes: number;
  distance_meters: number;
  modes: string[];
  summary: string;
  directions_url: string;
}
