import { haversineMeters, type TripStop } from '@shared/trip';
import type { PlanningHandoff, PlanningLeg } from './types';

export type EasybookFinder = (origin: string, destination: string) => Promise<string | null>;

interface TransportInput {
  origin: TripStop;
  destination: TripStop;
  originLabel?: string;
  destinationLabel?: string;
  routeProvider: 'google' | 'offline';
  routeDistanceMeters: number;
  findEasybook: EasybookFinder;
}

export async function planIntercityLeg(input: TransportInput): Promise<{
  leg: PlanningLeg;
  handoff: PlanningHandoff;
}> {
  const distance = Math.max(
    input.routeDistanceMeters,
    haversineMeters(input.origin.location, input.destination.location),
  );
  if (crossesSea(input.origin, input.destination)) return flightLeg(input, distance);
  if (distance >= 80_000) {
    const easybook = await safeEasybook(
      input.findEasybook,
      input.originLabel ?? input.origin.name,
      input.destinationLabel ?? input.destination.name,
    );
    if (easybook) return easybookLeg(input, distance, easybook);
  }
  return roadLeg(input, distance);
}

export function planLastMileLeg(hub: TripStop, destination: TripStop): {
  leg: PlanningLeg;
  handoff: PlanningHandoff;
} {
  const distance = haversineMeters(hub.location, destination.location);
  const url = `https://www.grab.com/my/transport/`;
  return {
    leg: {
      id: `leg-${hub.id}-${destination.id}`,
      from_stop_id: hub.id,
      to_stop_id: destination.id,
      mode: 'operator_pickup',
      provider: 'operator',
      duration_minutes: roadMinutes(distance, 38),
      distance_meters: Math.round(distance),
      evidence: 'needs_confirmation',
      booking: 'operator_request',
      handoff_url: url,
      explanation: 'Ask the activity operator to confirm terminal pickup. Grab is only a fallback availability check, not a booked ride.',
    },
    handoff: {
      provider: 'Operator pickup with Grab fallback',
      kind: 'transport',
      status: 'arrange_directly',
      label: `${hub.name} to ${destination.name}`,
      url,
      disclaimer: 'Operator pickup needs explicit confirmation. Grab coverage, fare and ETA must be checked in the app.',
    },
  };
}

function crossesSea(origin: TripStop, destination: TripStop): boolean {
  const peninsula = (stop: TripStop): boolean => stop.location.lng < 106;
  const borneo = (stop: TripStop): boolean => stop.location.lng > 109;
  return (peninsula(origin) && borneo(destination)) || (borneo(origin) && peninsula(destination));
}

function flightLeg(input: TransportInput, distance: number): ReturnType<typeof roadLeg> {
  const url = flightSearch(input.origin.name, input.destination.name);
  return packageLeg(input, {
    mode: 'flight', provider: 'unknown', duration: 300, distance,
    evidence: 'needs_confirmation', booking: 'external_search', url,
    explanation: 'The route crosses between Peninsular Malaysia and Borneo. Jalan2 requires a flight search and does not invent a drive connection.',
    providerLabel: 'Flight search',
  });
}

function easybookLeg(input: TransportInput, distance: number, url: string): ReturnType<typeof roadLeg> {
  return packageLeg(input, {
    mode: islandName(input.destination.name) ? 'multimodal' : 'coach',
    provider: 'easybook', duration: roadMinutes(distance, 58), distance,
    evidence: 'provider_verified', booking: 'external_search', url,
    explanation: 'An official EasyBook route page matches both endpoints. Departure time, fare, seat and any ferry transfer still require an external check.',
    providerLabel: 'EasyBook',
  });
}

function roadLeg(input: TransportInput, distance: number) {
  const verified = input.routeProvider === 'google';
  const url = directionsUrl(input.origin.name, input.destination.name);
  return packageLeg(input, {
    mode: distance < 80_000 ? 'drive' : 'multimodal',
    provider: verified ? 'google_routes' : 'offline',
    duration: roadMinutes(distance, distance < 80_000 ? 42 : 58), distance,
    evidence: verified ? 'provider_verified' : 'estimated',
    booking: 'none', url,
    explanation: verified
      ? 'Google Routes grounded this road leg. This is routing evidence, not a ride or ticket booking.'
      : 'No ticket provider was verified. Jalan2 shows an estimated connection and requires the traveler to confirm the transport mode.',
    providerLabel: verified ? 'Google Routes' : 'Transport to confirm',
  });
}

function packageLeg(input: TransportInput, decision: {
  mode: PlanningLeg['mode']; provider: PlanningLeg['provider']; duration: number;
  distance: number; evidence: PlanningLeg['evidence']; booking: PlanningLeg['booking'];
  url: string; explanation: string; providerLabel: string;
}): { leg: PlanningLeg; handoff: PlanningHandoff } {
  return {
    leg: {
      id: `leg-${input.origin.id}-${input.destination.id}`,
      from_stop_id: input.origin.id,
      to_stop_id: input.destination.id,
      mode: decision.mode,
      provider: decision.provider,
      duration_minutes: decision.duration,
      distance_meters: Math.round(decision.distance),
      evidence: decision.evidence,
      booking: decision.booking,
      handoff_url: decision.url,
      explanation: decision.explanation,
    },
    handoff: {
      provider: decision.providerLabel,
      kind: 'transport',
      status: decision.booking === 'external_search' ? 'external_search' : 'grounded',
      label: `${input.originLabel ?? input.origin.name} to ${input.destinationLabel ?? input.destination.name}`,
      url: decision.url,
      disclaimer: decision.explanation,
    },
  };
}

async function safeEasybook(finder: EasybookFinder, origin: string, destination: string): Promise<string | null> {
  try { return await finder(origin, destination); } catch { return null; }
}

function roadMinutes(distance: number, speedKph: number): number {
  return Math.max(20, Math.round((distance / 1000 / speedKph) * 60));
}

function islandName(name: string): boolean {
  return /tioman|redang|perhentian|langkawi|pangkor/i.test(name);
}

function directionsUrl(origin: string, destination: string): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
}

function flightSearch(origin: string, destination: string): string {
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights from ${origin} to ${destination}`)}`;
}
