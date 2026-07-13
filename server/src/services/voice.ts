import { existsSync } from "node:fs";
import path from "node:path";
import type { Config } from "../config";
import type { TextToSpeech, TtsRequest } from "../adapters/tts/types";
import { resolveFixtureSlug } from "../lib/fixtures";
import { voiceCacheDir, voiceFixturesRoot } from "../lib/paths";
import { hasCachedVoice, voiceHash, writeCachedVoice } from "../lib/voiceCache";
import type { BriefLang } from "../voice/brief";
import type { PhraseClip } from "../voice/phrases";
import { normalizeVideoUrl } from "@shared/videoUrl";

export interface VoiceDeps {
  config: Config;
  tts: TextToSpeech;
}

export interface VoiceClip {
  audioUrl: string | null;
  servedFrom: "fixture" | "cache" | "live" | null;
}

const AUDIO_NAME = /^[a-z0-9][a-z0-9.-]*\.mp3$/;

// One flat name space across fixture briefs, fixture phrases, and the runtime
// cache; the route only ever serves files from these three directories.
export function findVoiceAudioFile(name: string): string | null {
  if (!AUDIO_NAME.test(name) || name.includes("..")) return null;
  const candidates = [
    path.join(voiceFixturesRoot(), "briefs", name),
    path.join(voiceFixturesRoot(), "phrases", name),
    path.join(voiceCacheDir(), name),
  ];
  return candidates.find((file) => existsSync(file)) ?? null;
}

async function resolveVoiceAudio(
  deps: VoiceDeps,
  fixtureName: string | null,
  text: string,
): Promise<VoiceClip> {
  if (fixtureName && findVoiceAudioFile(fixtureName)) {
    return { audioUrl: `/voice/audio/${fixtureName}`, servedFrom: "fixture" };
  }
  const request: TtsRequest = {
    text,
    voiceId: deps.config.ELEVENLABS_VOICE_ID,
    modelId: deps.config.ELEVENLABS_TTS_MODEL,
  };
  const hash = voiceHash(request);
  if (hasCachedVoice(hash)) {
    return { audioUrl: `/voice/audio/${hash}.mp3`, servedFrom: "cache" };
  }
  try {
    writeCachedVoice(hash, await deps.tts.synthesize(request));
    return { audioUrl: `/voice/audio/${hash}.mp3`, servedFrom: "live" };
  } catch (error) {
    console.warn(`voice synthesis unavailable: ${(error as Error).message}`);
    return { audioUrl: null, servedFrom: null };
  }
}

export function briefClip(
  deps: VoiceDeps,
  sourceUrl: string,
  text: string,
  lang: BriefLang,
): Promise<VoiceClip> {
  const normalized = normalizeVideoUrl(sourceUrl);
  const slug = normalized ? resolveFixtureSlug(normalized.url) : null;
  return resolveVoiceAudio(deps, slug ? `${slug}.${lang}.mp3` : null, text);
}

export function phraseClip(
  deps: VoiceDeps,
  phrase: PhraseClip,
): Promise<VoiceClip> {
  return resolveVoiceAudio(deps, `${phrase.id}.mp3`, phrase.textLocal);
}

export function textClip(deps: VoiceDeps, text: string): Promise<VoiceClip> {
  return resolveVoiceAudio(deps, null, text);
}
