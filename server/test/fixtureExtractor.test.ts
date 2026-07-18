import { describe, expect, it } from "vitest";
import { normalizeVideoUrl } from "@shared/videoUrl";
import { createFixtureExtractor } from "../src/adapters/extractor/fixture";
import {
  knownFixtures,
  loadCachedBooking,
  loadCachedTrip,
} from "../src/lib/fixtures";
import { isTransportStop } from "@shared/trip";

const extractor = createFixtureExtractor();

function normalized(raw: string): string {
  const result = normalizeVideoUrl(raw);
  if (!result) throw new Error(`Test URL failed to normalize: ${raw}`);
  return result.url;
}

describe("FixtureExtractor", () => {
  it("resolves a manifest URL to its fixture", async () => {
    const media = await extractor.extract(
      normalized("https://vt.tiktok.com/ZSCt5cY1k/"),
    );
    expect(media.fixtureSlug).toBe("kuching-city-guide-01");
    expect(media.coverPath).toMatch(/cover\.jpg$/);
    expect(media.caption).toContain("What To Do in Kuching");
  });

  it("resolves XHS share short-links to the real cafe fixture", async () => {
    const urls = [
      "http://xhslink.com/o/1iHEXC0uXgC",
      "https://xhslink.com/o/1iHEXC0uXgC",
      "http://xhslink.com/o/9JcR3bXBDL4",
    ];
    for (const url of urls) {
      const media = await extractor.extract(normalized(url));
      expect(media.fixtureSlug).toBe("kuching-cafes-03");
    }
  });

  it("rejects unknown URLs and lists the known demo URLs", async () => {
    await expect(
      extractor.extract("https://tiktok.com/@nobody/video/1"),
    ).rejects.toThrow(/Known demo URLs/);
  });
});

describe("fixture data integrity", () => {
  it("every manifest fixture has a schema-valid cached booking", () => {
    const fixtures = knownFixtures();
    expect(fixtures.length).toBeGreaterThan(0);
    const slugs = [...new Set(fixtures.map((f) => f.slug))];
    for (const slug of slugs) {
      expect(
        loadCachedBooking(slug),
        `booking.cached.json for ${slug}`,
      ).not.toBeNull();
    }
  });

  it("every prepared fixture has a schema-valid multi-stop trip", () => {
    const slugs = [...new Set(knownFixtures().map((fixture) => fixture.slug))];
    for (const slug of slugs) {
      const trip = loadCachedTrip(slug);
      expect(trip, `trip.cached.json for ${slug}`).not.toBeNull();
      expect(trip?.stops.length).toBeGreaterThanOrEqual(3);
      expect(trip?.selected_stop_ids.length).toBeGreaterThanOrEqual(2);
      const stopIds = new Set(trip?.stops.map((stop) => stop.id));
      for (const selected of trip?.selected_stop_ids ?? []) {
        expect(stopIds.has(selected), `${slug}: selected stop ${selected}`).toBe(true);
      }
      for (const stop of trip?.stops ?? []) {
        expect(stop.google_maps_url, `${slug}: ${stop.name} map link`).toBeTruthy();
        if (isTransportStop(stop)) {
          expect(stop.image_url, `${slug}: ${stop.name} transport image`).toBeNull();
        } else {
          expect(stop.image_url, `${slug}: ${stop.name} image`).toMatch(
            /^(\/fixture-images\/.+\.jpg|https:\/\/)/,
          );
          expect(stop.image_attributions, `${slug}: ${stop.name} credit`).not.toHaveLength(0);
        }
        if (stop.address) expect(stop.summary).not.toBe(stop.address);
      }
    }
  });

  it("matches the places visibly named in each source post", () => {
    const expected: Record<string, string[]> = {
      "kuching-city-guide-01": ["Borneo Cultures Museum", "Cat Statue Padungan Roundabout", "Kuching Waterfront"],
      "kuching-hidden-spots-02": ["Siniawan Old Town Night Market", "Telok Assam Beach, Bako National Park", "Fairy Caves", "Wind Caves", "Kuching Wetlands National Park", "Satang Island"],
      "kuching-cafes-03": ["The Fern", "CHAS Cafe & Space", "Yia Coffee Company", "HALLS CAFE", "Matcha Day Home", "Moon and Sun Coffee", "skript. coffee", "Sit & Sip Coffee", "Black Bean Coffee & Tea Co.", "Nam Joo"],
    };
    for (const [slug, names] of Object.entries(expected)) {
      expect(loadCachedTrip(slug)?.stops.map((stop) => stop.name)).toEqual(names);
    }
  });
});
