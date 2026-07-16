import { haversineMeters, type OptimizedRoute, type TripStop } from '@shared/trip';
import type { PlanningHandoff, PlanningLeg } from './types';

export type TiomanZone =
  | 'tekek_corridor'
  | 'juara_east'
  | 'salang_north'
  | 'genting_southwest'
  | 'nipah_southwest'
  | 'mukut_asah_south';

interface TiomanPlace {
  name: string;
  address?: string | null;
  location: { lat: number; lng: number };
}

const TRANSPORT_URL = 'https://tioman.gov.my/pengangkutan/';
const ZONES: Array<{ id: TiomanZone; label: string; pattern: RegExp; anchor: TiomanPlace['location'] }> = [
  { id: 'tekek_corridor', label: 'Tekek–Berjaya–Paya/ABC corridor', pattern: /tekek|bunut|berjaya|air batang|ayer batang|\babc\b|kampung paya|paya beach/i, anchor: { lat: 2.806, lng: 104.151 } },
  { id: 'juara_east', label: 'Juara east coast', pattern: /juara|mentawak/i, anchor: { lat: 2.793, lng: 104.205 } },
  { id: 'salang_north', label: 'Salang north coast', pattern: /salang|monkey bay|panuba/i, anchor: { lat: 2.879, lng: 104.151 } },
  { id: 'genting_southwest', label: 'Genting southwest coast', pattern: /genting/i, anchor: { lat: 2.758, lng: 104.116 } },
  { id: 'nipah_southwest', label: 'Nipah southwest coast', pattern: /nipah|japamala/i, anchor: { lat: 2.724, lng: 104.107 } },
  { id: 'mukut_asah_south', label: 'Mukut–Asah south coast', pattern: /mukut|asah|dragon horn|twin peak/i, anchor: { lat: 2.705, lng: 104.13 } },
];

export function isTiomanPlace(place: TiomanPlace): boolean {
  return place.location.lat >= 2.67 && place.location.lat <= 2.93
    && place.location.lng >= 104.09 && place.location.lng <= 104.24;
}

export function tiomanZone(place: TiomanPlace): TiomanZone | null {
  if (!isTiomanPlace(place)) return null;
  const identity = `${place.name} ${place.address ?? ''}`;
  const named = ZONES.find((zone) => zone.pattern.test(identity));
  if (named) return named.id;
  return [...ZONES]
    .sort((left, right) => haversineMeters(place.location, left.anchor) - haversineMeters(place.location, right.anchor))[0].id;
}

export function tiomanZoneLabel(zone: TiomanZone): string {
  return ZONES.find((candidate) => candidate.id === zone)?.label ?? zone;
}

export function tiomanZoneCount(stops: TiomanPlace[]): number {
  return new Set(stops.map(tiomanZone).filter((zone): zone is TiomanZone => Boolean(zone))).size;
}

export function orderTiomanStops(stops: TripStop[]): TripStop[] {
  const firstIsland = stops.findIndex(isTiomanPlace);
  let lastIsland = -1;
  for (let index = stops.length - 1; index >= 0; index -= 1) {
    if (isTiomanPlace(stops[index])) { lastIsland = index; break; }
  }
  if (firstIsland < 0 || lastIsland <= firstIsland) return stops;
  const islandStops = stops.slice(firstIsland, lastIsland + 1).filter(isTiomanPlace);
  const groups = new Map<TiomanZone, TripStop[]>();
  for (const stop of islandStops) {
    const zone = tiomanZone(stop);
    if (!zone) continue;
    groups.set(zone, [...(groups.get(zone) ?? []), stop]);
  }
  const clustered = [...groups.values()].flatMap(nearestWithinZone);
  return [...stops.slice(0, firstIsland), ...clustered, ...stops.slice(lastIsland + 1)];
}

export function tiomanAwareRoute(stops: TripStop[]): OptimizedRoute | null {
  const islandStops = stops.filter(isTiomanPlace);
  if (islandStops.length < 2) return null;
  const ordered = orderTiomanStops(stops);
  const zones = tiomanZoneCount(islandStops);
  const warnings = ['Tioman activities are grouped by village corridor; the route is not treated as a continuous drive.'];
  if (zones > 1) warnings.push(`${zones} Tioman mobility zones are selected. Each zone change needs a confirmed water taxi or the documented Tekek–Juara 4WD connection.`);
  let distance = 0;
  let minutes = 0;
  for (let index = 1; index < ordered.length; index += 1) {
    const from = ordered[index - 1];
    const to = ordered[index];
    const legDistance = haversineMeters(from.location, to.location);
    distance += legDistance;
    minutes += isTiomanPlace(from) && isTiomanPlace(to)
      ? tiomanZone(from) === tiomanZone(to) ? localMinutes(legDistance) : boatMinutes(legDistance)
      : Math.max(20, Math.round((legDistance / 1000 / 45) * 60));
  }
  return {
    ordered_stop_ids: ordered.map((stop) => stop.id),
    distance_meters: Math.round(distance),
    duration_minutes: Math.max(1, minutes),
    path: ordered.map((stop) => stop.location),
    provider: 'offline',
    warnings,
  };
}

