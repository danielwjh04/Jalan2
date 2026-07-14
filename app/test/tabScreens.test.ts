import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const directory = dirname(fileURLToPath(import.meta.url));
const screen = (name: string): string => readFileSync(
  resolve(directory, `../src/app/(tabs)/${name}.tsx`),
  "utf8",
);

describe("new tab screens", () => {
  it("gives Discover places, operators, and explicit retry", () => {
    const source = screen("discover");
    expect(source).toContain('value: "places"');
    expect(source).toContain('value: "operators"');
    expect(source).toContain('actionLabel="Retry"');
    expect(source).toContain("getDiscoveries");
    expect(source).toContain("useEffect");
    expect(source).toContain("sectionFromParam(params.section)");
    expect(source).toContain("discoveriesForCatalog(discoveries)");
  });

  it("loads session itineraries in Trips", () => {
    const source = screen("trips");
    expect(source).toContain("getItineraries");
    expect(source).toContain("deleteItinerary");
    expect(source).toContain("groupItineraries");
    expect(source).toContain("onDelete");
    expect(source).toContain('actionLabel="Retry"');
  });

  it("persists functional defaults in You", () => {
    const source = screen("you");
    expect(source).toContain("useUserPreferences");
    expect(source).toContain('value: "relaxed"');
    expect(source).toContain('value: "ms"');
    expect(source).toContain('value: "zh"');
    expect(source).toContain('label: "中文"');
    expect(source).toContain("3_000");
    expect(source).toContain("SavePreferencesButton");
  });
});
