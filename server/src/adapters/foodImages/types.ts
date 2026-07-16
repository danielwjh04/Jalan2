import type { ImageAttribution } from '@shared/media';

export interface DishPhoto {
  imageUrl: string;
  imageAttributions: ImageAttribution[];
}

export interface DishImageQuery {
  localName: string;
  englishName: string;
  searchQuery: string;
}

export interface FoodImageProvider {
  readonly name: 'wikimedia' | 'openverse' | 'unsplash' | 'licensed-chain';
  findDishPhoto(query: DishImageQuery): Promise<DishPhoto | null>;
  findDishPhotos?(query: DishImageQuery, limit: number): Promise<DishPhoto[]>;
}

export interface PlaceImageProvider {
  readonly name: 'wikimedia';
  findPlacePhoto(name: string, address: string): Promise<DishPhoto | null>;
}
