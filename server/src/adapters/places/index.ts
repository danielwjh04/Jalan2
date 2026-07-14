import type { Config } from '../../config';
import { NotConfiguredError } from '../../lib/errors';
import { createGooglePlaces } from './google';
import { createOfflinePlaces } from './offline';
import type { PlacesProvider } from './types';

export function createPlaces(config: Config): PlacesProvider {
  if (config.PLACES_PROVIDER === 'offline') return createOfflinePlaces();
  if (config.GOOGLE_MAPS_API_KEY) return createGooglePlaces(config.GOOGLE_MAPS_API_KEY);
  if (config.PLACES_PROVIDER === 'google') {
    throw new NotConfiguredError(
      'Google Places',
      'Set GOOGLE_MAPS_API_KEY or use PLACES_PROVIDER=offline.',
    );
  }
  return createOfflinePlaces();
}
