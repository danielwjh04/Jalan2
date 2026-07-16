import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { SavedTripSummary } from '@shared/api';
import { TripPlanSchema, type TripPlan } from '@shared/trip';
import { loadCachedTrip } from '../lib/fixtures';
import { loadDiscoveryTrip } from '../lib/discoveries';
import { tripsDataRoot } from '../lib/paths';

const trips = new Map<string, TripPlan>();
const copyIds = new Map<string, string>();
const savedSummaries = new Map<string, SavedTripSummary & { order: number }>();
let savedOrder = 0;

export function getTrip(id: string): TripPlan | null {
  const memory = trips.get(id);
  if (memory) return memory;
  const stored = readStoredTrip(id) ?? loadDiscoveryTrip(id) ?? loadCachedTrip(id);
  if (stored) trips.set(stored.id, stored);
  return stored;
}

export function saveTrip(trip: TripPlan): TripPlan {
  const parsed = TripPlanSchema.parse(trip);
  trips.set(parsed.id, parsed);
  if (parsed.origin === 'saved_discovery' || parsed.origin === 'smart_plan' || parsed.origin === 'social_collection') touchSavedSummary(parsed);
  if (parsed.origin !== 'saved_discovery') persist(parsed);
  return parsed;
}

export function copyDiscoveryTrip(id: string, clientRequestId: string): TripPlan {
  const existingId = copyIds.get(clientRequestId);
  if (existingId) return getRequiredTrip(existingId);
  const source = loadDiscoveryTrip(id);
  if (!source) throw new Error(`Unknown discovery ${id}`);
  const copy = TripPlanSchema.parse({
    ...structuredClone(source),
    id: `saved-${id}-${randomUUID().slice(0, 8)}`,
    origin: 'saved_discovery',
    source_discovery_id: id,
  });
  copyIds.set(clientRequestId, copy.id);
  return saveTrip(copy);
}

export function listSavedTrips(): SavedTripSummary[] {
  hydrateStoredSmartPlans();
  return [...savedSummaries.values()]
    .sort((a, b) => b.order - a.order)
    .map(({ order: _order, ...summary }) => summary);
}

function hydrateStoredSmartPlans(): void {
  if (process.env.NODE_ENV === 'test') return;
  const root = tripsDataRoot();
  if (!existsSync(root)) return;
  for (const filename of readdirSync(root).filter((name) => name.endsWith('.json'))) {
    try {
      const parsed = TripPlanSchema.safeParse(JSON.parse(readFileSync(path.join(root, filename), 'utf8')));
      if (parsed.success && (parsed.data.origin === 'smart_plan' || parsed.data.origin === 'social_collection') && !savedSummaries.has(parsed.data.id)) {
        trips.set(parsed.data.id, parsed.data);
        touchSavedSummary(parsed.data);
      }
    } catch {
      continue;
    }
  }
}

export function resetTrips(): void {
  trips.clear();
  copyIds.clear();
  savedSummaries.clear();
  savedOrder = 0;
}

function getRequiredTrip(id: string): TripPlan {
  const trip = trips.get(id);
  if (!trip) throw new Error(`Unknown trip ${id}`);
  return trip;
}

function touchSavedSummary(trip: TripPlan): void {
  savedOrder += 1;
  savedSummaries.set(trip.id, {
    id: trip.id,
    sourceDiscoveryId: trip.source_discovery_id,
    origin: trip.origin === 'smart_plan' || trip.origin === 'social_collection' ? trip.origin : 'saved_discovery',
    title: trip.title,
    region: trip.region,
    coverUrl: trip.cover_url,
    stopCount: trip.selected_stop_ids.length,
    updatedAt: new Date().toISOString(),
    order: savedOrder,
  });
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
