import { useEffect, useState } from "react";
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

  async function run(action: () => Promise<TripPlan>): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      applyTrip(await action());
    } catch (reason) {
      fail(reason);
    } finally {
      setBusy(false);
    }
  }

  async function optimize(): Promise<void> {
    if (!trip || selected.length < 2) return;
    await run(() => optimizeTrip(trip.id, selected, preferences));
  }

  async function toggle(stopId: string): Promise<void> {
    if (!trip) return;
    const next = selected.includes(stopId)
      ? selected.filter((value) => value !== stopId)
      : [...selected, stopId];
    if (next.length < 2) return;
    setSelected(next);
    setTrip({ ...trip, selected_stop_ids: next, route: null });
    await run(() => updateTrip(trip.id, next, preferences));
  }

  async function search(query: string): Promise<void> {
    if (!trip || query.trim().length < 2) return;
    setBusy(true);
    setError(null);
    try {
      setSearchResults(await searchTripPlaces(trip.id, query.trim()));
    } catch (reason) {
      fail(reason);
    } finally {
      setBusy(false);
    }
  }

  async function addDestination(place: PlaceCandidate): Promise<void> {
    if (!trip) return;
    await run(() => addTripPlace(trip.id, place));
    setSearchResults([]);
  }

  async function removeDestination(stopId: string): Promise<void> {
    if (!trip || trip.stops.length <= 1) return;
    await run(() => removeTripPlace(trip.id, stopId));
  }

  return {
    trip,
    selected,
    preferences,
    searchResults,
    busy,
    error,
    optimize,
    toggle,
    search,
    addDestination,
    removeDestination,
    setPreferences,
  };
}
