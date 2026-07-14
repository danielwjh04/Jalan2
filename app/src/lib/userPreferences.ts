import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_TRAVEL_DEFAULTS,
  parseTravelDefaults,
  type TravelDefaults,
} from "./travelDefaults";

const STORAGE_KEY = "@jalan2/travel-defaults";

export async function loadTravelDefaults(): Promise<TravelDefaults> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored === null
      ? DEFAULT_TRAVEL_DEFAULTS
      : parseTravelDefaults(JSON.parse(stored) as unknown);
  } catch {
    return DEFAULT_TRAVEL_DEFAULTS;
  }
}

export async function saveTravelDefaults(defaults: TravelDefaults): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
}
