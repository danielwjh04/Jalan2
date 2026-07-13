import { mkdtempSync, writeFileSync } from 'node:fs';
import { readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { ExtractedMedia } from '../src/adapters/extractor/types';
import type { Keyframe } from '../src/pipeline/keyframes';
import {
  findSourceCover,
  persistSourceCover,
  selectSourceCover,
  sourceCoverKey,
} from '../src/lib/sourceCovers';

function media(coverPath: string | null): ExtractedMedia {
  return {
    fixtureSlug: null,
    videoPath: '/tmp/source.mp4',
    audioPath: null,
    coverPath,
    caption: null,
  };
}

const frames: Keyframe[] = [{ path: '/tmp/frame_01.jpg', ts: 1 }];
const cleanupPaths: string[] = [];

afterEach(async () => {
  await Promise.all(cleanupPaths.map((item) => rm(item, { force: true, recursive: true })));
  cleanupPaths.length = 0;
});

describe('selectSourceCover', () => {
  it('uses the first downloaded image for a carousel post', () => {
    expect(selectSourceCover(media('/tmp/image_01.jpg'), frames)).toBe('/tmp/image_01.jpg');
  });

  it('uses an extracted frame for a video post', () => {
    expect(selectSourceCover(media(null), frames)).toBe('/tmp/frame_01.jpg');
  });

  it('returns no cover when neither source images nor frames exist', () => {
    expect(selectSourceCover(media(null), [])).toBeNull();
  });
});

describe('sourceCoverKey', () => {
  it('produces a stable URL-safe key for repeated submissions', () => {
    const url = 'https://tiktok.com/@jalan2/video/123';
    expect(sourceCoverKey(url)).toBe(sourceCoverKey(url));
    expect(sourceCoverKey(url)).toMatch(/^[a-f0-9]{40}$/);
  });

  it('persists a submitted post image under its stable source URL', async () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), 'jalan2-cover-'));
    cleanupPaths.push(tempDir);
    const inputPath = path.join(tempDir, 'image_01.jpg');
    writeFileSync(inputPath, Buffer.from('post-image'));
    const url = 'https://xhslink.com/o/source-cover-test';

    await expect(persistSourceCover(url, inputPath)).resolves.toBe(
      `/source-covers/${sourceCoverKey(url)}`,
    );
    const storedPath = findSourceCover(sourceCoverKey(url));
    expect(storedPath).not.toBeNull();
    if (!storedPath) return;
    cleanupPaths.push(storedPath);
    await expect(readFile(storedPath, 'utf8')).resolves.toBe('post-image');
  });
});
