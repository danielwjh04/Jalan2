import type { SmartPlanRequest } from '@shared/planner';
import type { PlanningStay } from './types';

export function buildStayPlan(
  request: SmartPlanRequest,
  destination: string,
  recommendedDays: number,
): PlanningStay | null {
  if (recommendedDays < 2) return null;
  const nights = recommendedDays - 1;
  const checkIn = request.start_date;
  const checkOut = checkIn ? addDays(checkIn, nights) : null;
  const rooms = Math.max(1, Math.ceil(request.travelers / 2));
  return {
    destination,
    check_in: checkIn,
    check_out: checkOut,
    nights,
    travelers: request.travelers,
    rooms,
    url: agodaSearchUrl(destination, checkIn, checkOut, rooms, request.travelers),
  };
}

export function agodaSearchUrl(
  destination: string,
  checkIn: string | null,
  checkOut: string | null,
  rooms: number,
  travelers: number,
): string {
  const params = new URLSearchParams({ text: destination, rooms: String(rooms), adults: String(travelers) });
  if (checkIn && checkOut) {
    params.set('checkIn', checkIn);
    params.set('checkOut', checkOut);
  }
  return `https://www.agoda.com/search?${params.toString()}`;
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
