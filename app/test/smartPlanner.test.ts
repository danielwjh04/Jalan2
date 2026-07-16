import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("blank-slate smart planner UI", () => {
  it("keeps a concise round-trip planner only in the Trips tab", () => {
    const composer = readFileSync(resolve(__dirname, "../src/components/SmartPlanComposer.tsx"), "utf8");
    const home = readFileSync(resolve(__dirname, "../src/app/(tabs)/index.tsx"), "utf8");
    const trips = readFileSync(resolve(__dirname, "../src/app/(tabs)/trips.tsx"), "utf8");
    expect(home).not.toContain("SmartPlanComposer");
    expect(trips).toContain("<SmartPlanComposer />");
    expect(composer).toContain("Trip planner");
    expect(composer).toContain("Build my trip");
    expect(composer).toContain("Start date");
    expect(composer).toContain("return_to_origin: true");
    expect(composer).toContain("end_destination: null");
    expect(composer).not.toContain("How does the journey finish?");
    expect(composer).not.toContain("End somewhere else");
  });

  it("does not render the verbose planning control centre", () => {
    const planner = readFileSync(resolve(__dirname, "../src/components/TripPlanner.tsx"), "utf8");
    expect(planner).not.toContain("SmartJourneyOverview");
  });
});
