import type { PlaceCandidate } from '@shared/trip';

export interface PlacesProvider {
  readonly name: 'google' | 'offline';
  search(query: string, region: string): Promise<PlaceCandidate[]>;
}
