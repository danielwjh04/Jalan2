import { randomUUID } from 'node:crypto';
import type { SmartPlanRequest } from '@shared/planner';
import {
  DEFAULT_TRIP_PREFERENCES,
  haversineMeters,
  type PlaceCandidate,
  type TripPlan,
  type TripStop,
} from '@shared/trip';
import type { PlacesProvider } from '../adapters/places/types';
import type { RoutingProvider } from '../adapters/routing/types';
import { findEasybookRoute } from '../adapters/transit/easybook';
import { saveTrip } from '../store/trips';
import { buildDayPlan } from './plannerSchedule';
import { runPlanCritic, type PlanCritic } from './planCritic';
import { discoverActivities, groundPlace, toStop, transitHubFor } from './plannerPlaces';
import { buildLocalLegs, orderStops, routePhysicalStops, type RoutedStops } from './plannerRoute';
import { buildStayPlan } from './plannerStay';
import { planIntercityLeg, planLastMileLeg, type EasybookFinder } from './plannerTransport';
import type { PlanningAgentReport, PlanningCritique, PlanningHandoff, PlanningLeg, PlanningStay } from './types';

export interface SmartPlannerDeps {
  places: PlacesProvider;
  routing: RoutingProvider;
  findEasybook?: EasybookFinder;
  critic?: PlanCritic;
  save?: (trip: TripPlan) => TripPlan;
}

export async function createSmartPlan(
  request: SmartPlanRequest,
  deps: SmartPlannerDeps,
): Promise<TripPlan> {
  const [originPlace, destinationPlace] = await Promise.all([
    groundPlace(request.origin, deps.places),
    groundPlace(request.destination, deps.places),
  ]);
  const [origin, destination] = [toStop(originPlace, 'origin'), toStop(destinationPlace, 'destination')];
  const hubConfig = transitHubFor(request.destination);
  const hub = hubConfig ? toStop(await groundPlace(hubConfig.placeQuery, deps.places), 'hub') : null;
  const activities = await discoverActivities(request, destinationPlace.name, deps.places);
  if (activities.length === 0) throw new Error(`No grounded activities found in ${destinationPlace.name}`);
  const activityStops = activities.map((place) => toStop(place, 'activity'));
  const localRoute = await routePhysicalStops([destination, ...activityStops], deps.routing);
  const orderedLocal = orderStops([destination, ...activityStops], localRoute.route.ordered_stop_ids);
  const intercityDestination = hub ?? destination;
  const intercity = await planIntercityLeg({
    origin,
    destination: intercityDestination,
    originLabel: request.origin,
    destinationLabel: hubConfig?.transitLabel ?? request.destination,
    routeProvider: localRoute.route.provider,
    routeDistanceMeters: haversineMeters(origin.location, destination.location),
    findEasybook: deps.findEasybook ?? findEasybookRoute,
  });
  const lastMile = hub ? planLastMileLeg(hub, destination) : null;
  const localLegs = buildLocalLegs(orderedLocal, localRoute.route.provider);
  const legs = [intercity.leg, ...(lastMile ? [lastMile.leg] : []), ...localLegs];
  const journeyStops = [origin, ...(hub ? [hub] : []), ...orderedLocal];
  const draftSchedule = buildDayPlan(request, journeyStops, legs);
  const evaluated = await runPlanCritic({ request, stops: journeyStops, legs, days: draftSchedule.days, checks: draftSchedule.checks }, deps.critic);
  const schedule = { ...draftSchedule, checks: evaluated.checks };
  const stay = buildStayPlan(request, destination.name, schedule.recommendedDays);
  const hotelUrl = stay?.url ?? null;
  const transportHandoffs = [intercity.handoff, ...(lastMile ? [lastMile.handoff] : [])];
  const handoffs = buildHandoffs(transportHandoffs, destination.name, hotelUrl);
  const agents = agentReports(request, origin, destination, activities, legs, schedule, hotelUrl, evaluated.critique);
  const trip = buildTrip(request, journeyStops, localRoute, legs, schedule, handoffs, agents, stay, evaluated.critique);
  return (deps.save ?? saveTrip)(trip);
}

