import type { ImageAttribution } from '@shared/media';

export interface DishPhoto {
  imageUrl: string;
  imageAttributions: ImageAttribution[];
}

export interface FoodImageProvider {
  readonly name: 'wikimedia';
  findDishPhoto(name: string): Promise<DishPhoto | null>;
}

export interface PlaceImageProvider {
  readonly name: 'wikimedia';
  findPlacePhoto(name: string, address: string): Promise<DishPhoto | null>;
}
