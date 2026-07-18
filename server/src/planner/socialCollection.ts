import { randomUUID } from 'node:crypto';
import {
  DEFAULT_TRIP_PREFERENCES,
  type TripPlan,
  type TripSource,
  type TripStop,
} from '@shared/trip';
import type { RoutingProvider } from '../adapters/routing/types';
import type { PlacesProvider } from '../adapters/places/types';
import { saveTrip } from '../store/trips';
import { planImportedTrip } from './importedTripPlanner';
import type { PlanCritic } from './planCritic';

export interface SocialTripSelection {
  trip: TripPlan;
  stopIds: string[];
}

export async function createSocialCollectionTrip(
  selections: SocialTripSelection[],
  routing: RoutingProvider,
  critic?: PlanCritic,
  title?: string,
  save: (trip: TripPlan) => TripPlan = saveTrip,
  places?: PlacesProvider,
): Promise<TripPlan> {
  const stops = mergeStops(selections);
  if (stops.length < 2) throw new Error('Choose at least two places');
  const sources = selections.map(({ trip }) => trip);
  const regions = unique(sources.map(({ region }) => region));
  const creators = unique(sources.map(({ source_creator }) => source_creator));
  const base: TripPlan = {
    id: `social-${randomUUID().slice(0, 8)}`,
    title: title?.trim() || defaultTitle(regions),
    summary: `A selectable route combined from ${sources.length} social post${sources.length === 1 ? '' : 's'}.`,
    region: regions.join(' → '),
    source_creator: creators.join(' + '),
    source_url: sources[0].source_url,
    cover_url: sources.find(({ cover_url }) => Boolean(cover_url))?.cover_url ?? stops.find(({ image_url }) => Boolean(image_url))?.image_url ?? null,
    demo: false,
    origin: 'social_collection',
    source_discovery_id: null,
    stops,
    selected_stop_ids: stops.map(({ id }) => id),
    preferences: { ...DEFAULT_TRIP_PREFERENCES, start_stop_id: stops[0].id },
    route: null,
    planning: null,
  };
  return save(await planImportedTrip(base, routing, critic, places));
}

function mergeStops(selections: SocialTripSelection[]): TripStop[] {
  const merged = new Map<string, TripStop>();
  let position = 0;
  for (const { trip, stopIds } of selections) {
    const byId = new Map(trip.stops.map((stop) => [stop.id, stop]));
    for (const stopId of stopIds) {
      const stop = byId.get(stopId);
      if (!stop) throw new Error(`Unknown stop ${stopId} in ${trip.title}`);
      const key = stopKey(stop);
      const existing = merged.get(key);
      if (existing) {
        existing.sources = uniqueSources([...existing.sources, ...stop.sources]);
        continue;
      }
      position += 1;
      merged.set(key, {
        ...structuredClone(stop),
        id: `social-${position}-${slug(stop.name)}`,
        sources: uniqueSources(stop.sources),
        transport_provider: null,
        easybook_url: null,
        transport_from: null,
        transport_to: null,
        transport_mode: null,
        transport_url: null,
      });
    }
  }
  return [...merged.values()];
}

function stopKey(stop: TripStop): string {
  if (stop.place_id && !stop.place_id.startsWith('source-')) return `place:${stop.place_id}`;
  return `name:${stop.name.trim().toLowerCase()}:${stop.location.lat.toFixed(4)}:${stop.location.lng.toFixed(4)}`;
}

function uniqueSources(sources: TripSource[]): TripSource[] {
  const seen = new Set<string>();
  return sources.filter(({ url }) => !seen.has(url) && Boolean(seen.add(url)));
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function defaultTitle(regions: string[]): string {
  if (regions.length === 1) return `${regions[0].split(',')[0]} social itinerary`;
  return 'My Malaysia social itinerary';
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'place';
}
