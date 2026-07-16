import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../src");
const read = (path: string): string => readFileSync(resolve(root, path), "utf8");

describe("landing demo flows", () => {
  it("makes Bobo a dedicated responsive landing hero", () => {
    const bobo = read("components/BoboCard.tsx");
    const home = read("app/(tabs)/index.tsx");

    expect(home).toContain("landing");
    expect(bobo).toContain("landingImage");
    expect(bobo).toContain("narrowLandingCard");
    expect(bobo).toContain("useWindowDimensions");
  });

  it("renders three responsive story cards before the custom ingest flow", () => {
    const home = read("app/(tabs)/index.tsx");
    const showcase = read("components/DemoFlowShowcase.tsx");

    expect(home.indexOf("DemoFlowShowcase")).toBeLessThan(home.indexOf("PasteBar prefill"));
    expect(showcase).toContain("LIVE DEMO FLOWS");
    expect(showcase).toContain("available >= 960 ? 3");
    expect(showcase).toContain("available >= 620 ? 2 : 1");
    expect(showcase).toContain("Run this demo");
  });

  it("keeps trip pages operational instead of repeating pitch copy", () => {
    const planner = read("components/TripPlanner.tsx");
    const actions = read("components/StopTravelActions.tsx");

    expect(planner).not.toContain("DemoFlowStrip");
    expect(planner).not.toContain("WHAT THIS DEMO PROVES");
    expect(actions).toContain("Directions");
    expect(actions).toContain("Open Grab");
    expect(actions).toContain("ASK LOCALLY");
  });

  it("shows route suggestions and day feasibility in curated demos", () => {
    const planner = read("components/TripPlanner.tsx");

    expect(planner).toContain("<SmartSuggestions");
    expect(planner).toContain("<TripFeasibilityCard");
    expect(planner).toContain("addSuggestion");
  });
});
