import { useCallback, useMemo, useRef, useState } from "react";
import type { SavedTripSummary } from "@shared/api";
import type { TripPlan } from "@shared/trip";
import { copyDiscoveryTrip, getSavedTrips, getTrip } from "./api";

interface SavedDiscoveryState {
  savedTrips: SavedTripSummary[];
  savedByDiscovery: ReadonlyMap<string, string>;
  busyId: string | null;
  error: string | null;
  load: () => Promise<void>;
  plan: (discoveryId: string) => Promise<TripPlan>;
}

export function useSavedDiscoveryTrips(): SavedDiscoveryState {
  const [savedTrips, setSavedTrips] = useState<SavedTripSummary[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestIds = useRef(new Map<string, string>());
  const load = useCallback(async (): Promise<void> => {
    try {
      setSavedTrips(await getSavedTrips());
      setError(null);
    } catch (cause) {
      setError(messageFor(cause));
    }
  }, []);
  const plan = useCallback(async (discoveryId: string): Promise<TripPlan> => {
    const existing = savedTrips.find((trip) => trip.sourceDiscoveryId === discoveryId);
    if (existing) return getTrip(existing.id);
    setBusyId(discoveryId);
    try {
      const requestId = requestIds.current.get(discoveryId) ?? createRequestId();
      requestIds.current.set(discoveryId, requestId);
      const trip = await copyDiscoveryTrip(discoveryId, requestId);
      setSavedTrips(await getSavedTrips());
      setError(null);
      return trip;
    } catch (cause) {
      setError(messageFor(cause));
      throw cause;
    } finally {
      setBusyId(null);
    }
  }, [savedTrips]);
  const savedByDiscovery = useMemo(
    () => new Map(savedTrips.map((trip) => [trip.sourceDiscoveryId, trip.id])),
    [savedTrips],
  );
  return { savedTrips, savedByDiscovery, busyId, error, load, plan };
}

function createRequestId(): string {
  return `discovery-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function messageFor(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Could not add this discovery";
}
