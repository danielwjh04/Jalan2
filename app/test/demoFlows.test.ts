import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../src");
const read = (path: string): string => {
  const file = resolve(root, path);
  return existsSync(file) ? readFileSync(file, "utf8") : "";
};

describe("landing demo flows", () => {
  it("makes the waving Bobo overlap the responsive Jalan2 landing hero", () => {
    const hero = read("components/HomeHero.tsx");
    const home = read("app/(tabs)/index.tsx");

    expect(home).toContain("<HomeHero");
    expect(hero).toContain("Jalan2");
    expect(hero).toContain("bobo.png");
    expect(hero).toContain("useWindowDimensions");
    expect(hero).not.toContain("Discovering now");
  });

  it("keeps the two core product flows before demos and leaves planning to Trips", () => {
    const home = read("app/(tabs)/index.tsx");
    const core = read("components/CoreProductFlows.tsx");
    const showcase = read("components/DemoFlowShowcase.tsx");

    expect(home.indexOf("CoreProductFlows")).toBeLessThan(home.indexOf("DemoFlowShowcase"));
    expect(home).not.toContain("SmartPlanComposer");
    expect(core).toContain("XHS + TIKTOK TO TRIP");
    expect(core).toContain("KOPITIAM FOOD RECOGNITION");
    expect(core).toContain("SocialGuideComposer");
    expect(core).toContain("Scan or upload a menu");
    expect(core).not.toContain("Combine multiple posts");
    expect(core).not.toContain("Try the 22-dish demo");
    expect(showcase).toContain("Guides other users created");
    expect(showcase).not.toContain("SEE FLOW 1 WORKING");
    expect(showcase).toContain("available >= 960 ? 3");
    expect(showcase).toContain("available >= 620 ? 2 : 1");
    expect(showcase).toContain("Open guide");
    expect(showcase).not.toContain("Run this demo");
  });

  it("keeps trip pages operational instead of repeating pitch copy", () => {
    const planner = read("components/TripPlanner.tsx");
    const menu = read("components/StopActionMenu.tsx");
    const actions = read("lib/travelActions.ts");

    expect(planner).not.toContain("DemoFlowStrip");
    expect(planner).not.toContain("WHAT THIS DEMO PROVES");
    expect(menu).toContain("Directions");
    expect(menu).toContain("Open Grab");
    expect(menu).toContain("Island transport");
    expect(actions).toContain("isTiomanStop");
    expect(actions).toContain("openDirections");
  });

  it("shows route suggestions and day feasibility in curated demos", () => {
    const planner = read("components/TripPlanner.tsx");

    expect(planner).toContain("<SmartSuggestions");
    expect(planner).toContain("<TripFeasibilityCard");
    expect(planner).toContain("addSuggestion");
  });
});
