import type { TripPreferences, TripStop } from '@shared/trip';

type TravelMinutes = (from: TripStop, to: TripStop) => number;

export interface BudgetFit {
  stops: TripStop[];
  warnings: string[];
}

export function fitBudget(stops: TripStop[], preferences: TripPreferences): BudgetFit {
  if (preferences.budget_myr === null) return { stops, warnings: [] };
  const fixed = new Set([preferences.start_stop_id, preferences.end_stop_id].filter(Boolean));
  const kept = [...stops];
  while (knownSpend(kept) > preferences.budget_myr) {
    const removable = kept
      .map((stop, index) => ({ stop, index }))
      .filter(({ stop }) => !fixed.has(stop.id) && stop.estimated_spend_myr !== null)
      .sort((a, b) => spend(b.stop) - spend(a.stop))[0];
    if (!removable) break;
    kept.splice(removable.index, 1);
  }
  const warnings = kept.length < stops.length
    ? [`Removed ${stops.length - kept.length} stop(s) to fit the MYR ${preferences.budget_myr} budget.`]
    : knownSpend(kept) > preferences.budget_myr
      ? ['Known spend is above budget because fixed stops cannot be removed.']
      : [];
  return { stops: kept, warnings };
}

export function orderWithConstraints(
  stops: TripStop[],
  preferences: TripPreferences,
  travel: TravelMinutes,
): TripStop[] {
  const start = stops.find((stop) => stop.id === preferences.start_stop_id) ?? stops[0];
  const end = stops.find((stop) => stop.id === preferences.end_stop_id);
  const remaining = stops.filter((stop) => stop.id !== start.id && stop.id !== end?.id);
  const ordered = [start];
  let minute = departureMinute(start, preferences.day_start_minute);
  while (remaining.length > 0) {
    const current = ordered[ordered.length - 1];
    const best = bestNextIndex(remaining, current, minute, travel);
    const next = remaining.splice(best, 1)[0];
    minute = departureMinute(next, minute + travel(current, next));
    ordered.push(next);
  }
  if (end && end.id !== start.id) ordered.push(end);
  return ordered;
}

export function scheduleFor(
  stops: TripStop[],
  preferences: TripPreferences,
  travel: TravelMinutes,
): { schedule: Array<{ stop_id: string; arrival_minute: number; departure_minute: number }>;
  warnings: string[]; estimated_spend_myr: number } {
  let minute = preferences.day_start_minute;
  const schedule = [];
  const warnings: string[] = [];
  for (const [index, stop] of stops.entries()) {
    if (index > 0) minute += travel(stops[index - 1], stop);
    const arrival = Math.max(minute, stop.opening_window?.open_minute ?? minute);
    const departure = arrival + stop.duration_minutes;
    if (stop.opening_window && departure > stop.opening_window.close_minute) {
      warnings.push(`${stop.name} may be closed before this visit finishes.`);
    }
    schedule.push({ stop_id: stop.id, arrival_minute: arrival, departure_minute: departure });
    minute = departure;
  }
  return { schedule, warnings, estimated_spend_myr: knownSpend(stops) };
}

function bestNextIndex(
  candidates: TripStop[],
  current: TripStop,
  minute: number,
  travel: TravelMinutes,
): number {
  let best = 0;
  for (let index = 1; index < candidates.length; index += 1) {
    if (score(candidates[index], current, minute, travel) <
        score(candidates[best], current, minute, travel)) best = index;
  }
  return best;
}

function score(stop: TripStop, current: TripStop, minute: number, travel: TravelMinutes): number {
  const arrival = minute + travel(current, stop);
  const wait = Math.max(0, (stop.opening_window?.open_minute ?? arrival) - arrival);
  const finish = arrival + wait + stop.duration_minutes;
  const late = stop.opening_window && finish > stop.opening_window.close_minute ? 10_000 : 0;
  const slack = stop.opening_window
    ? Math.max(0, stop.opening_window.close_minute - finish) / 100
    : 100;
  return travel(current, stop) + wait + late + slack;
}

function departureMinute(stop: TripStop, arrival: number): number {
  return Math.max(arrival, stop.opening_window?.open_minute ?? arrival) + stop.duration_minutes;
}

function spend(stop: TripStop): number {
  return stop.estimated_spend_myr ?? 0;
}

function knownSpend(stops: TripStop[]): number {
  return stops.reduce((total, stop) => total + spend(stop), 0);
}
