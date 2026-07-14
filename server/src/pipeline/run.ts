import type OpenAI from 'openai';
import type { BookingJson } from '@shared/booking';
import type { Config } from '../config';
import type { Extractor } from '../adapters/extractor/types';
import type { Retrieval } from '../adapters/retrieval/types';
import type { PlacesProvider } from '../adapters/places/types';
import type { SpeechToText, Transcript } from '../adapters/stt/types';
import { NotConfiguredError } from '../lib/errors';
import { loadCachedBooking, resolveFixtureSlug } from '../lib/fixtures';
import { runWorkDir } from '../lib/paths';
import { persistSourceCover, selectSourceCover } from '../lib/sourceCovers';
import { recordDemand } from '../store/directory';
import { setBooking, setCoverUrl, setItineraryError, setStage, setTripId } from '../store/itineraries';
import { saveTrip } from '../store/trips';
import { extractAudio, extractKeyframes } from './keyframes';
import { chooseAestheticCover } from './cover';
import { fuse } from './fusion';
import { enrichTrust } from './trust';
import { createDynamicTrip } from './trip';
import { readFrames } from './vision';

export interface PipelineDeps {
  config: Config;
  extractor: Extractor;
  stt: SpeechToText | null;
  openai: OpenAI | null;
  retrieval: Retrieval;
  places: PlacesProvider;
}

const KEYFRAME_COUNT = 6;

interface PipelineResult {
  booking: BookingJson;
  servedFrom: 'live' | 'cache';
  coverUrl: string | null;
}

const memo = new Map<string, PipelineResult>();

export async function runPipeline(deps: PipelineDeps, id: string, url: string): Promise<void> {
  try {
    let result = memo.get(url);
    if (!result) {
      result = await produceBooking(deps, id, url);
      result = { ...result, booking: await tryEnrichTrust(deps.retrieval, result.booking) };
    }
    memo.set(url, result);
    if (result.coverUrl) setCoverUrl(id, result.coverUrl);
    setBooking(id, result.booking, result.servedFrom);
    setStage(id, 'READY');
    recordDemand(result.booking);
  } catch (error) {
    setItineraryError(id, error instanceof Error ? error.message : String(error));
  }
}

// Trust is best-effort enrichment; a retrieval failure must never fail the
// booking itself.
async function tryEnrichTrust(retrieval: Retrieval, booking: BookingJson): Promise<BookingJson> {
  try {
    return await enrichTrust(retrieval, booking);
  } catch (error) {
    console.warn(`[trust] enrichment failed: ${(error as Error).message}`);
    return booking;
  }
}

export function resetPipelineMemo(): void {
  memo.clear();
}

async function produceBooking(
  deps: PipelineDeps,
  id: string,
  url: string,
): Promise<PipelineResult> {
  if (deps.config.PIPELINE_MODE === 'cached') {
    const cached = loadCachedForUrl(url);
    if (!cached) throw new Error(`No cached booking for ${url}`);
    return { booking: cached, servedFrom: 'cache', coverUrl: null };
  }
  try {
    const live = await runLive(deps, id, url);
    return { ...live, servedFrom: 'live' };
  } catch (error) {
    if (deps.config.PIPELINE_MODE === 'live') throw error;
    const cached = loadCachedForUrl(url);
    if (!cached) throw error;
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[pipeline] live run failed (${reason}); serving cached booking`);
    return { booking: cached, servedFrom: 'cache', coverUrl: null };
  }
}

async function runLive(
  deps: PipelineDeps,
  id: string,
  url: string,
): Promise<{ booking: BookingJson; coverUrl: string | null }> {
  const { config, extractor, stt, openai } = deps;
  if (!openai) {
    throw new NotConfiguredError('OpenAI', 'Set OPENAI_API_KEY or use PIPELINE_MODE=cached.');
  }
  setStage(id, 'EXTRACTING');
  const media = await extractor.extract(url);
  if (!media.videoPath) {
    throw new Error(
      `No video file for ${media.fixtureSlug ?? url}. Add video.mp4 to the fixture or use PIPELINE_MODE=cached.`,
    );
  }
  const workDir = runWorkDir(id);
  const frames = await extractKeyframes(media.videoPath, workDir, KEYFRAME_COUNT);
  const coverCandidates = media.coverCandidates.length > 0
    ? media.coverCandidates
    : media.coverPath
      ? []
      : frames.map((frame) => frame.path);
  const aestheticCover = await chooseAestheticCover(
    openai,
    config.OPENAI_VISION_MODEL,
    coverCandidates,
  );
  const coverUrl = await persistSourceCover(
    url,
    aestheticCover ?? selectSourceCover(media, frames),
  );
  if (coverUrl) setCoverUrl(id, coverUrl);
  const audioPath = media.audioPath ?? (await tryExtractAudio(media.videoPath, workDir));
  setStage(id, 'TRANSCRIBING');
  const transcript: Transcript = stt && audioPath
    ? await stt.transcribe(audioPath)
    : { text: '', segments: [] };
  setStage(id, 'READING_FRAMES');
  const vision = await readFrames(openai, config.OPENAI_VISION_MODEL, frames);
  setStage(id, 'FUSING');
  const booking = await fuse(openai, config.OPENAI_FUSION_MODEL, {
    caption: media.caption,
    transcript,
    vision,
  });
  const trip = await createDynamicTrip(id, url, booking, vision, deps.places);
  saveTrip({ ...trip, cover_url: coverUrl });
  setTripId(id, trip.id);
  return { booking, coverUrl };
}

async function tryExtractAudio(videoPath: string, workDir: string): Promise<string | null> {
  try {
    return await extractAudio(videoPath, workDir);
  } catch (error) {
    console.warn(`[audio] source has no usable audio: ${(error as Error).message}`);
    return null;
  }
}

function loadCachedForUrl(url: string): BookingJson | null {
  const slug = resolveFixtureSlug(url);
  return slug ? loadCachedBooking(slug) : null;
}
