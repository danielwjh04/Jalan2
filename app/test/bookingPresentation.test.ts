import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { Itinerary } from "@shared/status";
import { bookingViewFor } from "../src/lib/bookingPresentation";

function itinerary(status: Itinerary["status"]): Itinerary {
  return {
    id: "booking-id",
    tripId: "trip-id",
    experienceId: "experience-id",
    sourceUrl: "https://www.tiktok.com/@jalan2/video/123",
    coverUrl: null,
    status,
    stage: status === "FAILED" ? "ERROR" : "READY",
    booking: {
      operator_name: "Aunty Rina",
      activity: "Semenggoh wildlife morning",
      price_myr: 80,
      pax: 2,
      meeting_point: { name: "Semenggoh entrance", lat: 1.4013, lng: 110.3142 },
      contact: { whatsapp: null, source: "caption" },
      date_requested: null,
      confidence: 0.9,
      raw_evidence: { transcript_span: "Meet us at the entrance", frame_ts: "5.0s" },
    },
    servedFrom: "cache",
    requested: status === "DRAFT" ? null : { dateISO: "2026-07-16", pax: 2 },
    operatorAddress: null,
    discoveredOperator: null,
    messages: [],
    error: status === "FAILED" ? "Operator declined" : null,
    createdAt: "2026-07-14T00:00:00.000Z",
    updatedAt: "2026-07-14T00:00:00.000Z",
  };
}

describe("booking presentation", () => {
  it.each([
    ["DRAFT", "draft"],
    ["PENDING_CONFIRM", "waiting"],
    ["CONFIRMED", "confirmed"],
    ["FAILED", "failed"],
  ] as const)("maps %s to %s", (status, expected) => {
    expect(bookingViewFor(itinerary(status), null)).toBe(expected);
  });

  it("keeps extraction in the loading state", () => {
    const pending = itinerary("DRAFT");
    pending.booking = null;
    pending.stage = "TRANSCRIBING";
    expect(bookingViewFor(pending, null)).toBe("loading");
  });

  it("distinguishes an expired demo session from a network error", () => {
    expect(bookingViewFor(null, "Unknown itinerary old-id")).toBe("expired");
    expect(bookingViewFor(null, "Network request failed")).toBe("failed");
  });

  it("keeps booking photos and maps on separate surfaces", () => {
    for (const file of ["MapCard.tsx", "MapCard.web.tsx"]) {
      const source = readFileSync(resolve(__dirname, `../src/components/${file}`), "utf8");
      expect(source).toContain("styles.photoSurface");
      expect(source).toContain("styles.mapSurface");
      expect(source).not.toContain("overflow: 'hidden'");
      expect(source).not.toContain('overflow: "hidden"');
    }
  });
});
