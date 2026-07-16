import { readFileSync } from "node:fs";
import path from "node:path";
import type { DiscoveryCard } from "@shared/api";
import { isTransportStop, TripPlanSchema, type TripPlan } from "@shared/trip";
import { discoveriesRoot } from "./paths";

let cached: TripPlan[] | null = null;

const FEATURED_IDS = new Set([
  "kl-tioman-easybook-adventure",
  "kuching-jurassic-world",
  "kl-gopeng-cave-and-rapids",
]);

const LEGACY_IDS = new Set([
  "melaka-river-and-heritage",
  "ipoh-old-town-and-white-coffee",
]);

const TRANSPORT_LABELS: Record<string, string> = {
  "kl-tioman-easybook-adventure": "EasyBook bus + ferry",
  "kuching-jurassic-world": "Local guide + longboat",
  "kl-gopeng-cave-and-rapids": "EasyBook bus + local transfer",
};

export function knownDiscoveries(): TripPlan[] {
  if (cached) return cached;
  const showcaseData = readTrips("showcases.json", 3);
  const legacyData = readTrips("trips.json", 5).filter(({ id }) =>
    LEGACY_IDS.has(id),
  );
  cached = TripPlanSchema.array().length(5).parse([
    ...showcaseData,
    ...legacyData,
  ]);
  return cached;
}

function readTrips(fileName: string, expected: number): TripPlan[] {
  const file = path.join(discoveriesRoot(), fileName);
  const data: unknown = JSON.parse(readFileSync(file, "utf8"));
  return TripPlanSchema.array().length(expected).parse(data);
}

export function loadDiscoveryTrip(id: string): TripPlan | null {
  return knownDiscoveries().find((trip) => trip.id === id) ?? null;
}

export function discoveryCards(): DiscoveryCard[] {
  return knownDiscoveries().map((trip) => {
    const places = trip.stops.filter((stop) => !isTransportStop(stop));
    return {
      id: trip.id,
      title: trip.title,
      summary: trip.summary ?? "A ready-made Malaysian day out.",
      region: trip.region,
      curator: trip.source_creator,
      coverUrl: trip.cover_url,
      coverAttributions: trip.stops[0]?.image_attributions ?? [],
      stopCount: places.length,
      durationMinutes: trip.stops.reduce(
        (total, stop) => total + stop.duration_minutes,
        0,
      ),
      featured: FEATURED_IDS.has(trip.id),
      transportLabel:
        TRANSPORT_LABELS[trip.id] ?? "Self-guided city route",
      highlights: places.map(({ name }) => name).slice(0, 3),
    };
  });
}
