import type { TripStop } from "@shared/trip";

export const TIOMAN_TRANSPORT_URL = "https://tioman.gov.my/pengangkutan/";

export function isTiomanStop(stop: TripStop): boolean {
  const { lat, lng } = stop.location;
  return lat >= 2.69 && lat <= 2.92 && lng >= 104.08 && lng <= 104.23;
}
