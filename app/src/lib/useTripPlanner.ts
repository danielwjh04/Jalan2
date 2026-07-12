import { useEffect, useState } from "react";
import type { TripPlan } from "@shared/trip";
import { getTrip, optimizeTrip } from "./api";

export interface TripPlannerState {
  trip: TripPlan | null;
  selected: string[];
  busy: boolean;
  error: string | null;
  optimize: () => Promise<void>;
  toggle: (stopId: string) => void;
}

export function useTripPlanner(id: string | undefined): TripPlannerState {
  const [trip, setTrip] = useState<TripPlan | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    void getTrip(id)
      .then((loaded) => {
        setTrip(loaded);
        setSelected(loaded.selected_stop_ids);
      })
      .catch((reason: Error) => setError(reason.message));
  }, [id]);

  async function optimize(): Promise<void> {
    if (!trip || selected.length < 2) return;
    setBusy(true);
    setError(null);
    try {
      const result = await optimizeTrip(trip.id, selected);
      setTrip(result);
      setSelected(result.selected_stop_ids);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not optimize route",
      );
    } finally {
      setBusy(false);
    }
  }

  function toggle(stopId: string): void {
    setSelected((current) =>
      current.includes(stopId)
        ? current.filter((value) => value !== stopId)
        : [...current, stopId],
    );
    setTrip((current) => (current ? { ...current, route: null } : current));
  }
  return { trip, selected, busy, error, optimize, toggle };
}
