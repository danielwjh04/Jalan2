import type OpenAI from 'openai';
import type { BookingJson } from '@shared/booking';
import type { Config } from '../config';
import type { Extractor } from '../adapters/extractor/types';
import type { SpeechToText, Transcript } from '../adapters/stt/types';
import { NotConfiguredError } from '../lib/errors';
import { loadCachedBooking, resolveFixtureSlug } from '../lib/fixtures';
import { runWorkDir } from '../lib/paths';
import { recordDemand } from '../store/directory';
import { setBooking, setItineraryError, setStage } from '../store/itineraries';
import { extractAudio, extractKeyframes } from './keyframes';
import { fuse } from './fusion';
import { readFrames } from './vision';

export interface PipelineDeps {
  config: Config;
  extractor: Extractor;
  stt: SpeechToText | null;
  openai: OpenAI | null;
}

const KEYFRAME_COUNT = 6;

interface PipelineResult {
  booking: BookingJson;
  servedFrom: 'live' | 'cache';
}

const memo = new Map<string, PipelineResult>();

export async function runPipeline(deps: PipelineDeps, id: string, url: string): Promise<void> {
  try {
    const result = memo.get(url) ?? (await produceBooking(deps, id, url));
    memo.set(url, result);
    setBooking(id, result.booking, result.servedFrom);
    setStage(id, 'READY');
    recordDemand(result.booking);
  } catch (error) {
    setItineraryError(id, error instanceof Error ? error.message : String(error));
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
    return { booking: cached, servedFrom: 'cache' };
  }
  try {
    return { booking: await runLive(deps, id, url), servedFrom: 'live' };
  } catch (error) {
    if (deps.config.PIPELINE_MODE === 'live') throw error;
    const cached = loadCachedForUrl(url);
    if (!cached) throw error;
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[pipeline] live run failed (${reason}); serving cached booking`);
    return { booking: cached, servedFrom: 'cache' };
  }
}

async function runLive(deps: PipelineDeps, id: string, url: string): Promise<BookingJson> {
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
  const audioPath = media.audioPath ?? (await extractAudio(media.videoPath, workDir));
  setStage(id, 'TRANSCRIBING');
  const transcript: Transcript = stt
    ? await stt.transcribe(audioPath)
    : { text: '', segments: [] };
  setStage(id, 'READING_FRAMES');
  const vision = await readFrames(openai, config.OPENAI_VISION_MODEL, frames);
  setStage(id, 'FUSING');
  return fuse(openai, config.OPENAI_FUSION_MODEL, {
    caption: media.caption,
    transcript,
    vision,
  });
}

function loadCachedForUrl(url: string): BookingJson | null {
  const slug = resolveFixtureSlug(url);
  return slug ? loadCachedBooking(slug) : null;
}
