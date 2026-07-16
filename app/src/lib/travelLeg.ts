import type { SmartPlanningMetadata } from "@shared/planner";
import { haversineMeters, type TripStop } from "@shared/trip";

export type LocalTravelMode = "walk" | "transit" | "drive" | "grab";
export type PlanningLeg = SmartPlanningMetadata["legs"][number];

export interface TravelEstimate {
  distanceMeters: number;
  durationMinutes: number;
  evidence: "provider_verified" | "estimated" | "needs_confirmation";
}

export function initialTravelMode(leg: PlanningLeg | undefined, from: TripStop, to: TripStop): LocalTravelMode {
  if (leg?.mode === "walk") return "walk";
  if (leg?.mode === "ride_hail") return "grab";
  if (leg && ["coach", "train", "multimodal"].includes(leg.mode)) return "transit";
  if (leg) return "drive";
  return haversineMeters(from.location, to.location) <= 1_800 ? "walk" : "drive";
}

export function travelEstimate(
  mode: LocalTravelMode,
  from: TripStop,
  to: TripStop,
  leg?: PlanningLeg,
): TravelEstimate {
  const straightLine = haversineMeters(from.location, to.location);
  const distanceMeters = leg?.distance_meters ?? routeAdjustedDistance(straightLine, mode);
  const legMode = initialTravelMode(leg, from, to);
  if (leg && legMode === mode) {
    return { distanceMeters, durationMinutes: leg.duration_minutes, evidence: leg.evidence };
  }
  const distanceKm = distanceMeters / 1_000;
  const durationMinutes = mode === "walk"
    ? Math.max(2, Math.round((distanceKm / 4.5) * 60))
    : mode === "transit"
      ? Math.max(8, Math.round((distanceKm / 20) * 60) + 8)
      : mode === "grab"
        ? Math.max(6, Math.round((distanceKm / 30) * 60) + 5)
        : Math.max(3, Math.round((distanceKm / 30) * 60) + 3);
  return { distanceMeters, durationMinutes, evidence: "estimated" };
}

export function googleDirectionsUrl(mode: Exclude<LocalTravelMode, "grab">, from: TripStop, to: TripStop): string {
  const params = new URLSearchParams({
    api: "1",
    origin: `${from.location.lat},${from.location.lng}`,
    destination: `${to.location.lat},${to.location.lng}`,
    travelmode: mode === "drive" ? "driving" : mode,
    dir_action: "navigate",
  });
  if (isGooglePlaceId(from.place_id)) params.set("origin_place_id", from.place_id!);
  if (isGooglePlaceId(to.place_id)) params.set("destination_place_id", to.place_id!);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function destinationLabel(stop: TripStop): string {
  return stop.address ?? stop.name;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

export function formatDistance(meters: number): string {
  if (meters < 1_000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1_000).toFixed(1)} km`;
}

export function isGooglePlaceId(value: string | null | undefined): value is string {
  return Boolean(value && !value.startsWith("source-") && !value.startsWith("fixture-"));
}

function routeAdjustedDistance(straightLine: number, mode: LocalTravelMode): number {
  return Math.round(straightLine * (mode === "walk" ? 1.2 : 1.3));
}
