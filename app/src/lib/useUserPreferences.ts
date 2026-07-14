import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_TRAVEL_DEFAULTS,
  type TravelDefaults,
} from "./travelDefaults";
import { loadTravelDefaults, saveTravelDefaults } from "./userPreferences";

export interface UserPreferencesState {
  defaults: TravelDefaults;
  loaded: boolean;
  error: string | null;
  save: (next: TravelDefaults) => Promise<boolean>;
}

export function useUserPreferences(): UserPreferencesState {
  const [defaults, setDefaults] = useState(DEFAULT_TRAVEL_DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void loadTravelDefaults().then((stored) => {
      if (!active) return;
      setDefaults(stored);
      setLoaded(true);
    });
    return () => { active = false; };
  }, []);
  const save = useCallback(async (next: TravelDefaults): Promise<boolean> => {
    setError(null);
    try {
      await saveTravelDefaults(next);
      setDefaults(next);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save preferences");
      return false;
    }
  }, []);
  return { defaults, loaded, error, save };
}
