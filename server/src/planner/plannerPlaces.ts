import type { SmartPlanRequest } from '@shared/planner';
import type { PlaceCandidate, TripStop } from '@shared/trip';
import type { PlacesProvider } from '../adapters/places/types';

export async function groundPlace(query: string, places: PlacesProvider): Promise<PlaceCandidate> {
  const results = await places.search(query, 'Malaysia');
  const ranked = results.map((place) => ({ place, score: groundingScore(query, place) }))
    .sort((a, b) => b.score - a.score);
  if (!ranked[0] || ranked[0].score < 2) throw new Error(`Could not confidently locate ${query} in Malaysia`);
  return ranked[0].place;
}

export async function discoverActivities(
  request: SmartPlanRequest,
  destination: string,
  places: PlacesProvider,
): Promise<PlaceCandidate[]> {
  const queries = [...new Set([...request.interests, 'local food'])];
  const groups = await Promise.all(queries.map((interest) => (
    places.search(`${interest} in ${destination}`, destination)
  )));
  const ranked = groups.map((items) => [...items].sort((a, b) => popularity(b) - popularity(a)));
  return roundRobin(ranked, Math.min(8, Math.max(queries.length, request.days * 2)));
}

export function toStop(place: PlaceCandidate, role: string): TripStop {
  return {
    id: `${role}-${slug(place.place_id)}`,
    name: place.name,
    summary: role === 'origin' ? 'Start the journey here.' : place.suggested_activity,
    location: place.location,
    image_url: place.image_url,
    estimated_spend_myr: null,
    duration_minutes: role === 'activity' ? visitMinutes(place.primary_type) : 15,
    sources: [{ title: 'Google Maps place', url: place.google_maps_url }],
    place_id: place.place_id,
    address: place.address,
    google_maps_url: place.google_maps_url,
    opening_window: place.opening_window,
    primary_type: place.primary_type,
    reservation_hint: place.reservation_hint,
    place_photo_available: place.place_photo_available,
    place_photo_attributions: place.place_photo_attributions,
    image_attributions: place.image_attributions,
  };
}

export function transitHubFor(destination: string): { placeQuery: string; transitLabel: string } | null {
  const normalized = normalize(destination);
  if (normalized.includes('gopeng') || normalized.includes('kampar')) {
    return { placeQuery: 'Terminal Amanjaya', transitLabel: 'Ipoh' };
  }
  return null;
}

function groundingScore(query: string, place: PlaceCandidate): number {
  const aliases: Record<string, string> = { kl: 'kuala lumpur', kk: 'kota kinabalu' };
  const wanted = aliases[normalize(query)] ?? normalize(query);
  const name = normalize(place.name);
  const exact = name === wanted ? 10 : name.includes(wanted) || wanted.includes(name) ? 6 : 0;
  const address = normalize(place.address).includes(wanted) ? 3 : 0;
  return exact + address + (place.rating ?? 0) / 5;
}

function popularity(place: PlaceCandidate): number {
  return (place.rating ?? 0) * 20 + Math.log10((place.user_rating_count ?? 0) + 1) * 10;
}

function roundRobin(groups: PlaceCandidate[][], limit: number): PlaceCandidate[] {
  const selected: PlaceCandidate[] = [];
  const seen = new Set<string>();
  for (let rank = 0; selected.length < limit && groups.some((items) => rank < items.length); rank += 1) {
    for (const group of groups) {
      const place = group[rank];
      if (!place || seen.has(place.place_id)) continue;
      seen.add(place.place_id);
      selected.push(place);
      if (selected.length === limit) break;
    }
  }
  return selected;
}

function visitMinutes(type?: string | null): number {
  if (type === 'restaurant' || type === 'cafe') return 75;
  if (type === 'museum') return 120;
  return 105;
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}
