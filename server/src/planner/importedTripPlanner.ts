import type { SmartPlanRequest } from '@shared/planner';
import { DEFAULT_TRIP_PREFERENCES, type TripPlan, type TripStop } from '@shared/trip';
import type { RoutingProvider } from '../adapters/routing/types';
import { buildDayPlan } from './plannerSchedule';
import { runPlanCritic, type PlanCritic } from './planCritic';
import { buildLocalLegs, orderStops, routePhysicalStops } from './plannerRoute';
import { buildStayPlan } from './plannerStay';
import type { PlanningAgentReport, PlanningHandoff } from './types';

export async function planImportedTrip(
  trip: TripPlan,
  routing: RoutingProvider,
  critic?: PlanCritic,
): Promise<TripPlan> {
  if (trip.stops.length < 2) return trip;
  const routed = await routePhysicalStops(trip.stops, routing);
  const stops = orderStops(trip.stops, routed.route.ordered_stop_ids);
  const legs = buildLocalLegs(stops, routed.route.provider);
  const draftRequest = requestFor(trip, stops, 1);
  const draftSchedule = buildDayPlan(draftRequest, stops, legs);
  const request = requestFor(trip, stops, draftSchedule.recommendedDays);
  const schedule = buildDayPlan(request, stops, legs);
  const evaluated = await runPlanCritic({ request, stops, legs, days: schedule.days, checks: schedule.checks }, critic);
  const stay = buildStayPlan(request, trip.region, schedule.recommendedDays);
  const checks = evaluated.checks;
  const warnings = checks.filter((check) => check.severity !== 'info').map((check) => check.message);
  if (routed.fallback) warnings.unshift('Google Routes was unavailable; local ordering is approximate.');
  return {
    ...trip,
    summary: 'A local day plan built from the recommendations visible in the submitted social post.',
    stops,
    selected_stop_ids: stops.map((stop) => stop.id),
    preferences: { ...DEFAULT_TRIP_PREFERENCES, start_stop_id: stops[0].id },
    route: { ...routed.route, ordered_stop_ids: stops.map((stop) => stop.id), warnings },
    planning: {
      request,
      agents: importedAgents(trip, stops, legs.length, routed.fallback, evaluated.critique.score, evaluated.critique.summary),
      legs,
      days: schedule.days,
      checks,
      handoffs: importedHandoffs(stops, stay?.url ?? null),
      hotel_search_url: stay?.url ?? null,
      stay,
      critique: evaluated.critique,
      recommended_days: schedule.recommendedDays,
      estimated_total_minutes: schedule.totalMinutes,
    },
  };
}

function requestFor(trip: TripPlan, stops: TripStop[], days: number): SmartPlanRequest {
  return {
    origin: stops[0].name,
    destination: stops.at(-1)?.name ?? trip.region,
    start_date: null,
    days,
    travelers: 2,
    budget_myr: null,
    interests: ['source recommendations'],
    pace: 'balanced',
  };
}

function importedAgents(
  trip: TripPlan,
  stops: TripStop[],
  legCount: number,
  fallback: boolean,
  score: number,
  summary: string,
): PlanningAgentReport[] {
  const grounded = stops.filter((stop) => stop.place_id && !stop.place_id.startsWith('source-')).length;
  const report = (id: PlanningAgentReport['id'], label: string, status: PlanningAgentReport['status'], detail: string, evidence: string[]): PlanningAgentReport => ({ id, label, status, summary: detail, evidence });
  return [
    report('grounding', 'Place grounding', grounded === stops.length ? 'ready' : 'limited', `Matched ${grounded} of ${stops.length} source places to map records.`, ['Submitted post', 'Google Places']),
    report('mobility', 'Mobility graph', fallback ? 'limited' : 'ready', `Connected ${legCount} local transfers in itinerary order.`, ['Google Routes with offline fallback']),
    report('discovery', 'Source recommendation reader', 'ready', `Loaded ${stops.length} places named or shown in the social post.`, [trip.source_url]),
    report('schedule', 'Day scheduler', 'ready', 'Split source recommendations into realistic daily limits.', ['Stop duration and transfer estimates']),
    report('stay', 'Stay planner', 'limited', 'Adds a dated hotel handoff once the traveler supplies a start date.', ['Agoda external search']),
    report('booking', 'Local action planner', 'limited', 'Every stop exposes directions, Grab address handoff and the questions to ask locally.', ['Google Maps', 'Grab booking screen', 'Jalan2 operator requests']),
    report('critic', 'End-to-end critic', score >= 75 ? 'ready' : 'limited', `${score}/100. ${summary}`, ['Continuity', 'Daily load', 'Unknown provider steps']),
  ];
}

function importedHandoffs(stops: TripStop[], hotelUrl: string | null): PlanningHandoff[] {
  const handoffs: PlanningHandoff[] = [{
    provider: 'Google Maps', kind: 'directions', status: 'grounded',
    label: 'Open the complete local route', url: directionsUrl(stops),
    disclaimer: 'Google Maps calculates live directions after the traveler opens this link.',
  }, {
    provider: 'Local operators', kind: 'operator', status: 'arrange_directly',
    label: 'Confirm prices, meeting points, equipment and pickup', url: null,
    disclaimer: 'No operator is contacted until the tourist reviews and sends a request.',
  }];
  if (hotelUrl) handoffs.push({
    provider: 'Agoda', kind: 'stay', status: 'external_search',
    label: 'Find a stay near the source itinerary', url: hotelUrl,
    disclaimer: 'Add a start date for a dated search. Jalan2 does not claim room availability.',
  });
  return handoffs;
}

function directionsUrl(stops: TripStop[]): string {
  const coordinate = (stop: TripStop): string => `${stop.location.lat},${stop.location.lng}`;
  const params = new URLSearchParams({ api: '1', origin: coordinate(stops[0]), destination: coordinate(stops.at(-1) ?? stops[0]), travelmode: 'driving' });
  const waypoints = stops.slice(1, -1).map(coordinate).join('|');
  if (waypoints) params.set('waypoints', waypoints);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
