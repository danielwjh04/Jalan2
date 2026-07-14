import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { TripPlanSchema, type TripPlan } from '@shared/trip';
import { loadCachedTrip } from '../lib/fixtures';
import { tripsDataRoot } from '../lib/paths';

const trips = new Map<string, TripPlan>();

export function getTrip(id: string): TripPlan | null {
  const memory = trips.get(id);
  if (memory) return memory;
  const stored = readStoredTrip(id) ?? loadCachedTrip(id);
  if (stored) trips.set(stored.id, stored);
  return stored;
}

export function saveTrip(trip: TripPlan): TripPlan {
  const parsed = TripPlanSchema.parse(trip);
  trips.set(parsed.id, parsed);
  persist(parsed);
  return parsed;
}

export function resetTrips(): void {
  trips.clear();
}

function readStoredTrip(id: string): TripPlan | null {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null;
  const filePath = path.join(tripsDataRoot(), `${id}.json`);
  if (!existsSync(filePath)) return null;
  const parsed = TripPlanSchema.safeParse(JSON.parse(readFileSync(filePath, 'utf8')));
  return parsed.success ? parsed.data : null;
}

function persist(trip: TripPlan): void {
  mkdirSync(tripsDataRoot(), { recursive: true });
  const filePath = path.join(tripsDataRoot(), `${trip.id}.json`);
  const tempPath = `${filePath}.tmp`;
  writeFileSync(tempPath, `${JSON.stringify(trip, null, 2)}\n`, 'utf8');
  renameSync(tempPath, filePath);
}
