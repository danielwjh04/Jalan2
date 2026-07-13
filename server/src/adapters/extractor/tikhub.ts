import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { normalizeVideoUrl } from '@shared/videoUrl';
import { NotConfiguredError } from '../../lib/errors';
import { downloadsRoot } from '../../lib/paths';
import { imageToJpeg, imagesToSlideshow } from '../../pipeline/keyframes';
import type { ExtractedMedia, Extractor } from './types';
import { parseHybridMedia, type HybridMedia } from './tikhubMedia';
import { fetchXhsMedia } from './xhsMedia';
import { downloadTikTokWithYtDlp } from './ytdlp';

const HYBRID_ENDPOINT = 'https://api.tikhub.io/api/v1/hybrid/video_data';

const ErrorMessageSchema = z
  .object({ detail: z.object({ message: z.string() }).passthrough() })
  .passthrough();

interface RedirectResponse {
  readonly url: string;
  readonly body: { cancel(): Promise<void> | void } | null;
}

type RedirectFetch = (url: string) => Promise<RedirectResponse>;

export { parseHybridMedia } from './tikhubMedia';

export function createTikhubExtractor(token: string | undefined): Extractor {
  return {
    name: 'tikhub',
    async extract(normalizedUrl) {
      const lookupUrl = await resolveTiktokShareUrl(normalizedUrl);
      const normalized = normalizeVideoUrl(lookupUrl);
      if (!token) {
        throw new NotConfiguredError('TikHub extractor', 'Set TIKHUB_TOKEN or EXTRACTOR=fixture.');
      }
      const outDir = path.join(downloadsRoot(), hashUrl(lookupUrl));
      mkdirSync(outDir, { recursive: true });
      const media = normalized?.platform === 'xhs'
        ? await fetchXhsMedia(lookupUrl, token)
        : await extractHybridOrFallback(lookupUrl, token, outDir, normalized?.platform);
      if ('videoPath' in media) return media;
      if (media.kind === 'video') {
        const videoPath = path.join(outDir, 'video.mp4');
        await downloadFile(media.playUrl, videoPath);
        return {
          fixtureSlug: null,
          videoPath,
          audioPath: null,
          coverPath: null,
          caption: media.caption,
        };
      }
      const imagePaths = await downloadImages(media.imageUrls, outDir);
      const videoPath = path.join(outDir, 'video.mp4');
      await imagesToSlideshow(imagePaths, videoPath);
      return {
        fixtureSlug: null,
        videoPath,
        audioPath: null,
        coverPath: imagePaths[0] ?? null,
        caption: media.caption,
      };
    },
  };
}

async function extractHybridOrFallback(
  lookupUrl: string,
  token: string,
  outDir: string,
  platform: string | undefined,
): Promise<HybridMedia | ExtractedMedia> {
  try {
    return parseHybridMedia(await fetchHybrid(lookupUrl, token));
  } catch (error) {
    if (platform === 'tiktok') return downloadTikTokWithYtDlp(lookupUrl, outDir);
    throw error;
  }
}

export async function resolveTiktokShareUrl(
  normalizedUrl: string,
  fetcher: RedirectFetch = defaultRedirectFetch,
): Promise<string> {
  const normalized = normalizeVideoUrl(normalizedUrl);
  if (!normalized || !isTikTokShortHost(normalized.url)) return normalizedUrl;
  try {
    const response = await fetcher(normalizedUrl);
    await response.body?.cancel();
    const redirected = normalizeVideoUrl(response.url);
    return redirected?.platform === 'tiktok' ? redirected.url : normalizedUrl;
  } catch {
    return normalizedUrl;
  }
}

async function defaultRedirectFetch(url: string): Promise<RedirectResponse> {
  return fetch(url, { redirect: 'follow' });
}

function isTikTokShortHost(normalizedUrl: string): boolean {
  const host = new URL(normalizedUrl).hostname;
  return host === 'vt.tiktok.com' || host === 'vm.tiktok.com';
}

async function fetchHybrid(normalizedUrl: string, token: string): Promise<unknown> {
  const url = new URL(HYBRID_ENDPOINT);
  url.searchParams.set('url', normalizedUrl);
  url.searchParams.set('minimal', 'true');
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`TikHub request failed: ${await safeErrorMessage(response)}`);
  return response.json();
}

async function safeErrorMessage(response: Response): Promise<string> {
  try {
    const parsed = ErrorMessageSchema.safeParse(await response.json());
    if (parsed.success) return parsed.data.detail.message;
  } catch {
    return response.statusText || `HTTP ${response.status}`;
  }
  return response.statusText || `HTTP ${response.status}`;
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
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TikHub media download failed: ${response.status} ${response.statusText}`);
  }
  await writeFile(outPath, Buffer.from(await response.arrayBuffer()));
}

function hashUrl(url: string): string {
  return createHash('sha1').update(url).digest('hex');
}
