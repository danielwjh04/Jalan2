import type { PipelineStage } from '@shared/status';
import { MAX_SOCIAL_SOURCES, parseSocialUrls, sourcePlatform } from '@shared/social';
import { isTransportStop, type TripPlan } from '@shared/trip';
import { createSocialCollection, getItinerary, getTrip, ingest } from './api';

export { MAX_SOCIAL_SOURCES, parseSocialUrls, sourcePlatform };

export interface SocialLinkQueueResult {
  urls: string[];
  error: string | null;
}

export interface SocialGuideResult {
  trip: TripPlan;
  bookingId?: string;
}

type StageListener = (stage: PipelineStage) => void;

const STAGE_ORDER: PipelineStage[] = [
  'QUEUED',
  'EXTRACTING',
  'TRANSCRIBING',
  'READING_FRAMES',
  'FUSING',
  'READY',
];

export function appendSocialUrl(urls: string[], raw: string): SocialLinkQueueResult {
  const parsed = parseSocialUrls(raw);
  if (parsed.length === 0) {
    return { urls, error: 'Paste a public XHS or TikTok link.' };
  }
  const next = parsed[0];
  if (urls.includes(next)) return { urls, error: 'That link is already added.' };
  if (urls.length >= MAX_SOCIAL_SOURCES) {
    return { urls, error: `You can add up to ${MAX_SOCIAL_SOURCES} links.` };
  }
  return { urls: [...urls, next], error: null };
}

export async function resolveSocialTrip(
  url: string,
  onStage?: (stage: PipelineStage) => void,
): Promise<TripPlan> {
  return (await resolveSocialSource(url, onStage)).trip;
}

async function resolveSocialSource(
  url: string,
  onStage?: (stage: PipelineStage) => void,
): Promise<SocialGuideResult> {
  const result = await ingest(url);
  if (result.kind === 'trip') {
    return { trip: await getTrip(result.id), bookingId: result.bookingId };
  }
  return waitForTrip(result.id, onStage);
}

async function waitForTrip(
  bookingId: string,
  onStage?: (stage: PipelineStage) => void,
): Promise<SocialGuideResult> {
  for (let attempt = 0; attempt < 180; attempt += 1) {
    const itinerary = await getItinerary(bookingId);
    onStage?.(itinerary.stage);
    if (itinerary.stage === 'ERROR' || itinerary.status === 'FAILED') {
      throw new Error(itinerary.error ?? 'This post could not be read');
    }
    if (itinerary.stage === 'READY' && itinerary.tripId) {
      return { trip: await getTrip(itinerary.tripId), bookingId };
    }
    await delay(1000);
  }
  throw new Error('This post is still processing. Try again in a moment.');
}

export async function generateSocialGuide(
  urls: string[],
  onStage?: StageListener,
): Promise<SocialGuideResult> {
  const sources = await resolveSources(urls, onStage);
  if (sources.length === 1) return sources[0];
  onStage?.('FUSING');
  const selections = sources.map(({ trip }) => ({
    tripId: trip.id,
    stopIds: physicalStopIds(trip),
  }));
  const trip = await createSocialCollection({ selections });
  onStage?.('READY');
  return { trip };
}

async function resolveSources(
  urls: string[],
  onStage?: StageListener,
): Promise<SocialGuideResult[]> {
  const results = new Array<SocialGuideResult>(urls.length);
  const stages: PipelineStage[] = urls.map(() => 'EXTRACTING');
  let published: PipelineStage | null = null;
  let cursor = 0;
  const publish = (): void => {
    const stage = overallStage(stages);
    if (stage === published || (stage === 'READY' && urls.length > 1)) return;
    published = stage;
    onStage?.(stage);
  };
  publish();
  async function worker(): Promise<void> {
    while (cursor < urls.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await resolveSocialSource(urls[index], (stage) => {
        stages[index] = stage;
        publish();
      });
    }
  }
  await Promise.all(Array.from({ length: Math.min(2, urls.length) }, () => worker()));
  return results;
}

function overallStage(stages: PipelineStage[]): PipelineStage {
  if (stages.includes('ERROR')) return 'ERROR';
  return stages.reduce((earliest, stage) => (
    STAGE_ORDER.indexOf(stage) < STAGE_ORDER.indexOf(earliest) ? stage : earliest
  ));
}

function physicalStopIds(trip: TripPlan): string[] {
  return trip.selected_stop_ids.filter((id) => {
    const stop = trip.stops.find((candidate) => candidate.id === id);
    return stop ? !isTransportStop(stop) : false;
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
