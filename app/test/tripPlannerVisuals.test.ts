import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const directory = dirname(fileURLToPath(import.meta.url));
const read = (name: string): string =>
  readFileSync(resolve(directory, `../src/components/${name}.tsx`), "utf8");
const mockupPath = process.env.ITINERARY_MOCKUP_PATH;
const mockupTest = mockupPath ? it : it.skip;

describe("trip planner visuals", () => {
  it("uses a connected timeline with image-led stop guidance", () => {
    const source = read("TripStopCard");
    expect(source).toContain("TimelineRail");
    expect(source).toContain("<PlaceImage");
    expect(source).toContain("<StopActionMenu");
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
    expect(transition).toContain("Check on EasyBook");
    expect(transition).toContain("Easybook-logo.png");
    expect(transition).toContain("Then Jalan2 continues to");
    expect(transition).toContain("No live inventory or booking confirmed");
    expect(transition).toContain("KTMB · KITS");
  });

  it("puts a changeable local travel mode between adjacent places", () => {
    const list = read("TripStopList");
    const connector = read("TravelLegConnector");

    expect(list).toContain("TravelLegConnector");
    expect(connector).toContain("Transport options from");
    for (const mode of ["Walk", "Transit", "Drive", "Grab"]) expect(connector).toContain(`label: "${mode}"`);
    expect(connector).toContain("Open Grab");
    expect(connector).toContain("copies the exact next-stop address");
    expect(connector).toContain("Google Maps confirms the live route");
    expect(connector).toContain("Water taxi");
    expect(connector).toContain("fare unknown");
    expect(connector).toContain("Transfer info");
  });

  it("uses the shared duration formatter at every Stage 1 itinerary surface", () => {
    const consumers = [
      ["TripPlanner", ['value={route ? formatDuration(route.duration_minutes) : "Ready"}']],
      ["TripFeasibilityCard", ["value={formatDuration(minimumMinutes)}", "value={formatDuration(localMinutes)}"]],
      ["TripStopCard", ["label={formatDuration(stop.duration_minutes)}"]],
      ["TravelLegConnector", ["label={pillLabel(fixed, mode, estimate, leg)}", 'const duration = `${prefix}${formatDuration(estimate.durationMinutes)}`;']],
      ["EasybookTransitionCard", ["about {formatDuration(props.stop.duration_minutes)}"]],
    ] as const;

    for (const [name, expressions] of consumers) {
      const source = read(name);
      expect(source).toMatch(/import\s*{[\s\S]*\bformatDuration\b[\s\S]*}\s*from\s*"@\/lib\/travelLeg";/);
      for (const expression of expressions) expect(source).toContain(expression);
      expect(source).not.toMatch(/(?:function|const)\s+\w*[Ff]ormat(?:Duration|Minutes)\w*/);
    }
  });

  mockupTest("keeps the itinerary mockup free of compact duration literals", () => {
    if (!mockupPath) throw new Error("ITINERARY_MOCKUP_PATH is required");
    expect(readFileSync(mockupPath, "utf8")).not.toMatch(/\b\d+h(?:\s*\d+m)?\b/);
  });

  it("orders the itinerary before safety, suggestions, and the final feasibility check", () => {
    const planner = read("TripPlanner");
    const map = `${read("TripMap.web")}\n${read("LeafletRouteMap.web")}`;

    expect(planner.indexOf("<TripMap")).toBeLessThan(planner.indexOf("<TripStopList"));
    expect(planner.indexOf("<TripStopList")).toBeLessThan(planner.indexOf("<SafetyBriefCard"));
    expect(planner.indexOf("<SafetyBriefCard")).toBeLessThan(planner.indexOf("<SmartSuggestions"));
    expect(planner.indexOf("<SmartSuggestions")).toBeLessThan(planner.indexOf("<TripFeasibilityCard"));
    expect(planner).not.toContain("SmartJourneyOverview");
    expect(map).toContain("tripMapUrl");
    expect(map).toContain("Google Maps itinerary preview");
    expect(map).toContain("MapContainer");
    expect(map).toContain("TileLayer");
    expect(map).toContain("Focus destination");
    expect(map).toContain("Village lines are not roads");
    expect(map).toContain("Island transport");
  });

  it("applies user defaults only through an explicit action", () => {
    expect(read("TripPreferencesCard")).toContain("Use my defaults");
    expect(read("DestinationSearch")).toContain('borderStyle: "dashed"');
    expect(read("SafetyBriefCard")).toContain("initialLanguage");
  });
});
