import type { SmartPlanRequest } from '@shared/planner';
import { DEFAULT_TRIP_PREFERENCES, haversineMeters, isTransportStop, type TripPlan, type TripStop } from '@shared/trip';
import type { RoutingProvider } from '../adapters/routing/types';
import type { PlacesProvider } from '../adapters/places/types';
import { findEasybookRoute } from '../adapters/transit/easybook';
import { buildDayPlan } from './plannerSchedule';
import { runPlanCritic, type PlanCritic } from './planCritic';
import { buildLocalLegs, orderStops, routePhysicalStops } from './plannerRoute';
import { planIntercityLeg } from './plannerTransport';
import { buildStayPlan } from './plannerStay';
import type { PlanningAgentReport, PlanningHandoff, PlanningLeg } from './types';
import { isTiomanPlace, planTiomanTransfer } from './tiomanMobility';
import { groundPlace, toStop } from './plannerPlaces';

export async function planImportedTrip(
  trip: TripPlan,
  routing: RoutingProvider,
  critic?: PlanCritic,
  places?: PlacesProvider,
): Promise<TripPlan> {
  if (trip.stops.length < 2) return trip;
  const journey = await withJourneyBoundaries(trip, trip.stops, places);
  const preferences = trip.preferences ?? DEFAULT_TRIP_PREFERENCES;
  const routed = await routePhysicalStops(journey, routing, {
    ...preferences,
    start_stop_id: journey[0].id,
    end_stop_id: (preferences.return_to_origin || preferences.journey_end) ? journey.at(-1)?.id ?? null : preferences.end_stop_id,
  });
  const stops = orderStops(journey, routed.route.ordered_stop_ids);
  const transport = await buildImportedLegs(stops, routed.route.provider);
  const legs = transport.legs;
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
    summary: stops.filter(isTiomanPlace).length >= 2
      ? 'A Tioman plan grouped by village corridor, with every water-taxi or 4WD zone change exposed for confirmation.'
      : 'A local day plan built from the recommendations visible in the submitted social post.',
    stops,
    selected_stop_ids: stops.map((stop) => stop.id),
    preferences: {
      ...(trip.preferences ?? DEFAULT_TRIP_PREFERENCES),
      start_stop_id: stops[0].id,
      end_stop_id: (trip.preferences?.return_to_origin || trip.preferences?.journey_end) ? stops.at(-1)?.id ?? null : trip.preferences?.end_stop_id ?? null,
    },
    route: { ...routed.route, ordered_stop_ids: stops.map((stop) => stop.id), warnings: [...new Set([...(routed.route.warnings ?? []), ...warnings])] },
    planning: {
      request,
      agents: importedAgents(trip, stops, legs, routed.fallback, evaluated.critique.score, evaluated.critique.summary),
      legs,
      days: schedule.days,
      checks,
      handoffs: importedHandoffs(stops, stay?.url ?? null, transport.handoffs),
      hotel_search_url: stay?.url ?? null,
      stay,
      critique: evaluated.critique,
      recommended_days: schedule.recommendedDays,
      estimated_total_minutes: schedule.totalMinutes,
    },
  };
}

function requestFor(trip: TripPlan, stops: TripStop[], days: number): SmartPlanRequest {
  const preferences = trip.preferences ?? DEFAULT_TRIP_PREFERENCES;
  const origin = preferences.journey_origin ?? stops[0].transport_from ?? stops[0].name;
  const endpoint = preferences.return_to_origin
    ? origin
    : preferences.journey_end ?? stops.at(-1)?.transport_to ?? stops.at(-1)?.name ?? trip.region;
  return {
    origin,
    destination: trip.region,
    return_to_origin: preferences.return_to_origin,
    end_destination: preferences.return_to_origin ? null : endpoint,
    start_date: null,
    days,
    travelers: 2,
    budget_myr: trip.preferences?.budget_myr ?? null,
    interests: ['source recommendations'],
    pace: 'balanced',
  };
}

