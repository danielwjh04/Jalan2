import type { TripPreferences } from "@shared/trip";

export type TravelPace = "relaxed" | "balanced" | "packed";
export type SafetyLanguage = "en" | "ms" | "zh";

export interface TravelDefaults {
  budgetMyr: number | null;
  dayStartMinute: number;
  travelPace: TravelPace;
  safetyLanguage: SafetyLanguage;
}

export const DEFAULT_TRAVEL_DEFAULTS: TravelDefaults = {
  budgetMyr: null,
  dayStartMinute: 9 * 60,
  travelPace: "balanced",
  safetyLanguage: "en",
};

export function applyTravelDefaults(
  stopIds: string[],
  current: TripPreferences,
  defaults: TravelDefaults,
): { selectedStopIds: string[]; preferences: TripPreferences } {
  const requested = defaults.travelPace === "packed"
    ? stopIds.length
    : defaults.travelPace === "relaxed" ? 3 : 4;
  const count = Math.min(stopIds.length, Math.max(2, requested));
  const selectedStopIds = stopIds.slice(0, count);
  return {
    selectedStopIds,
    preferences: {
      budget_myr: defaults.budgetMyr,
      day_start_minute: defaults.dayStartMinute,
      start_stop_id: selectedStopIds.includes(current.start_stop_id ?? "")
        ? current.start_stop_id
        : null,
      end_stop_id: selectedStopIds.includes(current.end_stop_id ?? "")
        ? current.end_stop_id
        : null,
    },
  };
}

export function parseTravelDefaults(value: unknown): TravelDefaults {
  if (!isRecord(value)) return DEFAULT_TRAVEL_DEFAULTS;
  const budget = value.budgetMyr;
  const start = value.dayStartMinute;
  const pace = value.travelPace;
  const language = value.safetyLanguage;
  if (!isBudget(budget) || !isMinute(start)) return DEFAULT_TRAVEL_DEFAULTS;
  if (!isPace(pace) || !isSafetyLanguage(language)) return DEFAULT_TRAVEL_DEFAULTS;
  return { budgetMyr: budget, dayStartMinute: start, travelPace: pace, safetyLanguage: language };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBudget(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value) && value >= 0);
}

function isMinute(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 1439;
}

function isPace(value: unknown): value is TravelPace {
  return value === "relaxed" || value === "balanced" || value === "packed";
}

function isSafetyLanguage(value: unknown): value is SafetyLanguage {
  return value === "en" || value === "ms" || value === "zh";
}
