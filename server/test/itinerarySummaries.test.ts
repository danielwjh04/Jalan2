import { describe, expect, it } from "vitest";
import type { Itinerary } from "@shared/status";
import { summarizeItineraries } from "../src/store/itineraries";

function itinerary(id: string, updatedAt: string): Itinerary {
  return {
    id,
    tripId: `${id}-trip`,
    experienceId: `${id}-experience`,
    sourceUrl: "https://www.tiktok.com/@jalan2/video/123",
    coverUrl: "/covers/demo.jpg",
    status: "DRAFT",
    stage: "READY",
    booking: {
      operator_name: "Hidden Operator",
      activity: "Kuching food walk",
      price_myr: 80,
      pax: 2,
      meeting_point: { name: "Kuching Waterfront", lat: 1.5593, lng: 110.3439 },
      contact: { whatsapp: "+60123456789", source: "caption" },
      date_requested: null,
      confidence: 0.9,
      raw_evidence: { transcript_span: "private evidence", frame_ts: "1.0s" },
    },
    servedFrom: "cache",
    requested: { dateISO: "2026-07-16", pax: 2 },
    operatorAddress: "whatsapp:+60123456789",
    messages: [{ direction: "outbound", text: "private message", at: updatedAt }],
    error: null,
    createdAt: "2026-07-14T00:00:00.000Z",
    updatedAt,
  };
}

describe("itinerary summaries", () => {
  it("sorts newest first and exposes only list-safe fields", () => {
    const summaries = summarizeItineraries([
      itinerary("older", "2026-07-14T01:00:00.000Z"),
      itinerary("newer", "2026-07-14T02:00:00.000Z"),
    ]);

    expect(summaries.map((item) => item.id)).toEqual(["newer", "older"]);
    expect(summaries[0]).toMatchObject({
      activity: "Kuching food walk",
      operatorName: "Hidden Operator",
      meetingPointName: "Kuching Waterfront",
    });
    expect(JSON.stringify(summaries)).not.toMatch(
      /whatsapp|raw_evidence|messages|operatorAddress|private evidence|private message/,
    );
  });

  it("keeps extraction-only itineraries useful without a booking", () => {
    const item = itinerary("queued", "2026-07-14T03:00:00.000Z");
    item.booking = null;

    expect(summarizeItineraries([item])[0]).toMatchObject({
      activity: null,
      operatorName: null,
      meetingPointName: null,
    });
  });
});
