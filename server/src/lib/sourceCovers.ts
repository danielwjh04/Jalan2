import { createHash } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { copyFile } from 'node:fs/promises';
import path from 'node:path';
import type { ExtractedMedia } from '../adapters/extractor/types';
import type { Keyframe } from '../pipeline/keyframes';
import { sourceCoversRoot } from './paths';

const SOURCE_KEY_PATTERN = /^[a-f0-9]{40}$/;

export function selectSourceCover(
  media: ExtractedMedia,
  frames: Keyframe[],
): string | null {
  return media.coverPath ?? frames[0]?.path ?? null;
}

export async function persistSourceCover(
  sourceUrl: string,
  sourcePath: string | null,
): Promise<string | null> {
  if (!sourcePath) return null;
  const key = sourceCoverKey(sourceUrl);
  const outputPath = path.join(sourceCoversRoot(), `${key}.jpg`);
  mkdirSync(sourceCoversRoot(), { recursive: true });
  await copyFile(sourcePath, outputPath);
  return `/source-covers/${key}`;
}

export function findSourceCover(key: string): string | null {
  if (!SOURCE_KEY_PATTERN.test(key)) return null;
  const coverPath = path.join(sourceCoversRoot(), `${key}.jpg`);
  return existsSync(coverPath) ? coverPath : null;
}

export function sourceCoverKey(sourceUrl: string): string {
  return createHash('sha1').update(sourceUrl).digest('hex');
}
