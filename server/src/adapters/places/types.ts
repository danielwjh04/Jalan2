import type { PlaceCandidate } from '@shared/trip';

export interface PlacePhoto {
  bytes: Uint8Array;
  contentType: string;
}

export interface PlacesProvider {
  readonly name: 'google' | 'offline';
  search(query: string, region: string): Promise<PlaceCandidate[]>;
  photo(placeId: string): Promise<PlacePhoto | null>;
}
