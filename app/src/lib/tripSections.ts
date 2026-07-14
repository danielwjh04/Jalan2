import type { ItinerarySummary } from "@shared/api";

export interface ItineraryGroups {
  draft: ItinerarySummary[];
  waiting: ItinerarySummary[];
  confirmed: ItinerarySummary[];
  failed: ItinerarySummary[];
}

export function groupItineraries(items: ItinerarySummary[]): ItineraryGroups {
  return {
    draft: items.filter(({ status }) => status === "DRAFT"),
    waiting: items.filter(({ status }) => status === "PENDING_CONFIRM"),
    confirmed: items.filter(({ status }) => status === "CONFIRMED"),
    failed: items.filter(({ status }) => status === "FAILED"),
  };
}