async function buildImportedLegs(
  stops: TripStop[],
  provider: 'google' | 'offline',
): Promise<{ legs: PlanningLeg[]; handoffs: PlanningHandoff[] }> {
  const legs: PlanningLeg[] = [];
  const handoffs: PlanningHandoff[] = [];
  for (let index = 1; index < stops.length; index += 1) {
    const from = stops[index - 1];
    const to = stops[index];
    if (isTransportStop(from)) {
      const transport = transportStopLeg(from, to);
      legs.push(transport.leg);
      handoffs.push(transport.handoff);
      continue;
    }
    const islandTransfer = planTiomanTransfer(from, to);
    if (islandTransfer) {
      legs.push(islandTransfer.leg);
      if (islandTransfer.handoff) handoffs.push(islandTransfer.handoff);
      continue;
    }
    const distance = haversineMeters(from.location, to.location);
    if (distance < 80_000) {
      legs.push(buildLocalLegs([from, to], provider)[0]);
      continue;
    }
    const planned = await planIntercityLeg({
      origin: from,
      destination: to,
      routeProvider: provider,
      routeDistanceMeters: distance,
      findEasybook: findEasybookRoute,
    });
    legs.push(planned.leg);
    handoffs.push(...planned.handoffs);
  }
  return { legs, handoffs };
}

function transportStopLeg(from: TripStop, to: TripStop): { leg: PlanningLeg; handoff: PlanningHandoff } {
  const url = from.transport_url ?? from.easybook_url ?? null;
  const provider = from.transport_provider === 'easybook' ? 'easybook' : 'unknown';
  const explanation = provider === 'easybook'
    ? 'EasyBook exposes the coach and ferry search handoff. Departure, fare, seat and the actual Mersing–Tekek sailing still require confirmation before this itinerary is actionable.'
    : 'This intercity/island arrival handoff is not booked. Confirm the provider and arrival point before relying on the local plan.';
  return {
    leg: {
      id: `leg-${from.id}-${to.id}`,
      from_stop_id: from.id,
      to_stop_id: to.id,
      mode: /ferry|boat/i.test(from.transport_mode ?? '') ? 'multimodal' : 'coach',
      provider,
      duration_minutes: from.duration_minutes,
      distance_meters: Math.round(haversineMeters(from.location, to.location)),
      evidence: provider === 'easybook' ? 'provider_verified' : 'needs_confirmation',
      booking: 'external_search',
      handoff_url: url,
      explanation,
    },
    handoff: {
      provider: provider === 'easybook' ? 'EasyBook' : 'Transport provider to confirm',
      kind: 'transport', status: 'external_search', label: `${from.transport_from ?? from.name} to ${from.transport_to ?? to.name}`,
      url, disclaimer: explanation,
    },
  };
}

async function withJourneyBoundaries(
  trip: TripPlan,
  stops: TripStop[],
  places?: PlacesProvider,
): Promise<TripStop[]> {
  if (!places) return stops;
  const preferences = trip.preferences ?? DEFAULT_TRIP_PREFERENCES;
  const originLabel = preferences.journey_origin;
  const endpointLabel = preferences.return_to_origin ? originLabel : preferences.journey_end;
  let result = [...stops];
  if (originLabel && !startsAt(result, originLabel)) {
    const origin = toStop(await groundPlace(originLabel, places), 'journey-origin');
    result = [{ ...origin, summary: 'Start the whole journey here.' }, ...result];
  }
  if (endpointLabel && !endsAt(result, endpointLabel, preferences.return_to_origin)) {
    const endpoint = toStop(await groundPlace(endpointLabel, places), 'journey-end');
    result.push({
      ...endpoint,
      id: preferences.return_to_origin ? `return-${endpoint.id}` : endpoint.id,
      name: preferences.return_to_origin ? `Return to ${endpoint.name}` : endpoint.name,
      summary: preferences.return_to_origin ? 'Finish the round trip at the starting point.' : 'Finish the whole journey here.',
    });
  }
  return result;
}

