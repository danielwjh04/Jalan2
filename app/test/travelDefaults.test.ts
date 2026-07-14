import { describe, expect, it } from "vitest";
import { DEFAULT_TRIP_PREFERENCES } from "@shared/trip";
import {
  DEFAULT_TRAVEL_DEFAULTS,
  applyTravelDefaults,
  parseTravelDefaults,
  type TravelPace,
} from "../src/lib/travelDefaults";

const stopIds = ["one", "two", "three", "four", "five", "six"];

describe("travel defaults", () => {
  it.each<[TravelPace, number]>([
    ["relaxed", 3],
    ["balanced", 4],
    ["packed", 6],
  ])("selects the %s pace preset only when applied", (travelPace, count) => {
    const result = applyTravelDefaults(stopIds, DEFAULT_TRIP_PREFERENCES, {
      ...DEFAULT_TRAVEL_DEFAULTS,
      budgetMyr: 180,
      dayStartMinute: 510,
      travelPace,
    });

    expect(result.selectedStopIds).toEqual(stopIds.slice(0, count));
    expect(result.preferences).toMatchObject({
      budget_myr: 180,
      day_start_minute: 510,
    });
  });

  it("keeps at least two stops when the trip has them", () => {
    const result = applyTravelDefaults(
      ["one", "two"],
      DEFAULT_TRIP_PREFERENCES,
      DEFAULT_TRAVEL_DEFAULTS,
    );

    expect(result.selectedStopIds).toEqual(["one", "two"]);
  });

  it("drops start and end constraints excluded by the pace preset", () => {
    const result = applyTravelDefaults(
      stopIds,
      { ...DEFAULT_TRIP_PREFERENCES, start_stop_id: "six", end_stop_id: "five" },
      { ...DEFAULT_TRAVEL_DEFAULTS, travelPace: "relaxed" },
    );

    expect(result.preferences.start_stop_id).toBeNull();
    expect(result.preferences.end_stop_id).toBeNull();
  });

  it("rejects malformed persisted values", () => {
    expect(parseTravelDefaults({ travelPace: "rushed" })).toEqual(
      DEFAULT_TRAVEL_DEFAULTS,
    );
    expect(
      parseTravelDefaults({
        budgetMyr: 120,
        dayStartMinute: 600,
        travelPace: "balanced",
        safetyLanguage: "ms",
      }),
    ).toEqual({
      budgetMyr: 120,
      dayStartMinute: 600,
      travelPace: "balanced",
      safetyLanguage: "ms",
    });
  });

  it("accepts Chinese as a persisted safety brief language", () => {
    expect(
      parseTravelDefaults({
        budgetMyr: null,
        dayStartMinute: 540,
        travelPace: "relaxed",
        safetyLanguage: "zh",
      }),
    ).toMatchObject({ safetyLanguage: "zh" });
  });
});
