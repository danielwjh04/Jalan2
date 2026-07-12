import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { TtsRequest } from '../adapters/tts/types';
import { voiceCacheDir } from './paths';

export function voiceHash(request: TtsRequest): string {
  return createHash('sha256')
    .update(`${request.voiceId}|${request.modelId}|${request.text}`)
    .digest('hex')
    .slice(0, 16);
}

export function cachedVoicePath(hash: string): string {
  return path.join(voiceCacheDir(), `${hash}.mp3`);
}

export function hasCachedVoice(hash: string): boolean {
  return existsSync(cachedVoicePath(hash));
}

export function readCachedVoice(hash: string): Buffer | null {
  return hasCachedVoice(hash) ? readFileSync(cachedVoicePath(hash)) : null;
}

export function writeCachedVoice(hash: string, audio: Buffer): void {
  mkdirSync(voiceCacheDir(), { recursive: true });
  writeFileSync(cachedVoicePath(hash), audio);
}
