import { describe, expect, it } from "vitest";
import { normalizeVideoUrl } from "@shared/videoUrl";
import { createFixtureExtractor } from "../src/adapters/extractor/fixture";
import {
  knownFixtures,
  loadCachedBooking,
  loadCachedTrip,
} from "../src/lib/fixtures";

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
      expect(trip?.selected_stop_ids).toEqual(
        trip?.stops.map((stop) => stop.id),
      );
      for (const stop of trip?.stops ?? []) {
        expect(stop.place_id, `${slug}: ${stop.name} place id`).toBeTruthy();
        expect(stop.image_url, `${slug}: ${stop.name} image`).toContain(
          'commons.wikimedia.org',
        );
        expect(stop.image_attributions, `${slug}: ${stop.name} credit`).not.toHaveLength(0);
        if (stop.address) expect(stop.summary).not.toBe(stop.address);
      }
    }
  });
});
