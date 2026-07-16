import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../src");
const read = (path: string): string => readFileSync(resolve(root, path), "utf8");

describe("saved discovery trip workflow", () => {
  it("keeps saved-trip planning in Discover after removing More routes from Home", () => {
    const card = read("components/DiscoveryCard.tsx");
    const home = read("app/(tabs)/index.tsx");
    const discover = read("app/(tabs)/discover.tsx");

    expect(card).toContain("Plan this trip");
    expect(card).toContain("Open my trip");
    expect(card).toContain("onPlan");
    expect(home).not.toContain("useSavedDiscoveryTrips");
    expect(home).not.toContain("HomeDiscoveryPreview");
    expect(discover).toContain("useSavedDiscoveryTrips");
  });

  it("lists saved copies in Trips and keeps curated previews read only", () => {
    const trips = read("app/(tabs)/trips.tsx");
    const planner = read("components/TripPlanner.tsx");

    expect(trips).toContain("Saved discoveries");
    expect(trips).toContain("getSavedTrips");
    expect(trips).toContain("SavedTripCard");
    expect(planner).toContain("Add to my trips");
    expect(planner).toContain('origin === "curated"');
  });

  it("uses the copy and list API endpoints", () => {
    const api = read("lib/api.ts");

    expect(api).toContain("/discoveries/${id}/trips");
    expect(api).toContain('request("/trips")');
  });
});
