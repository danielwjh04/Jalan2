import type { IngestResponse } from "@shared/api";

export function ingestDestination(result: IngestResponse): string {
  if (result.kind === "booking") return `/itinerary/${result.id}`;
  return `/trip/${result.id}?bookingId=${encodeURIComponent(result.bookingId)}`;
}