function buildTrip(
  request: SmartPlanRequest,
  stops: TripStop[],
  localRoute: RoutedStops,
  legs: PlanningLeg[],
  schedule: ReturnType<typeof buildDayPlan>,
  handoffs: PlanningHandoff[],
  agents: PlanningAgentReport[],
  stay: PlanningStay | null,
  critique: PlanningCritique,
): TripPlan {
  const origin = stops[0];
  const destination = stops.find((stop) => stop.id.startsWith('destination-')) ?? stops[1];
  const path = [origin.location, ...stops.filter((stop) => stop.id.startsWith('hub-')).map((stop) => stop.location), ...localRoute.route.path];
  const routeDistance = legs.reduce((sum, leg) => sum + (leg.distance_meters ?? 0), 0);
  const warnings = schedule.checks.filter((check) => check.severity !== 'info').map((check) => check.message);
  if (localRoute.fallback) warnings.unshift('Google Routes was unavailable; local ordering is approximate.');
  return {
    id: `smart-${randomUUID().slice(0, 8)}`,
    title: `${origin.name} to ${destination.name}`,
    summary: `A ${request.days}-day ${request.pace} plan for ${request.travelers} traveler${request.travelers === 1 ? '' : 's'}, built around ${request.interests.join(', ')}.`,
    region: `${origin.name} to ${destination.name}, Malaysia`,
    source_creator: 'Jalan2 planning agents',
    source_url: 'https://jalan2.app/planner',
    cover_url: stops.find((stop) => stop.id.startsWith('activity-') && stop.image_url)?.image_url ?? null,
    demo: false,
    origin: 'smart_plan',
    source_discovery_id: null,
    stops,
    selected_stop_ids: stops.map((stop) => stop.id),
    preferences: { ...DEFAULT_TRIP_PREFERENCES, budget_myr: request.budget_myr, start_stop_id: origin.id },
    route: {
      ordered_stop_ids: stops.map((stop) => stop.id),
      distance_meters: routeDistance,
      duration_minutes: schedule.totalMinutes,
      path,
      provider: localRoute.route.provider,
      warnings,
    },
    planning: {
      request,
      agents,
      legs,
      days: schedule.days,
      checks: schedule.checks,
      handoffs,
      hotel_search_url: stay?.url ?? null,
      stay,
      critique,
      recommended_days: schedule.recommendedDays,
      estimated_total_minutes: schedule.totalMinutes,
    },
  };
}

function buildHandoffs(transport: PlanningHandoff[], destination: string, hotelUrl: string | null): PlanningHandoff[] {
  const handoffs = [...transport, {
    provider: 'Local operators', kind: 'operator' as const, status: 'arrange_directly' as const,
    label: 'Confirm activity availability and any pickup', url: null,
    disclaimer: 'Jalan2 creates requests only after the tourist reviews and taps. No operator is contacted during planning.',
  }];
  if (hotelUrl) handoffs.push({
    provider: 'Agoda', kind: 'stay', status: 'external_search',
    label: `Find a stay near ${destination}`, url: hotelUrl,
    disclaimer: 'External hotel search only. Jalan2 has no live Agoda inventory or booking confirmation.',
  });
  return handoffs;
}

function agentReports(
  request: SmartPlanRequest,
  origin: TripStop,
  destination: TripStop,
  activities: PlaceCandidate[],
  legs: PlanningLeg[],
  schedule: ReturnType<typeof buildDayPlan>,
  hotelUrl: string | null,
  critique: PlanningCritique,
): PlanningAgentReport[] {
  const uncertain = legs.filter((leg) => leg.evidence !== 'provider_verified').length;
  return [
    report('grounding', 'Place grounding', 'ready', `Grounded ${origin.name}, ${destination.name} and ${activities.length} candidates.`, ['Google Place IDs and coordinates']),
    report('mobility', 'Mobility graph', uncertain ? 'limited' : 'ready', `Built ${legs.length} connected legs; ${uncertain} remain estimated or need confirmation.`, ['Google Routes', 'EasyBook route-page check']),
    report('discovery', 'Experience curator', 'ready', `Ranked ${activities.length} grounded stops across ${request.interests.join(', ')}.`, ['Google Places ratings and popularity']),
    report('schedule', 'Day scheduler', schedule.recommendedDays > request.days ? 'limited' : 'ready', `Balanced the route across ${schedule.recommendedDays} day(s) at a ${request.pace} pace.`, ['Deterministic duration and daily limits']),
    report('stay', 'Stay planner', hotelUrl ? 'limited' : 'ready', hotelUrl ? 'An overnight base is required; live rooms are not integrated.' : 'No overnight is required by this schedule.', ['Agoda external search only']),
    report('booking', 'Action planner', 'limited', 'Separated grounded directions, external bookings and operator requests.', ['No messages, payment or reservations sent automatically']),
    report('critic', 'End-to-end critic', critique.verdict === 'ready' ? 'ready' : 'limited', `${critique.score}/100. ${critique.summary}`, ['Transport continuity', 'Daily load', 'Provider confirmation gaps']),
  ];
}

function report(id: PlanningAgentReport['id'], label: string, status: PlanningAgentReport['status'], summary: string, evidence: string[]): PlanningAgentReport {
  return { id, label, status, summary, evidence };
}
