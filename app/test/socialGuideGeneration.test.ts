import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Itinerary, PipelineStage } from "@shared/status";
import type { TripPlan, TripStop } from "@shared/trip";
import * as api from "../src/lib/api";
import * as planner from "../src/lib/socialPlanner";

vi.mock("../src/lib/api", () => ({
  createSocialCollection: vi.fn(),
  getItinerary: vi.fn(),
  getTrip: vi.fn(),
  ingest: vi.fn(),
}));

type QueueResult = { urls: string[]; error: string | null };
type SocialPlannerExports = {
  appendSocialUrl?: (urls: string[], raw: string) => QueueResult;
  generateSocialGuide?: (
    urls: string[],
    onStage?: (stage: PipelineStage) => void,
  ) => Promise<{ trip: TripPlan; bookingId?: string }>;
};

const feature = planner as unknown as SocialPlannerExports;

function stop(id: string): TripStop {
  return {
    id,
    name: `Stop ${id}`,
    summary: "A grounded location",
    location: { lat: 3.14, lng: 101.69 },
    image_url: null,
    place_photo_available: false,
    place_photo_attributions: [],
    image_attributions: [],
    estimated_spend_myr: null,
    duration_minutes: 60,
    sources: [{ title: "Source", url: "https://example.com/post" }],
  };
}

function trip(id: string): TripPlan {
  return {
    id,
    title: `Guide ${id}`,
    summary: "A generated guide",
    region: "Malaysia",
    source_creator: "Creator",
    source_url: "https://example.com/post",
    cover_url: null,
    demo: false,
    origin: "video",
    source_discovery_id: null,
    stops: [stop(`${id}-stop`)],
    selected_stop_ids: [`${id}-stop`],
    route: null,
    planning: null,
  };
}

function readyItinerary(id: string, tripId: string): Itinerary {
  return {
    id,
    tripId,
    experienceId: null,
    sourceUrl: "https://example.com/post",
    coverUrl: null,
    status: "DRAFT",
    stage: "READY",
    booking: null,
    servedFrom: "live",
    requested: null,
    operatorAddress: null,
    discoveredOperator: null,
    messages: [],
    error: null,
    createdAt: "2026-07-16T00:00:00.000Z",
    updatedAt: "2026-07-16T00:00:00.000Z",
  };
}

function stagedItinerary(id: string, stage: PipelineStage, tripId: string | null): Itinerary {
  return { ...readyItinerary(id, tripId ?? "pending"), stage, tripId };
}

describe("social guide generation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("adds one normalized link at a time and rejects duplicates", () => {
    expect(feature.appendSocialUrl).toBeTypeOf("function");
    if (!feature.appendSocialUrl) return;
    const first = feature.appendSocialUrl([], "http://xhslink.com/o/guide");
    expect(first).toEqual({ urls: ["https://xhslink.com/o/guide"], error: null });
    expect(feature.appendSocialUrl(first.urls, "http://xhslink.com/o/guide")).toEqual({
      urls: first.urls,
      error: "That link is already added.",
    });
  });

  it("waits for an ordinary booking to produce its complete trip guide", async () => {
    expect(feature.generateSocialGuide).toBeTypeOf("function");
    if (!feature.generateSocialGuide) return;
    const generated = trip("generated-trip");
    vi.mocked(api.ingest).mockResolvedValue({ kind: "booking", id: "booking-1" });
    vi.mocked(api.getItinerary).mockResolvedValue(readyItinerary("booking-1", generated.id));
    vi.mocked(api.getTrip).mockResolvedValue(generated);

    await expect(feature.generateSocialGuide(["https://xhslink.com/o/guide"])).resolves.toEqual({
      trip: generated,
      bookingId: "booking-1",
    });
  });

  it("reports each live extraction stage while a guide is generated", async () => {
    expect(feature.generateSocialGuide).toBeTypeOf("function");
    if (!feature.generateSocialGuide) return;
    vi.useFakeTimers();
    const generated = trip("staged-trip");
    const stages: PipelineStage[] = [];
    vi.mocked(api.ingest).mockResolvedValue({ kind: "booking", id: "booking-stages" });
    vi.mocked(api.getItinerary)
      .mockResolvedValueOnce(stagedItinerary("booking-stages", "EXTRACTING", null))
      .mockResolvedValueOnce(stagedItinerary("booking-stages", "TRANSCRIBING", null))
      .mockResolvedValueOnce(stagedItinerary("booking-stages", "READING_FRAMES", null))
      .mockResolvedValueOnce(stagedItinerary("booking-stages", "FUSING", null))
      .mockResolvedValueOnce(readyItinerary("booking-stages", generated.id));
    vi.mocked(api.getTrip).mockResolvedValue(generated);

    try {
      const guide = feature.generateSocialGuide(
        ["https://xhslink.com/o/stages"],
        (stage) => stages.push(stage),
      );
      await vi.runAllTimersAsync();
      await expect(guide).resolves.toEqual({ trip: generated, bookingId: "booking-stages" });
      expect(stages).toEqual([
        "EXTRACTING",
        "TRANSCRIBING",
        "READING_FRAMES",
        "FUSING",
        "READY",
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("merges every physical location from multiple source guides", async () => {
    expect(feature.generateSocialGuide).toBeTypeOf("function");
    if (!feature.generateSocialGuide) return;
    const first = trip("first");
    const second = trip("second");
    const merged = { ...trip("merged"), origin: "social_collection" as const };
    vi.mocked(api.ingest)
      .mockResolvedValueOnce({ kind: "trip", id: first.id, bookingId: "booking-a" })
      .mockResolvedValueOnce({ kind: "trip", id: second.id, bookingId: "booking-b" });
    vi.mocked(api.getTrip).mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    vi.mocked(api.createSocialCollection).mockResolvedValue(merged);

    await expect(feature.generateSocialGuide([
      "https://xhslink.com/o/first",
      "https://vt.tiktok.com/second/",
    ])).resolves.toEqual({ trip: merged });
    expect(api.createSocialCollection).toHaveBeenCalledWith({
      selections: [
        { tripId: first.id, stopIds: first.selected_stop_ids },
        { tripId: second.id, stopIds: second.selected_stop_ids },
      ],
    });
  });
});
