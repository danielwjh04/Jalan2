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

  it("applies user defaults only through an explicit action", () => {
    expect(read("TripPreferencesCard")).toContain("Use my defaults");
    expect(read("DestinationSearch")).toContain('borderStyle: "dashed"');
    expect(read("SafetyBriefCard")).toContain("initialLanguage");
  });
});
