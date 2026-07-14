import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  DEFAULT_TRIP_PREFERENCES,
  type PlaceCandidate,
  type TripPlan,
  type TripPreferences,
} from "@shared/trip";
import {
  addTripPlace,
  getTrip,
  optimizeTrip,
  removeTripPlace,
  searchTripPlaces,
  updateTrip,
} from "./api";
import { applyTravelDefaults, type TravelDefaults } from "./travelDefaults";

export interface TripPlannerState {
  trip: TripPlan | null;
  selected: string[];
  preferences: TripPreferences;
  searchResults: PlaceCandidate[];
  busy: boolean;
  error: string | null;
  optimize: () => Promise<void>;
  toggle: (stopId: string) => Promise<void>;
  search: (query: string) => Promise<void>;
  addDestination: (place: PlaceCandidate) => Promise<void>;
  removeDestination: (stopId: string) => Promise<void>;
  applyDefaults: (defaults: TravelDefaults) => Promise<void>;
  setPreferences: (preferences: TripPreferences) => void;
}

export function useTripPlanner(id: string | undefined): TripPlannerState {
  const [trip, setTrip] = useState<TripPlan | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [preferences, setPreferences] = useState(DEFAULT_TRIP_PREFERENCES);
  const [searchResults, setSearchResults] = useState<PlaceCandidate[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    void getTrip(id).then(applyTrip).catch(fail);
  }, [id]);
  function applyTrip(loaded: TripPlan): void {
    setTrip(loaded);
    setSelected(loaded.selected_stop_ids);
    setPreferences(loaded.preferences ?? DEFAULT_TRIP_PREFERENCES);
  }

  function fail(reason: unknown): void {
    setError(reason instanceof Error ? reason.message : "Trip request failed");
  }
  const context = { trip, selected, preferences, busy, setTrip, setSelected, setSearchResults, setBusy, setError, fail };
  const run = createRunner(setBusy, setError, applyTrip, fail);
  return {
    trip,
    selected,
    preferences,
    searchResults,
    busy,
    error,
    ...createRouteActions(context, run),
    ...createPlaceActions(context, run),
    setPreferences,
  };
}

type Setter<T> = Dispatch<SetStateAction<T>>;
type TripRunner = (action: () => Promise<TripPlan>) => Promise<boolean>;

interface ActionContext {
  trip: TripPlan | null;
  selected: string[];
  preferences: TripPreferences;
  busy: boolean;
  setTrip: Setter<TripPlan | null>;
  setSelected: Setter<string[]>;
  setSearchResults: Setter<PlaceCandidate[]>;
  setBusy: Setter<boolean>;
  setError: Setter<string | null>;
  fail: (reason: unknown) => void;
}

function createRunner(setBusy: Setter<boolean>, setError: Setter<string | null>, applyTrip: (trip: TripPlan) => void, fail: (reason: unknown) => void): TripRunner {
  return async (action): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      applyTrip(await action());
      return true;
    } catch (reason) {
      fail(reason);
      return false;
    } finally {
      setBusy(false);
    }
  };
}

function createRouteActions(context: ActionContext, run: TripRunner): Pick<TripPlannerState, "optimize" | "toggle" | "applyDefaults"> {
  const optimize = async (): Promise<void> => {
    const trip = context.trip;
    if (!trip || context.busy || context.selected.length < 2) return;
    await run(() => optimizeTrip(trip.id, context.selected, context.preferences));
  };
  const toggle = async (stopId: string): Promise<void> => {
    const trip = context.trip;
    if (!trip || context.busy) return;
    const next = context.selected.includes(stopId) ? context.selected.filter((value) => value !== stopId) : [...context.selected, stopId];
    if (next.length < 2) return;
    context.setSelected(next);
    context.setTrip({ ...trip, selected_stop_ids: next, route: null });
    const updated = await run(() => updateTrip(trip.id, next, context.preferences));
    if (!updated) {
      context.setSelected(context.selected);
      context.setTrip(trip);
    }
  };
  const applyDefaults = async (defaults: TravelDefaults): Promise<void> => {
    const trip = context.trip;
    if (!trip || context.busy) return;
    const next = applyTravelDefaults(trip.stops.map(({ id }) => id), context.preferences, defaults);
    await run(() => updateTrip(trip.id, next.selectedStopIds, next.preferences));
  };
  return { optimize, toggle, applyDefaults };
}

function createPlaceActions(context: ActionContext, run: TripRunner): Pick<TripPlannerState, "search" | "addDestination" | "removeDestination"> {
  const search = async (query: string): Promise<void> => {
    const trip = context.trip;
    if (!trip || context.busy || query.trim().length < 2) return;
    context.setBusy(true);
    context.setError(null);
    try {
      context.setSearchResults(await searchTripPlaces(trip.id, query.trim()));
    } catch (reason) {
      context.fail(reason);
    } finally {
      context.setBusy(false);
    }
  };
  const addDestination = async (place: PlaceCandidate): Promise<void> => {
    const trip = context.trip;
    if (!trip || context.busy) return;
    const added = await run(() => addTripPlace(trip.id, place));
    if (added) context.setSearchResults([]);
  };
  const removeDestination = async (stopId: string): Promise<void> => {
    const trip = context.trip;
    if (!trip || context.busy || trip.stops.length <= 1) return;
    await run(() => removeTripPlace(trip.id, stopId));
  };
  return { search, addDestination, removeDestination };
}
