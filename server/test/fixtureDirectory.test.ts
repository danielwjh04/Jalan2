import { describe, expect, it } from "vitest";
import {
  fixtureDirectoryEntries,
  fixtureExperienceRecord,
} from "../src/services/fixtureDirectory";

describe("fixture directory", () => {
  it("derives truthful zero-demand operators from cached fixtures", () => {
    const entries = fixtureDirectoryEntries();

    expect(entries.length).toBeGreaterThanOrEqual(3);
    expect(new Set(entries.map((entry) => entry.operatorName)).size).toBe(entries.length);
    expect(
      entries.every(
        (entry) =>
          entry.source === "fixture" &&
          entry.demandCount === 0 &&
          entry.optedIn === false,
      ),
    ).toBe(true);
  });

  it("provides a navigable experience record for each fixture operator", () => {
    for (const entry of fixtureDirectoryEntries()) {
      expect(fixtureExperienceRecord(entry.experienceId)).toMatchObject({
        id: entry.experienceId,
        operatorName: entry.operatorName,
        activity: entry.activity,
        meetingPointName: entry.meetingPointName,
      });
      expect(entry.coverUrl).toMatch(/^\/covers\//);
    }
  });
});
