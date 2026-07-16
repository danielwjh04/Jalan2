import { Router } from 'express';
import {
  DEFAULT_TRIP_PREFERENCES,
  haversineMeters,
  isTransportStop,
  PlaceCandidateSchema,
  TripPreferencesSchema,
  type PlaceCandidate,
  type TripPlan,
  type TripPreferences,
  type TripStop,
} from '@shared/trip';
import type { PlacesProvider } from '../adapters/places/types';
import type { RoutingProvider } from '../adapters/routing/types';
import { createOfflineRouting } from '../adapters/routing/offline';
import { findEasybookRoute } from '../adapters/transit/easybook';
import { fitBudget } from '../services/routeConstraints';
import { recommendAlongRoute } from '../services/routeSuggestions';
import { getTrip, listSavedTrips, saveTrip } from '../store/trips';

type TransitRouteFinder = (origin: string, destination: string) => Promise<string | null>;

function selectedStops(trip: TripPlan, ids: string[]): TripStop[] {
  if (ids.length < 2 || new Set(ids).size !== ids.length) {
    throw new Error('Choose at least two unique stops');
  }
  const byId = new Map(trip.stops.map((stop) => [stop.id, stop]));
  return ids.map((id) => {
    const stop = byId.get(id);
    if (!stop) throw new Error(`Unknown stop ${id}`);
    return stop;
  });
}

export async function optimizePreparedTrip(
  trip: TripPlan,
  ids: string[],
  routing: RoutingProvider,
  preferences: TripPreferences = trip.preferences ?? DEFAULT_TRIP_PREFERENCES,
): Promise<TripPlan> {
  const selected = selectedStops(trip, ids);
  const fitted = fitBudget(selected, preferences);
  if (fitted.stops.length < 2) throw new Error('Budget leaves fewer than two stops');
  let route;
  try {
    route = await routing.optimize(fitted.stops, preferences);
  } catch {
    route = await createOfflineRouting().optimize(fitted.stops, preferences);
  }
  route.warnings = [...fitted.warnings, ...(route.warnings ?? [])];
  return saveTrip({
    ...trip,
    preferences,
    selected_stop_ids: route.ordered_stop_ids,
    route,
  });
}

export function tripsRouter(routing: RoutingProvider, places: PlacesProvider): Router {
  const router = Router();
  router.get('/trips', (_req, res) => res.json(listSavedTrips()));
  router.get('/trips/:id/suggestions', async (req, res) => {
    const trip = getTrip(req.params.id);
    if (!trip) {
      res.status(404).json({ error: `Unknown trip ${req.params.id}` });
      return;
    }
    try {
      res.json(await recommendAlongRoute(trip, places));
    } catch (error) {
      res.status(502).json({ error: errorMessage(error) });
    }
  });
  router.get('/trips/:id', (req, res) => {
    const trip = getTrip(req.params.id);
    if (!trip) res.status(404).json({ error: `Unknown trip ${req.params.id}` });
    else res.json(trip);
  });
  router.post('/trips/:id/search', async (req, res) => {
    const trip = getTrip(req.params.id);
    const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
    if (!trip || query.length < 2) {
      res.status(400).json({ error: trip ? 'Search query is too short' : 'Unknown trip' });
      return;
    }
    try {
      res.json(await places.search(query, trip.region));
    } catch (error) {
      res.status(502).json({ error: errorMessage(error) });
    }
  });
  router.post('/trips/:id/stops', async (req, res) => {
    const trip = getTrip(req.params.id);
    const candidate = PlaceCandidateSchema.safeParse(req.body?.place);
    if (!trip || !candidate.success) {
      res.status(400).json({ error: trip ? 'Invalid place' : 'Unknown trip' });
      return;
    }
    if (!editable(trip, res)) return;
    const baseStop = customStop(candidate.data);
    const stop = await withIntercityHandoff(baseStop, candidate.data, trip, routing);
    const stops = replaceOrAppend(trip.stops, stop);
    const selected = insertSelectedStop(trip, candidate.data.location, stop.id);
    res.json(saveTrip({ ...trip, stops, selected_stop_ids: selected, route: null }));
  });
  router.delete('/trips/:id/stops/:stopId', (req, res) => {
    const trip = getTrip(req.params.id);
    if (!trip) {
      res.status(404).json({ error: 'Unknown trip' });
      return;
    }
    if (!editable(trip, res)) return;
    const stops = trip.stops.filter((stop) => stop.id !== req.params.stopId);
    if (stops.length === 0) {
      res.status(400).json({ error: 'A trip needs at least one destination' });
      return;
    }
    res.json(saveTrip(removeStop(trip, stops, req.params.stopId)));
  });
  router.patch('/trips/:id', (req, res) => {
    const trip = getTrip(req.params.id);
    const ids = Array.isArray(req.body?.stopIds) ? req.body.stopIds : [];
    const preferences = TripPreferencesSchema.safeParse(req.body?.preferences);
    try {
      if (!trip) throw new Error('Unknown trip');
      if (trip.origin === 'curated') {
        res.status(409).json({ error: 'Add this discovery to Trips before editing' });
        return;
      }
      selectedStops(trip, ids);
      res.json(saveTrip({
        ...trip,
        selected_stop_ids: ids,
        preferences: preferences.success
          ? preferences.data
          : trip.preferences ?? DEFAULT_TRIP_PREFERENCES,
        route: null,
      }));
    } catch (error) {
      res.status(400).json({ error: errorMessage(error) });
    }
  });
  router.post('/trips/:id/optimize', async (req, res) => {
    const trip = getTrip(req.params.id);
    if (!trip) {
      res.status(404).json({ error: `Unknown trip ${req.params.id}` });
      return;
    }
    if (!editable(trip, res)) return;
    const ids = Array.isArray(req.body?.stopIds) ? req.body.stopIds : [];
    const preferences = TripPreferencesSchema.safeParse(req.body?.preferences);
    try {
      res.json(await optimizePreparedTrip(
        trip,
        ids,
        routing,
        preferences.success ? preferences.data : trip.preferences ?? DEFAULT_TRIP_PREFERENCES,
      ));
    } catch (error) {
      res.status(400).json({ error: errorMessage(error) });
    }
  });
  return router;
}

