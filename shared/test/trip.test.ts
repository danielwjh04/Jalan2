import { describe, expect, it } from "vitest";
import {
  PlaceCandidateSchema,
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
    primary_type: null,
    reservation_hint: null,
    image_url: null,
    place_photo_available: true,
    place_photo_attributions: [{
      label: "Photo by Jalan Kuching",
      source_url: "https://maps.google.com/maps/contrib/123",
      license: null,
    }],
    image_attributions: [],
    estimated_spend_myr: 0,
    duration_minutes: 60,
    sources: [{ title: "Source post", url: "https://example.com/source" }],
  },
  {
    id: "museum",
    name: "Borneo Cultures Museum",
    summary: "Sarawak culture and history",
    location: { lat: 1.5574, lng: 110.3438 },
    primary_type: null,
    reservation_hint: null,
    image_url: null,
    place_photo_available: false,
    place_photo_attributions: [],
    image_attributions: [],
    estimated_spend_myr: 20,
    duration_minutes: 90,
    sources: [{ title: "Official site", url: "https://example.com/museum" }],
  },
  {
    id: "semenggoh",
    name: "Semenggoh Wildlife Centre",
    summary: "Orangutan rehabilitation centre",
    location: { lat: 1.3997, lng: 110.3157 },
    primary_type: null,
    reservation_hint: null,
    image_url: null,
    place_photo_available: false,
    place_photo_attributions: [],
    image_attributions: [],
    estimated_spend_myr: 10,
    duration_minutes: 120,
    sources: [{ title: "Official site", url: "https://example.com/semenggoh" }],
  },
];

describe("TripPlanSchema", () => {
  it("accepts saved discovery and reservation metadata", () => {
    const parsed = TripPlanSchema.safeParse({
      id: "saved-melaka",
      title: "Melaka day out",
      region: "Melaka, Malaysia",
      source_creator: "Jalan2",
      source_url: "https://example.com/discovery",
      cover_url: null,
      demo: false,
      origin: "saved_discovery",
      source_discovery_id: "melaka-river-and-heritage",
      stops: stops.map((stop) => ({
        ...stop,
        primary_type: "tourist_attraction",
        reservation_hint: "bookable",
      })),
      selected_stop_ids: stops.map((stop) => stop.id),
      route: null,
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.source_discovery_id).toBe("melaka-river-and-heritage");
    expect(parsed.data.stops[0].reservation_hint).toBe("bookable");
  });

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
    if (!parsed.success) return;
    expect(parsed.data.stops[0].place_photo_available).toBe(true);
    expect(parsed.data.stops[0].place_photo_attributions[0]?.label).toBe(
      "Photo by Jalan Kuching",
    );
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

describe("PlaceCandidateSchema", () => {
  it("retains Google photo availability and attribution", () => {
    const parsed = PlaceCandidateSchema.parse({
      place_id: "place-1",
      name: "Borneo Cultures Museum",
      address: "Kuching, Sarawak",
      location: { lat: 1.555, lng: 110.342 },
      google_maps_url: "https://maps.google.com/?cid=1",
      opening_window: null,
      suggested_activity: "Explore the exhibitions and learn about local culture.",
      place_photo_available: true,
      place_photo_attributions: [{
        label: "Photo by Sarawak Traveller",
        source_url: "https://maps.google.com/maps/contrib/456",
        license: null,
      }],
      image_url: "https://upload.wikimedia.org/museum.jpg",
      image_attributions: [{
        label: "Photo by Museum Guide",
        source_url: "https://commons.wikimedia.org/wiki/File:Museum.jpg",
        license: "CC BY-SA 4.0",
      }],
    });

    expect(parsed.place_photo_available).toBe(true);
    expect(parsed.suggested_activity).toContain("Explore the exhibitions");
    expect(parsed.place_photo_attributions).toHaveLength(1);
    expect(parsed.image_attributions[0]?.license).toBe("CC BY-SA 4.0");
  });

  it("rejects an invalid attribution source URL", () => {
    const parsed = PlaceCandidateSchema.safeParse({
      place_id: "place-1",
      name: "Borneo Cultures Museum",
      address: "Kuching, Sarawak",
      location: { lat: 1.555, lng: 110.342 },
      google_maps_url: "https://maps.google.com/?cid=1",
      opening_window: null,
      suggested_activity: "Explore the exhibitions and learn about local culture.",
      place_photo_available: true,
      place_photo_attributions: [{
        label: "Unknown source",
        source_url: "not-a-url",
        license: null,
      }],
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
