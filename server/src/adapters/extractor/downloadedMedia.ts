import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { downloadsRoot } from '../../lib/paths';
import { imageToJpeg, imagesToSlideshow } from '../../pipeline/keyframes';
import type { HybridMedia } from './tikhubMedia';
import type { ExtractedMedia } from './types';

export async function materializeMedia(
  media: HybridMedia,
  sourceUrl: string,
): Promise<ExtractedMedia> {
  const outDir = downloadDir(sourceUrl);
  mkdirSync(outDir, { recursive: true });
  if (media.kind === 'video') return materializeVideo(media, outDir);
  const imagePaths = await downloadImages(media.imageUrls, outDir);
  const videoPath = path.join(outDir, 'video.mp4');
  await imagesToSlideshow(imagePaths, videoPath);
  return {
    fixtureSlug: null,
    videoPath,
    audioPath: null,
    coverPath: imagePaths[0] ?? null,
    coverCandidates: imagePaths,
    caption: media.caption,
  };
}

export function downloadDir(sourceUrl: string): string {
  const key = createHash('sha1').update(sourceUrl).digest('hex');
  return path.join(downloadsRoot(), key);
}

async function materializeVideo(
  media: Extract<HybridMedia, { kind: 'video' }>,
  outDir: string,
): Promise<ExtractedMedia> {
  const videoPath = path.join(outDir, 'video.mp4');
  await downloadFile(media.playUrl, videoPath);
  return {
    fixtureSlug: null,
    videoPath,
    audioPath: null,
    coverPath: null,
    coverCandidates: [],
    caption: media.caption,
  };
}

async function downloadImages(urls: string[], outDir: string): Promise<string[]> {
  const paths: string[] = [];
  for (const [index, url] of urls.entries()) {
    const imagePath = path.join(outDir, `image_${String(index + 1).padStart(2, '0')}.jpg`);
    const sourcePath = sourceImagePath(url, outDir, index + 1, imagePath);
    await downloadFile(url, sourcePath);
    if (sourcePath !== imagePath) await imageToJpeg(sourcePath, imagePath);
    paths.push(imagePath);
  }
  return paths;
}

function sourceImagePath(url: string, outDir: string, index: number, jpegPath: string): string {
  const ext = sourceExtension(url);
  if (ext === '.jpg' || ext === '.jpeg') return jpegPath;
  return path.join(outDir, `image_${String(index).padStart(2, '0')}${ext}`);
}

function sourceExtension(url: string): string {
  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.heic'].includes(ext)) return ext;
  } catch {
    return '.bin';
  }
  return '.bin';
}

async function downloadFile(url: string, outPath: string): Promise<void> {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) {
    throw new Error(`Source media download failed: ${response.status} ${response.statusText}`);
  }
  await writeFile(outPath, Buffer.from(await response.arrayBuffer()));
}
