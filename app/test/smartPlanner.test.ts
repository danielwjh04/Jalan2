import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("blank-slate smart planner UI", () => {
  it("keeps the whole-trip composer as the secondary no-post path", () => {
    const source = readFileSync(resolve(__dirname, "../src/components/SmartPlanComposer.tsx"), "utf8");
    expect(source).toContain("NO POST? START FROM SCRATCH");
    expect(source).toContain("Build a trip from an idea instead");
    expect(source).toContain("Build my end-to-end trip");
    expect(source).toContain("7 agents");
    expect(source).toContain("Start date");
    expect(source).toContain("Return to start");
    expect(source).toContain("Trip ends at");
    expect(source).toContain("return_to_origin");
  });

  it("renders agents, day plans, transport evidence and critic checks", () => {
    const source = readFileSync(resolve(__dirname, "../src/components/SmartJourneyOverview.tsx"), "utf8");
    expect(source).toContain("agents, one connected plan");
    expect(source).toContain("End-to-end reasonableness");
    expect(source).toContain("Connected transport legs");
    expect(source).toContain("Critic checks");
    expect(source).toContain("Needs confirmation");
    expect(source).toContain("WHOLE-JOURNEY BOUNDARY");
    expect(source).toContain("Ticket and transfer options");
    expect(source).toContain("/ktmb/i");
    expect(source).toContain("/easybook/i");
  });
});