function startsAt(stops: TripStop[], label: string): boolean {
  const first = stops[0];
  return Boolean(first && [first.name, first.address, first.transport_from].some((value) => matchesLabel(value, label)));
}

function endsAt(stops: TripStop[], label: string, returning: boolean): boolean {
  if (returning) return false;
  const last = stops.at(-1);
  return Boolean(last && [last.name, last.address, last.transport_to].some((value) => matchesLabel(value, label)));
}

function matchesLabel(value: string | null | undefined, label: string): boolean {
  if (!value) return false;
  const normalize = (input: string): string => input.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const left = normalize(value);
  const right = normalize(label);
  return left === right || left.includes(right) || right.includes(left);
}

function importedAgents(
  trip: TripPlan,
  stops: TripStop[],
  legs: PlanningLeg[],
  fallback: boolean,
  score: number,
  summary: string,
): PlanningAgentReport[] {
  const grounded = stops.filter((stop) => stop.place_id && !stop.place_id.startsWith('source-')).length;
  const island = stops.filter(isTiomanPlace).length >= 2;
  const unconfirmed = legs.some((leg) => leg.evidence === 'needs_confirmation');
  const report = (id: PlanningAgentReport['id'], label: string, status: PlanningAgentReport['status'], detail: string, evidence: string[]): PlanningAgentReport => ({ id, label, status, summary: detail, evidence });
  return [
    report('grounding', 'Place grounding', grounded === stops.length ? 'ready' : 'limited', `Matched ${grounded} of ${stops.length} source places to map records.`, ['Submitted post', 'Google Places']),
    report('mobility', 'Mobility graph', fallback || unconfirmed ? 'limited' : 'ready', island ? `Grouped ${legs.length} transfers by Tioman village corridor and exposed every cross-zone handoff.` : `Connected ${legs.length} transfers from the stated origin to the final endpoint.`, island ? ['Tioman village zones', 'Sea taxi and 4WD confirmation', 'Return boundary'] : ['Google Routes with offline fallback', 'EasyBook route validation', 'KTMB official network handoff']),
    report('discovery', 'Source recommendation reader', 'ready', `Loaded ${stops.length} places named or shown in the social post.`, [trip.source_url]),
    report('schedule', 'Day scheduler', 'ready', 'Split source recommendations into realistic daily limits.', ['Stop duration and transfer estimates']),
    report('stay', 'Stay planner', 'limited', 'Adds a dated hotel handoff once the traveler supplies a start date.', ['Agoda external search']),
    report(
      'booking',
      'Local action planner',
      'limited',
      island
        ? 'Every stop exposes its village, map location, island-transport guidance and the questions to confirm with a local operator.'
        : 'Every stop exposes directions, Grab address handoff and the questions to ask locally.',
      island ? ['Tioman transport guidance', 'Google Maps location', 'Jalan2 operator requests'] : ['Google Maps', 'Grab booking screen', 'Jalan2 operator requests'],
    ),
    report('critic', 'End-to-end critic', score >= 75 ? 'ready' : 'limited', `${score}/100. ${summary}`, ['Continuity', 'Daily load', 'Unknown provider steps']),
  ];
}

function importedHandoffs(stops: TripStop[], hotelUrl: string | null, transport: PlanningHandoff[]): PlanningHandoff[] {
  const island = stops.filter(isTiomanPlace).length >= 2;
  const routeHandoff: PlanningHandoff = island ? {
    provider: 'Tioman transport guidance', kind: 'directions', status: 'arrange_directly',
    label: 'Check island village connections', url: 'https://tioman.gov.my/pengangkutan/',
    disclaimer: 'Tioman has no single drive route connecting every village. Confirm the exact walkway, 4WD or sea-taxi leg locally.',
  } : {
    provider: 'Google Maps', kind: 'directions', status: 'grounded',
    label: 'Open the complete local route', url: directionsUrl(stops),
    disclaimer: 'Google Maps calculates live directions after the traveler opens this link.',
  };
  const handoffs: PlanningHandoff[] = [...transport, routeHandoff, {
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
