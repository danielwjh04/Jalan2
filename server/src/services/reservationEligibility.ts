import type { ReservationEligibility } from "@shared/reservation";
import type { TripStop } from "@shared/trip";

const BOOKABLE_TYPES = new Set([
  "restaurant",
  "cafe",
  "lodging",
  "museum",
  "tourist_attraction",
  "amusement_park",
]);
const WALK_IN_TYPES = new Set([
  "shopping_mall",
  "park",
  "market",
  "beach",
  "place_of_worship",
  "train_station",
]);

export function reservationEligibility(
  stop: TripStop,
  contactAvailable: boolean,
): ReservationEligibility {
  if (stop.reservation_hint === "walk_in") return "WALK_IN";
  if (stop.reservation_hint === "bookable")
    return contactAvailable ? "BOOKABLE" : "CONTACT_UNAVAILABLE";
  if (stop.primary_type && BOOKABLE_TYPES.has(stop.primary_type)) {
    return contactAvailable ? "BOOKABLE" : "CONTACT_UNAVAILABLE";
  }
  if (stop.primary_type && WALK_IN_TYPES.has(stop.primary_type))
    return "WALK_IN";
  return "WALK_IN";
}
