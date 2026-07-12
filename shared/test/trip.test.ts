import { describe, expect, it } from "vitest";
import {
  TripPlanSchema,
  haversineMeters,
  optimizeStopOrder,
} from "../src/trip";

const stops = [
  {
    id: "waterfront",
    name: "Kuching Waterfront",
    summary: "Riverside promenade",
    location: { lat: 1.5593, lng: 110.3439 },
    image_url: null,
    estimated_spend_myr: 0,
    duration_minutes: 60,
    sources: [{ title: "Source post", url: "https://example.com/source" }],
  },
  {
    id: "museum",
    name: "Borneo Cultures Museum",
    summary: "Sarawak culture and history",
    location: { lat: 1.5574, lng: 110.3438 },
    image_url: null,
    estimated_spend_myr: 20,
    duration_minutes: 90,
    sources: [{ title: "Official site", url: "https://example.com/museum" }],
  },
  {
    id: "semenggoh",
    name: "Semenggoh Wildlife Centre",
    summary: "Orangutan rehabilitation centre",
    location: { lat: 1.3997, lng: 110.3157 },
    image_url: null,
    estimated_spend_myr: 10,
    duration_minutes: 120,
    sources: [{ title: "Official site", url: "https://example.com/semenggoh" }],
  },
];

describe("TripPlanSchema", () => {
  it("accepts a complete prepared trip plan", () => {
    const parsed = TripPlanSchema.safeParse({
      id: "kuching-day",
      title: "Kuching in a day",
      region: "Kuching, Sarawak",
      source_creator: "Wanka Travel",
      source_url: "https://example.com/source",
      cover_url: null,
      demo: true,
      stops,
      selected_stop_ids: stops.map((stop) => stop.id),
      route: null,
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects selected stop ids that do not exist", () => {
    const parsed = TripPlanSchema.safeParse({
      id: "bad-trip",
      title: "Bad trip",
      region: "Kuching",
      source_creator: "Guide",
      source_url: "https://example.com/source",
      cover_url: null,
      demo: true,
      stops,
      selected_stop_ids: ["waterfront", "missing"],
      route: null,
    });

    expect(parsed.success).toBe(false);
  });
});

describe("route helpers", () => {
  it("keeps the first stop fixed and visits the nearest remaining stop next", () => {
    expect(optimizeStopOrder(stops, "waterfront")).toEqual([
      "waterfront",
      "museum",
      "semenggoh",
    ]);
  });

  it("returns realistic distances in meters", () => {
    const distance = haversineMeters(stops[0].location, stops[1].location);
    expect(distance).toBeGreaterThan(150);
    expect(distance).toBeLessThan(250);
  });
});
