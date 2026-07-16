import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const directory = dirname(fileURLToPath(import.meta.url));
const read = (name: string): string =>
  readFileSync(resolve(directory, `../src/components/${name}.tsx`), "utf8");

describe("trip planner visuals", () => {
  it("uses a connected timeline with image-led stop guidance", () => {
    const source = read("TripStopCard");
    expect(source).toContain("TimelineRail");
    expect(source).toContain("<PlaceImage");
    expect(source).toContain("What to do");
    expect(source).toContain("StopTravelActions");
    expect(source).toContain('accessibilityLabel="More stop actions"');
  });

  it("preserves every stop action behind the overflow control", () => {
    const source = `${read("TripStopCard")}\n${read("StopActionMenu")}`;
    for (const label of [
      "View source",
      "Remove from itinerary",
      "Add to itinerary",
      "Open EasyBook",
      "Delete place",
    ]) {
      expect(source).toContain(label);
    }
  });

  it("renders stop actions in-app instead of relying on a native alert", () => {
    const source = read("TripStopCard");
    expect(source).toContain("<StopActionMenu");
    expect(source).not.toContain("Alert.alert(props.stop.name");
  });

  it("shows EasyBook as a branded transition between real places", () => {
    const list = read("TripStopList");
    const transition = read("EasybookTransitionCard");

    expect(list).toContain("TripOriginCard");
    expect(list).toContain("EasybookTransitionCard");
    expect(transition).toContain("INTERCITY TRANSPORT");
    expect(transition).toContain("LAST-MILE TRANSFER");
    expect(transition).toContain("Powered by");
    expect(transition).toContain("Easybook-logo.png");
    expect(transition).toContain("Then Jalan2 continues to");
    expect(transition).toContain("No partnership or live inventory implied");
  });

  it("keeps the geographic route and feasibility above the itinerary", () => {
    const planner = read("TripPlanner");
    const map = `${read("TripMap.web")}\n${read("LeafletRouteMap.web")}`;

    expect(planner.indexOf("<TripMap")).toBeLessThan(planner.indexOf("<TripStopList"));
    expect(planner.indexOf("<SmartSuggestions")).toBeLessThan(planner.indexOf("<TripStopList"));
    expect(planner).toContain("TripFeasibilityCard");
    expect(map).toContain("tripMapUrl");
    expect(map).toContain("Google Maps itinerary preview");
    expect(map).toContain("MapContainer");
    expect(map).toContain("TileLayer");
    expect(map).toContain("Focus destination");
  });

  it("applies user defaults only through an explicit action", () => {
    expect(read("TripPreferencesCard")).toContain("Use my defaults");
    expect(read("DestinationSearch")).toContain('borderStyle: "dashed"');
    expect(read("SafetyBriefCard")).toContain("initialLanguage");
  });
});
