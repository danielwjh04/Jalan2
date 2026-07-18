import type { GeoPoint, PlaceCandidate } from '@shared/trip';
import type { ImageAttribution } from '@shared/media';

export interface PlacePhoto {
  bytes: Uint8Array;
  contentType: string;
  attributions?: ImageAttribution[];
}

export interface PlacesProvider {
  readonly name: 'google' | 'offline';
  search(query: string, region: string): Promise<PlaceCandidate[]>;
  nearbyPopular?(center: GeoPoint, radiusMeters: number): Promise<PlaceCandidate[]>;
  withImages?(candidates: PlaceCandidate[]): Promise<PlaceCandidate[]>;
  photo(placeId: string, index?: number): Promise<PlacePhoto | null>;
}
