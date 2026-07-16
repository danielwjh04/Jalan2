import {
  DEFAULT_TRIP_PREFERENCES,
  haversineMeters,
  type OptimizedRoute,
  type TripPreferences,
  type TripStop,
} from '@shared/trip';
import { createOfflineRouting } from '../adapters/routing/offline';
import type { RoutingProvider } from '../adapters/routing/types';
import type { PlanningLeg } from './types';
import { tiomanAwareRoute } from './tiomanMobility';

export interface RoutedStops { route: OptimizedRoute; fallback: boolean }

export async function routePhysicalStops(
  stops: TripStop[],
  routing: RoutingProvider,
  requestedPreferences?: TripPreferences,
): Promise<RoutedStops> {
  const islandRoute = tiomanAwareRoute(stops);
  if (islandRoute) return { route: islandRoute, fallback: false };
  const preferences = {
    ...(requestedPreferences ?? DEFAULT_TRIP_PREFERENCES),
    start_stop_id: requestedPreferences?.start_stop_id ?? stops[0].id,
    end_stop_id: requestedPreferences?.end_stop_id ?? null,
  };
  try { return { route: await routing.optimize(stops, preferences), fallback: false }; }
  catch { return { route: await createOfflineRouting().optimize(stops, preferences), fallback: true }; }
}

export function orderStops(stops: TripStop[], ids: string[]): TripStop[] {
  const byId = new Map(stops.map((stop) => [stop.id, stop]));
  return ids.map((id) => byId.get(id)).filter((stop): stop is TripStop => Boolean(stop));
}

export function buildLocalLegs(
  stops: TripStop[],
  provider: OptimizedRoute['provider'],
): PlanningLeg[] {
  return stops.slice(1).map((stop, index) => localLeg(stops[index], stop, provider));
}

function localLeg(from: TripStop, to: TripStop, provider: OptimizedRoute['provider']): PlanningLeg {
  const distance = haversineMeters(from.location, to.location);
  return {
    id: `leg-${from.id}-${to.id}`,
    from_stop_id: from.id,
    to_stop_id: to.id,
    mode: 'drive',
    provider: provider === 'google' ? 'google_routes' : 'offline',
    duration_minutes: Math.max(10, Math.round((distance / 1000 / 32) * 60)),
    distance_meters: Math.round(distance),
    evidence: provider === 'google' ? 'provider_verified' : 'estimated',
    booking: 'none',
    handoff_url: to.google_maps_url ?? null,
    explanation: provider === 'google'
      ? 'Google Routes determined the local stop order; per-leg time is an estimate.'
      : 'Google Routes was unavailable, so Jalan2 used an offline distance estimate.',
  };
}
