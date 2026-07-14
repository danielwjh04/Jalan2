import { describe, expect, it } from "vitest";
import { DEFAULT_TRIP_PREFERENCES, type TripStop } from "@shared/trip";
import { createOfflineRouting } from "../src/adapters/routing/offline";
import {
  decodePolyline,
  orderByTravelDuration,
} from "../src/adapters/routing/google";

const stops: TripStop[] = [
  {
    id: "a",
    name: "A",
    summary: "Start",
    location: { lat: 1.56, lng: 110.34 },
    image_url: null,
    estimated_spend_myr: null,
    duration_minutes: 30,
    sources: [{ title: "A source", url: "https://example.com/a" }],
  },
  {
    id: "b",
    name: "B",
    summary: "Nearby",
    location: { lat: 1.561, lng: 110.341 },
    image_url: null,
    estimated_spend_myr: null,
    duration_minutes: 30,
    sources: [{ title: "B source", url: "https://example.com/b" }],
  },
  {
    id: "c",
    name: "C",
    summary: "Farther",
    location: { lat: 1.6, lng: 110.4 },
    image_url: null,
    estimated_spend_myr: null,
    duration_minutes: 30,
    sources: [{ title: "C source", url: "https://example.com/c" }],
  },
];

describe("offline routing", () => {
  it("keeps the requested start and returns route metrics", async () => {
    const route = await createOfflineRouting().optimize(stops, {
      ...DEFAULT_TRIP_PREFERENCES,
      start_stop_id: "a",
    });

    expect(route.provider).toBe("offline");
    expect(route.ordered_stop_ids).toEqual(["a", "b", "c"]);
    expect(route.distance_meters).toBeGreaterThan(0);
    expect(route.duration_minutes).toBeGreaterThan(0);
    expect(route.path).toHaveLength(3);
  });
});

describe("Google route helpers", () => {
  it("orders stops by road duration while keeping the start fixed", () => {
    const matrix = [
      { originIndex: 0, destinationIndex: 1, duration: "600s" },
      { originIndex: 0, destinationIndex: 2, duration: "120s" },
      { originIndex: 2, destinationIndex: 1, duration: "180s" },
    ];

    expect(orderByTravelDuration(["a", "b", "c"], "a", matrix)).toEqual([
      "a",
      "c",
      "b",
    ]);
  });

  it("decodes a Google encoded polyline", () => {
    expect(decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@")).toEqual([
      { lat: 38.5, lng: -120.2 },
      { lat: 40.7, lng: -120.95 },
      { lat: 43.252, lng: -126.453 },
    ]);
  });
});
