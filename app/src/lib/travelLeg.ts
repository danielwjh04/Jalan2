import type { SmartPlanningMetadata } from "@shared/planner";
import { haversineMeters, type TripStop } from "@shared/trip";

export type LocalTravelMode = "walk" | "transit" | "drive" | "grab";
export type PlanningLeg = SmartPlanningMetadata["legs"][number];

export const GRAB_BOOKING_URL = "https://grab.onelink.me/2695613898?af_ad=my&af_adset=grab_website&af_channel=transport&af_dp=grab%3A%2F%2Fopen%3FscreenType%3DBOOKING&af_force_deeplink=true&af_sub1=book_ride&af_web_dp=https%3A%2F%2Fwww.grab.com%2Fmy%2Fdownload%2F&c=organic_web&is_retargeting=true&pid=organic_web";

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

function routeAdjustedDistance(straightLine: number, mode: LocalTravelMode): number {
  return Math.round(straightLine * (mode === "walk" ? 1.2 : 1.3));
}

function isGooglePlaceId(value: string | null | undefined): value is string {
  return Boolean(value && !value.startsWith("source-") && !value.startsWith("fixture-"));
}
