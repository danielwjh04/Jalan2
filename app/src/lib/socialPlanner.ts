import type { PipelineStage } from '@shared/status';
import type { TripPlan } from '@shared/trip';
export { MAX_SOCIAL_SOURCES, parseSocialUrls, sourcePlatform } from '@shared/social';
import { getItinerary, getTrip, ingest } from './api';

export async function resolveSocialTrip(
  url: string,
  onStage?: (stage: PipelineStage) => void,
): Promise<TripPlan> {
  const result = await ingest(url);
  if (result.kind === 'trip') return getTrip(result.id);
  for (let attempt = 0; attempt < 180; attempt += 1) {
    const itinerary = await getItinerary(result.id);
    onStage?.(itinerary.stage);
    if (itinerary.stage === 'ERROR' || itinerary.status === 'FAILED') {
      throw new Error(itinerary.error ?? 'This post could not be read');
    }
    if (itinerary.stage === 'READY' && itinerary.tripId) return getTrip(itinerary.tripId);
    await delay(1000);
  }
  throw new Error('This post is still processing. Try again in a moment.');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