export function customStop(place: PlaceCandidate): TripStop {
  return {
    id: slug(place.place_id),
    name: place.name,
    summary: place.suggested_activity,
    location: place.location,
    image_url: place.image_url,
    estimated_spend_myr: null,
    duration_minutes: 60,
    sources: [{ title: 'Google Maps place', url: place.google_maps_url }],
    place_id: place.place_id,
    address: place.address,
    google_maps_url: place.google_maps_url,
    opening_window: place.opening_window,
    primary_type: place.primary_type,
    reservation_hint: place.reservation_hint,
    place_photo_available: place.place_photo_available,
    place_photo_attributions: place.place_photo_attributions,
    image_attributions: place.image_attributions,
  };
}

export async function withIntercityHandoff(
  stop: TripStop,
  place: PlaceCandidate,
  trip: TripPlan,
  routing: RoutingProvider,
  findRoute: TransitRouteFinder = findEasybookRoute,
): Promise<TripStop> {
  if (!isCity(place.primary_type)) return stop;
  const originStop = lastPhysicalStop(trip);
  if (!originStop) return stop;
  const distance = await routeDistance(originStop, stop, trip, routing);
  if (distance < 80_000) return stop;
  const origin = transitOrigin(trip.region);
  const url = await findRoute(origin, place.name);
  if (!url) return stop;
  return { ...stop, easybook_url: url, transport_provider: 'easybook', transport_from: origin, transport_to: place.name, transport_mode: 'Intercity coach', transport_url: url };
}

async function routeDistance(from: TripStop, to: TripStop, trip: TripPlan, routing: RoutingProvider): Promise<number> {
  try {
    const route = await routing.optimize([from, to], trip.preferences ?? DEFAULT_TRIP_PREFERENCES);
    return route.distance_meters;
  } catch {
    return haversineMeters(from.location, to.location);
  }
}

function lastPhysicalStop(trip: TripPlan): TripStop | null {
  const byId = new Map(trip.stops.map((stop) => [stop.id, stop]));
  return [...trip.selected_stop_ids].reverse().map((id) => byId.get(id)).find((stop) => stop && !isTransportStop(stop)) ?? null;
}

function isCity(primaryType?: string | null): boolean {
  return primaryType === 'locality' || primaryType === 'administrative_area_level_2';
}

function transitOrigin(region: string): string {
  return region.split(',')[0].split(/\s+(?:to|and)\s+/i)[0].trim();
}

function replaceOrAppend(stops: TripStop[], added: TripStop): TripStop[] {
  return [...stops.filter((stop) => stop.id !== added.id), added];
}

function insertSelectedStop(trip: TripPlan, location: TripStop['location'], stopId: string): string[] {
  const selected = trip.selected_stop_ids.filter((id) => id !== stopId);
  if (selected.length < 2) return [...selected, stopId];
  const byId = new Map(trip.stops.map((stop) => [stop.id, stop]));
  let bestIndex = selected.length;
  let smallestDetour = Infinity;
  for (let index = 1; index < selected.length; index += 1) {
    const start = byId.get(selected[index - 1]);
    const end = byId.get(selected[index]);
    if (!start || !end) continue;
    const detour = haversineMeters(start.location, location)
      + haversineMeters(location, end.location)
      - haversineMeters(start.location, end.location);
    if (detour < smallestDetour) {
      smallestDetour = detour;
      bestIndex = index;
    }
  }
  return [...selected.slice(0, bestIndex), stopId, ...selected.slice(bestIndex)];
}

function removeStop(trip: TripPlan, stops: TripStop[], removed: string): TripPlan {
  const preferences = trip.preferences ?? DEFAULT_TRIP_PREFERENCES;
  const selected = trip.selected_stop_ids.filter((id) => id !== removed);
  return {
    ...trip,
    stops,
    selected_stop_ids: selected.length > 0 ? selected : [stops[0].id],
    preferences: {
      ...preferences,
      start_stop_id: preferences.start_stop_id === removed ? null : preferences.start_stop_id,
      end_stop_id: preferences.end_stop_id === removed ? null : preferences.end_stop_id,
    },
    route: null,
  };
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Trip request failed';
}

function editable(trip: TripPlan, response: { status(code: number): { json(body: { error: string }): void } }): boolean {
  if (trip.origin !== 'curated') return true;
  response.status(409).json({ error: 'Add this discovery to Trips before editing' });
  return false;
}
