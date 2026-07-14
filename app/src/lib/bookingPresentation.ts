import type { Itinerary } from "@shared/status";

export type BookingView =
  | "loading"
  | "draft"
  | "waiting"
  | "confirmed"
  | "failed"
  | "expired";

export function bookingViewFor(
  itinerary: Itinerary | null,
  loadError: string | null,
): BookingView {
  if (!itinerary) {
    if (!loadError) return "loading";
    return isExpiredItineraryError(loadError) ? "expired" : "failed";
  }
  if (itinerary.status === "FAILED") return "failed";
  if (!itinerary.booking) return "loading";
  if (itinerary.status === "PENDING_CONFIRM") return "waiting";
  if (itinerary.status === "CONFIRMED") return "confirmed";
  return "draft";
}

export function isExpiredItineraryError(message: string): boolean {
  return /unknown itinerary|not found|status 404/i.test(message);
}
