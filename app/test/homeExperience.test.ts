import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../src");
const read = (path: string): string => {
  const file = resolve(root, path);
  return existsSync(file) ? readFileSync(file, "utf8") : "";
};

describe("approved Home and guide experience", () => {
  it("collects social links before one explicit guide generation action", () => {
    const core = read("components/CoreProductFlows.tsx");
    const composer = read("components/SocialGuideComposer.tsx");
    expect(core).toContain("<SocialGuideComposer");
    expect(core).not.toContain("PasteBar");
    expect(core).not.toContain("onMultiSource");
    expect(composer).toContain("Add link");
    expect(composer).toContain("Add another link");
    expect(composer).toContain("Generate guide");
    expect(composer).toContain("Remove");
  });

  it("redirects guide-mode bookings to the complete trip with its locations", () => {
    const itinerary = read("app/(tabs)/itinerary/[id].tsx");
    const planner = read("components/TripPlanner.tsx");
    expect(itinerary).toContain('view === "guide"');
    expect(itinerary).toContain("router.replace(guideDestination(tripId, id))");
    expect(planner).toContain("<TripMap");
    expect(planner).toContain("<TripStopList");
  });

  it("renders detailed extraction progress while a social guide is generated", () => {
    const screen = read("app/social-plan.tsx");
    expect(screen).toContain("<StageProgress stage={stage} error={null} />");
    expect(screen).toContain('setStage("EXTRACTING")');
    expect(screen).toContain("generateSocialGuide(urls, setStage)");
    expect(screen).not.toContain("<BoboCard");
  });

  it("keeps operator discovery and trip planning off the Home screen", () => {
    const home = read("app/(tabs)/index.tsx");
    expect(home).not.toContain("HomeQuickActions");
    expect(home).not.toContain("Meet the local operators");
    expect(home).not.toContain("SmartPlanComposer");
  });

  it("does not expose backend provider or synthetic implementation labels", () => {
    const speaker = read("components/MenuOrderSpeaker.tsx");
    const safety = read("components/SafetyBriefCard.tsx");
    expect(speaker).not.toMatch(/ElevenLabs|Google yue-HK|OpenAI|Exa|Synthetic/);
    expect(safety).not.toContain("Synthetic voice");
    expect(speaker).toContain("Voice is unavailable right now. Try again later.");
  });
});
