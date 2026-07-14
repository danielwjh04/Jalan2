import { describe, expect, it } from "vitest";
import { discoveryCards, knownDiscoveries } from "../src/lib/discoveries";
import { getTrip, resetTrips } from "../src/store/trips";

describe("curated discoveries", () => {
  it("keeps five original journeys separate from video fixtures", () => {
    const discoveries = knownDiscoveries();

    expect(discoveries).toHaveLength(5);
    expect(new Set(discoveries.map(({ id }) => id))).toHaveLength(5);
    for (const trip of discoveries) {
      expect(trip.origin).toBe("curated");
      expect(trip.demo).toBe(false);
      expect(trip.stops.length).toBeGreaterThanOrEqual(3);
      expect(trip.stops.length).toBeLessThanOrEqual(4);
      expect(trip.source_url).not.toMatch(/tiktok|xiaohongshu|xhslink/i);
      expect(trip.stops.every(({ reservation_hint: hint }) => hint !== null)).toBe(true);
    }
  });

  it("gives every stop a licensed photo fallback and useful activity", () => {
    for (const trip of knownDiscoveries()) {
      for (const stop of trip.stops) {
        expect(stop.summary.length).toBeGreaterThan(20);
        expect(stop.image_url).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
        expect(stop.image_attributions.length).toBeGreaterThan(0);
        expect(stop.image_attributions[0].license).toMatch(/CC|Public domain/);
      }
    }
  });

  it("serves card summaries and opens curated journeys through the trip store", () => {
    const cards = discoveryCards();
    resetTrips();

    expect(cards).toHaveLength(5);
    expect(cards.every(({ stopCount }) => stopCount === 4)).toBe(true);
    expect(cards.every(({ coverUrl }) => coverUrl?.startsWith("https://"))).toBe(true);
    expect(getTrip(cards[0].id)?.id).toBe(cards[0].id);
  });
});
