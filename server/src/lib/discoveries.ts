import { readFileSync } from "node:fs";
import path from "node:path";
import type { DiscoveryCard } from "@shared/api";
import { TripPlanSchema, type TripPlan } from "@shared/trip";
import { discoveriesRoot } from "./paths";

let cached: TripPlan[] | null = null;

export function knownDiscoveries(): TripPlan[] {
  if (cached) return cached;
  const file = path.join(discoveriesRoot(), "trips.json");
  const data: unknown = JSON.parse(readFileSync(file, "utf8"));
  cached = TripPlanSchema.array().length(5).parse(data);
  return cached;
}

export function loadDiscoveryTrip(id: string): TripPlan | null {
  return knownDiscoveries().find((trip) => trip.id === id) ?? null;
}

export function discoveryCards(): DiscoveryCard[] {
  return knownDiscoveries().map((trip) => ({
    id: trip.id,
    title: trip.title,
    summary: trip.summary ?? "A ready-made Malaysian day out.",
    region: trip.region,
    curator: trip.source_creator,
    coverUrl: trip.cover_url,
    coverAttributions: trip.stops[0]?.image_attributions ?? [],
    stopCount: trip.stops.length,
    durationMinutes: trip.stops.reduce(
      (total, stop) => total + stop.duration_minutes,
      0,
    ),
  }));
}
