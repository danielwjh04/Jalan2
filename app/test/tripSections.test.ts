import { describe, expect, it } from "vitest";
import type { ItinerarySummary } from "@shared/api";
import { groupItineraries } from "../src/lib/tripSections";

function summary(id: string, status: ItinerarySummary["status"]): ItinerarySummary {
  return {
    id,
    tripId: null,
    experienceId: null,
    coverUrl: null,
    status,
    stage: "READY",
    activity: id,
    operatorName: "Jalan2 demo",
    meetingPointName: "Malaysia",
    createdAt: "2026-07-14T00:00:00.000Z",
    updatedAt: "2026-07-14T00:00:00.000Z",
  };
}

describe("trip sections", () => {
  it("groups every server status without duplicating a trip", () => {
    const grouped = groupItineraries([
      summary("draft", "DRAFT"),
      summary("waiting", "PENDING_CONFIRM"),
      summary("confirmed", "CONFIRMED"),
      summary("failed", "FAILED"),
    ]);

    expect(grouped.draft.map(({ id }) => id)).toEqual(["draft"]);
    expect(grouped.waiting.map(({ id }) => id)).toEqual(["waiting"]);
    expect(grouped.confirmed.map(({ id }) => id)).toEqual(["confirmed"]);
    expect(grouped.failed.map(({ id }) => id)).toEqual(["failed"]);
  });
});
