import { describe, expect, it } from "vitest";
import { isTransportStop } from "@shared/trip";
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
      const places = trip.stops.filter((stop) => !isTransportStop(stop));
      expect(places.length).toBeGreaterThanOrEqual(3);
      expect(places.length).toBeLessThanOrEqual(4);
      expect(trip.source_url).not.toMatch(/tiktok|xiaohongshu|xhslink/i);
      expect(trip.stops.every(({ reservation_hint: hint }) => hint !== null)).toBe(true);
    }
  });

  it("gives every stop a licensed photo fallback and useful activity", () => {
    for (const trip of knownDiscoveries()) {
      for (const stop of trip.stops) {
        expect(stop.summary.length).toBeGreaterThan(20);
        if (isTransportStop(stop)) continue;
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
    expect(cards.every(({ stopCount }) => stopCount >= 3 && stopCount <= 4)).toBe(true);
    expect(cards.every(({ coverUrl }) => coverUrl?.startsWith("https://"))).toBe(true);
    expect(getTrip(cards[0].id)?.id).toBe(cards[0].id);
  });

  it("leads with three source-backed demo flows", () => {
    const discoveries = knownDiscoveries();
    const cards = discoveryCards();

    expect(discoveries.slice(0, 3).map(({ id }) => id)).toEqual([
      "kl-tioman-easybook-adventure",
      "kuching-jurassic-world",
      "kl-gopeng-cave-and-rapids",
    ]);
    expect(cards.filter(({ featured }) => featured)).toHaveLength(3);
    expect(cards[0].transportLabel).toBe("EasyBook bus + ferry");
    expect(cards[1].transportLabel).toBe("Local guide + longboat");
    expect(discoveries[0].stops.some(({ easybook_url: url }) => url?.includes("easybook.com"))).toBe(true);
    expect(discoveries[0].selected_stop_ids).toContain("berjaya-paya-rainforest-walk");
    expect(discoveries[0].selected_stop_ids).not.toContain("asah-waterfall-hike");
    expect(discoveries[0].stops.find(({ id }) => id === "asah-waterfall-hike")?.summary).toContain("Separate south-coast add-on");
    expect(discoveries[2].stops.some(({ easybook_url: url }) => url?.includes("easybook.com"))).toBe(true);
    expect(discoveries[2].stops.some(({ transport_provider: provider }) => provider === "operator")).toBe(true);
  });
});
