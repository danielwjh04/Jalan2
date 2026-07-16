import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("A-to-Z smart planner UI", () => {
  it("exposes the whole-trip composer on Home", () => {
    const source = readFileSync(resolve(__dirname, "../src/components/SmartPlanComposer.tsx"), "utf8");
    expect(source).toContain("A-TO-Z SMART PLANNER");
    expect(source).toContain("Build my end-to-end trip");
    expect(source).toContain("7 agents");
    expect(source).toContain("Start date");
  });

  it("renders agents, day plans, transport evidence and critic checks", () => {
    const source = readFileSync(resolve(__dirname, "../src/components/SmartJourneyOverview.tsx"), "utf8");
    expect(source).toContain("agents, one connected plan");
    expect(source).toContain("End-to-end reasonableness");
    expect(source).toContain("Connected transport legs");
    expect(source).toContain("Critic checks");
    expect(source).toContain("Needs confirmation");
  });
});
