import { Router } from 'express';
import {
  DEFAULT_TRIP_PREFERENCES,
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
import { getTrip, saveTrip } from '../store/trips';

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
    const stop = await customStop(candidate.data, trip.region);
    const stops = replaceOrAppend(trip.stops, stop);
    const selected = [...new Set([...trip.selected_stop_ids, stop.id])];
    res.json(saveTrip({ ...trip, stops, selected_stop_ids: selected, route: null }));
  });
  router.delete('/trips/:id/stops/:stopId', (req, res) => {
    const trip = getTrip(req.params.id);
    if (!trip) {
      res.status(404).json({ error: 'Unknown trip' });
      return;
    }
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

export async function customStop(
  place: PlaceCandidate,
  region: string,
  findRoute: TransitRouteFinder = findEasybookRoute,
): Promise<TripStop> {
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
    place_photo_available: place.place_photo_available,
    place_photo_attributions: place.place_photo_attributions,
    image_attributions: place.image_attributions,
    easybook_url: await findRoute(transitOrigin(region), place.name),
  };
}

function transitOrigin(region: string): string {
  return region.split(',')[0].trim();
}

function replaceOrAppend(stops: TripStop[], added: TripStop): TripStop[] {
  return [...stops.filter((stop) => stop.id !== added.id), added];
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