export function planTiomanTransfer(from: TripStop, to: TripStop): { leg: PlanningLeg; handoff: PlanningHandoff | null } | null {
  const fromZone = tiomanZone(from);
  const toZone = tiomanZone(to);
  if (!fromZone || !toZone) return null;
  const distance = haversineMeters(from.location, to.location);
  if (fromZone === toZone) return sameCorridorLeg(from, to, fromZone, distance);
  if (new Set([fromZone, toZone]).has('tekek_corridor') && new Set([fromZone, toZone]).has('juara_east')) {
    return confirmedLocallyLeg(from, to, 'operator_pickup', distance,
      'Tekek and Juara are connected by a steep cross-island road used by local 4WD transfers. Price, pickup and seats still need direct confirmation.');
  }
  return confirmedLocallyLeg(from, to, 'ferry', distance,
    `This changes from ${tiomanZoneLabel(fromZone)} to ${tiomanZoneLabel(toZone)}. Treat it as a sea-taxi transfer: fare, weather, departure point and return availability are unknown until a local operator confirms them.`);
}

function sameCorridorLeg(from: TripStop, to: TripStop, zone: TiomanZone, distance: number): { leg: PlanningLeg; handoff: PlanningHandoff | null } {
  const walkable = distance <= 1_800;
  const explanation = `Both activities stay inside the ${tiomanZoneLabel(zone)}. ${walkable ? 'Use the local walkway/trail and confirm its current condition.' : 'Use the local walkway, resort shuttle or operator pickup; no cross-village water taxi is planned.'}`;
  const leg: PlanningLeg = {
    id: `leg-${from.id}-${to.id}`,
    from_stop_id: from.id,
    to_stop_id: to.id,
    mode: walkable ? 'walk' : 'operator_pickup',
    provider: walkable ? 'offline' : 'operator',
    duration_minutes: localMinutes(distance),
    distance_meters: Math.round(distance),
    evidence: 'estimated',
    booking: walkable ? 'none' : 'operator_request',
    handoff_url: walkable ? to.google_maps_url ?? null : TRANSPORT_URL,
    explanation,
  };
  return {
    leg,
    handoff: walkable ? null : {
      provider: 'Tioman local transfer', kind: 'transport', status: 'arrange_directly',
      label: `${from.name} to ${to.name}`, url: TRANSPORT_URL,
      disclaimer: explanation,
    },
  };
}

function confirmedLocallyLeg(from: TripStop, to: TripStop, mode: 'ferry' | 'operator_pickup', distance: number, explanation: string): { leg: PlanningLeg; handoff: PlanningHandoff } {
  return {
    leg: {
      id: `leg-${from.id}-${to.id}`,
      from_stop_id: from.id,
      to_stop_id: to.id,
      mode,
      provider: 'operator',
      duration_minutes: mode === 'ferry' ? boatMinutes(distance) : Math.max(30, localMinutes(distance)),
      distance_meters: Math.round(distance),
      evidence: 'needs_confirmation',
      booking: 'operator_request',
      handoff_url: TRANSPORT_URL,
      explanation,
    },
    handoff: {
      provider: mode === 'ferry' ? 'Tioman sea taxi' : 'Tioman 4WD transfer',
      kind: 'transport', status: 'arrange_directly', label: `${from.name} to ${to.name}`,
      url: TRANSPORT_URL, disclaimer: explanation,
    },
  };
}

function nearestWithinZone(stops: TripStop[]): TripStop[] {
  if (stops.length < 3) return stops;
  const remaining = stops.slice(1);
  const ordered = [stops[0]];
  while (remaining.length > 0) {
    const current = ordered.at(-1) as TripStop;
    let nearest = 0;
    for (let index = 1; index < remaining.length; index += 1) {
      if (haversineMeters(current.location, remaining[index].location) < haversineMeters(current.location, remaining[nearest].location)) nearest = index;
    }
    ordered.push(remaining.splice(nearest, 1)[0]);
  }
  return ordered;
}

function localMinutes(distance: number): number {
  return Math.max(12, Math.round((distance / 1000 / 4) * 60));
}

function boatMinutes(distance: number): number {
  return Math.max(25, Math.round((distance / 1000 / 18) * 60) + 15);
}
