import type { SmartPlanRequest } from '@shared/planner';
import type { TripStop } from '@shared/trip';
import type { PlanningCheck, PlanningDay, PlanningLeg } from './types';

const DAILY_MINUTES = { relaxed: 360, balanced: 480, packed: 600 } as const;

export function buildDayPlan(
  request: SmartPlanRequest,
  orderedStops: TripStop[],
  legs: PlanningLeg[],
): { days: PlanningDay[]; checks: PlanningCheck[]; recommendedDays: number; totalMinutes: number } {
  const limit = DAILY_MINUTES[request.pace];
  const days: PlanningDay[] = [{ day: 1, stop_ids: [], estimated_minutes: 0 }];
  add(days[0], orderedStops[0]?.id, orderedStops[0]?.duration_minutes ?? 0);
  for (const stop of orderedStops.slice(1)) {
    const transfer = legs.find((leg) => leg.to_stop_id === stop.id)?.duration_minutes ?? 20;
    placeStop(days, stop, limit, transfer);
  }
  const recommendedDays = days.length;
  const checks = [
    ...planChecks(request, orderedStops, legs, recommendedDays),
    ...openingHourChecks(request, orderedStops, legs, days),
  ];
  const totalMinutes = legs.reduce((sum, leg) => sum + leg.duration_minutes, 0)
    + orderedStops.reduce((sum, stop) => sum + stop.duration_minutes, 0);
  return { days, checks, recommendedDays, totalMinutes };
}

function openingHourChecks(
  request: SmartPlanRequest,
  stops: TripStop[],
  legs: PlanningLeg[],
  days: PlanningDay[],
): PlanningCheck[] {
  const withHours = stops.filter((stop) => (stop.opening_periods?.length ?? 0) > 0);
  if (withHours.length === 0) return [];
  if (!request.start_date) return [{
    severity: 'info',
    message: `${withHours.length} stop${withHours.length === 1 ? ' has' : 's have'} date-specific opening hours, but no trip date is set.`,
    resolution: 'Set the start date, then rebuild the plan to check the correct weekday.',
  }];
  const checks: PlanningCheck[] = [];
  const byId = new Map(stops.map((stop) => [stop.id, stop]));
  for (const day of days) {
    const date = addUtcDays(request.start_date, day.day - 1);
    let minute = 9 * 60;
    let previousId: string | null = null;
    for (const id of day.stop_ids) {
      const stop = byId.get(id);
      if (!stop) continue;
      if (previousId) minute += legs.find((leg) => leg.from_stop_id === previousId && leg.to_stop_id === id)?.duration_minutes ?? 20;
      const periods = stop.opening_periods?.filter((period) => period.day === date.getUTCDay()) ?? [];
      if ((stop.opening_periods?.length ?? 0) > 0 && periods.length === 0) {
        checks.push({
          severity: 'blocking',
          message: `${stop.name} appears closed on day ${day.day} (${weekday(date)}).`,
          resolution: 'Move it to an open day or remove it, then optimize again.',
        });
      } else if (periods.length > 0) {
        const period = periods.find((item) => item.close_minute >= minute + stop.duration_minutes) ?? periods[0];
        const arrival = Math.max(minute, period.open_minute);
        if (arrival + stop.duration_minutes > period.close_minute) checks.push({
          severity: 'warning',
          message: `${stop.name} may close before the planned visit finishes on day ${day.day}.`,
          resolution: 'Move this stop earlier or verify special-day hours directly with the venue.',
        });
        minute = arrival;
      }
      minute += stop.duration_minutes;
      previousId = id;
    }
  }
  return checks;
}

function addUtcDays(value: string, days: number): Date {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function weekday(date: Date): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getUTCDay()];
}

function placeStop(days: PlanningDay[], stop: TripStop, limit: number, transfer: number): void {
  let day = days.at(-1) as PlanningDay;
  const visit = stop.duration_minutes + transfer;
  if (day.estimated_minutes + visit > limit && day.stop_ids.length > 0) {
    day = { day: days.length + 1, stop_ids: [], estimated_minutes: 0 };
    days.push(day);
  }
  add(day, stop.id, visit);
}

function add(day: PlanningDay, stopId: string | undefined, minutes: number): void {
  if (stopId && !day.stop_ids.includes(stopId)) day.stop_ids.push(stopId);
  day.estimated_minutes += minutes;
}

function planChecks(request: SmartPlanRequest, stops: TripStop[], legs: PlanningLeg[], recommendedDays: number): PlanningCheck[] {
  const checks: PlanningCheck[] = [];
  const names = new Map(stops.map((stop) => [stop.id, stop.name]));
  if (recommendedDays > request.days) checks.push({
    severity: 'warning',
    message: `The requested ${request.days}-day trip needs at least ${recommendedDays} days at a ${request.pace} pace.`,
    resolution: 'Add a day, remove an optional stop, or choose a faster pace.',
  });
  for (const leg of legs.filter((item) => item.evidence === 'needs_confirmation')) {
    const from = names.get(leg.from_stop_id) ?? leg.from_stop_id;
    const to = names.get(leg.to_stop_id) ?? leg.to_stop_id;
    checks.push(leg.mode === 'ferry' ? {
      severity: 'blocking',
      message: `Tioman village change from ${from} to ${to} needs a sea taxi; fare, weather and departure are not confirmed.`,
      resolution: 'Keep both activities in one village corridor, move the second zone to another day, or confirm both outbound and return boats with a local operator.',
    } : {
      severity: 'blocking',
      message: `${leg.mode.replace('_', ' ')} from ${from} to ${to} is not provider-confirmed.`,
      resolution: 'Open the handoff and confirm a real departure before relying on this plan.',
    });
  }
  if (recommendedDays > 1) checks.push({
    severity: 'info',
    message: `${recommendedDays - 1} overnight stay${recommendedDays > 2 ? 's are' : ' is'} needed.`,
    resolution: 'Choose accommodation near the next morning\'s first stop.',
  });
  return checks;
}
