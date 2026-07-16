import { describe, expect, it } from "vitest";
import type { TripStop } from "@shared/trip";
import { destinationLabel, formatDuration, googleDirectionsUrl, initialTravelMode, travelEstimate } from "../src/lib/travelLeg";

const stop = (id: string, lat: number, lng: number, address?: string): TripStop => ({
  id,
  name: `Stop ${id}`,
  summary: "A grounded place",
  location: { lat, lng },
  image_url: null,
  place_photo_available: false,
  place_photo_attributions: [],
  image_attributions: [],
  estimated_spend_myr: null,
  duration_minutes: 60,
  sources: [{ title: "Source", url: "https://example.com" }],
  address,
});

describe("local travel legs", () => {
  const from = stop("a", 3.139, 101.6869, "Kuala Lumpur");
  const to = stop("b", 3.1412, 101.688, "Petaling Street");

  it("chooses walking for a nearby unplanned pair", () => {
    expect(initialTravelMode(undefined, from, to)).toBe("walk");
    expect(travelEstimate("walk", from, to).durationMinutes).toBeGreaterThan(1);
  });

  it("builds a Google Maps URL with the chosen mode and both endpoints", () => {
    const url = new URL(googleDirectionsUrl("transit", from, to));
    expect(url.searchParams.get("travelmode")).toBe("transit");
    expect(url.searchParams.get("origin")).toBe("3.139,101.6869");
    expect(url.searchParams.get("destination")).toBe("3.1412,101.688");
  });

  it("copies the exact destination label for the Grab handoff", () => {
    expect(destinationLabel(to)).toBe("Petaling Street");
  });

  it("formats itinerary durations with the canonical words", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1 hr");
    expect(formatDuration(90)).toBe("1 hr 30 min");
    expect(formatDuration(250)).toBe("4 hr 10 min");
  });
});
