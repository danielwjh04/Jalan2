import type { IngestResponse } from "@shared/api";

type GuideDestination = `/trip/${string}` | `/trip/${string}?bookingId=${string}`;

export function ingestDestination(result: IngestResponse): string {
  if (result.kind === "booking") return `/itinerary/${result.id}?view=guide`;
  return guideDestination(result.id, result.bookingId);
}

export function guideDestination(tripId: string, bookingId?: string): GuideDestination {
  const route: `/trip/${string}` = `/trip/${tripId}`;
  return bookingId ? `${route}?bookingId=${encodeURIComponent(bookingId)}` : route;
}
