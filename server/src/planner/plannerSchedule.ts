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
  const firstLeg = legs[0];
  add(days[0], orderedStops[0]?.id, firstLeg?.duration_minutes ?? 0);
  for (const [index, stop] of orderedStops.slice(1).entries()) {
    const transfer = index === 0 ? 0 : legs.find((leg) => leg.to_stop_id === stop.id)?.duration_minutes ?? 20;
    placeStop(days, stop, limit, transfer);
  }
  const recommendedDays = days.length;
  const checks = planChecks(request, orderedStops, legs, recommendedDays);
  const totalMinutes = legs.reduce((sum, leg) => sum + leg.duration_minutes, 0)
    + orderedStops.reduce((sum, stop) => sum + stop.duration_minutes, 0);
  return { days, checks, recommendedDays, totalMinutes };
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
  for (const leg of legs.filter((item) => item.evidence === 'needs_confirmation')) checks.push({
    severity: 'blocking',
    message: `${leg.mode.replace('_', ' ')} from ${names.get(leg.from_stop_id) ?? leg.from_stop_id} to ${names.get(leg.to_stop_id) ?? leg.to_stop_id} is not provider-confirmed.`,
    resolution: 'Open the handoff and confirm a real departure before relying on this plan.',
  });
  if (recommendedDays > 1) checks.push({
    severity: 'info',
    message: `${recommendedDays - 1} overnight stay${recommendedDays > 2 ? 's are' : ' is'} needed.`,
    resolution: 'Choose accommodation near the next morning\'s first stop.',
  });
  return checks;
}
