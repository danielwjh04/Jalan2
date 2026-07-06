import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { normalizeVideoUrl } from '@shared/videoUrl';
import { NotConfiguredError } from '../../lib/errors';
import { downloadsRoot } from '../../lib/paths';
import { imageToJpeg, imagesToSlideshow } from '../../pipeline/keyframes';
import type { Extractor } from './types';

const HYBRID_ENDPOINT = 'https://api.tikhub.io/api/v1/hybrid/video_data';

const UrlListSchema = z.object({ url_list: z.array(z.string()) }).passthrough();
const MediaUrlSchema = z.union([z.string(), UrlListSchema]);
const ImageDataSchema = z
  .object({
    no_watermark_image_list: z.array(MediaUrlSchema).optional(),
    watermark_image_list: z.array(MediaUrlSchema).optional(),
  })
  .passthrough();
const HybridSchema = z
  .object({
    code: z.number(),
    data: z
      .object({
        type: z.string(),
        desc: z.string().nullable().optional(),
        video_data: z
          .object({
            nwm_video_url_HQ: z.string().optional(),
            nwm_video_url: MediaUrlSchema.optional(),
          })
          .passthrough()
          .optional(),
        image_data: ImageDataSchema.optional(),
      })
      .passthrough(),
  })
  .passthrough();

const ErrorMessageSchema = z
  .object({ detail: z.object({ message: z.string() }).passthrough() })
  .passthrough();

export type HybridMedia =
  | { kind: 'video'; playUrl: string; caption: string | null }
  | { kind: 'image'; imageUrls: string[]; caption: string | null };

export function parseHybridMedia(payload: unknown): HybridMedia {
  const parsed = HybridSchema.safeParse(payload);
  if (!parsed.success) throw new Error('TikHub response did not match the hybrid schema');
  const caption = parsed.data.data.desc ?? null;
  if (parsed.data.data.type === 'video') {
    const video = parsed.data.data.video_data;
    const playUrl = video?.nwm_video_url_HQ ?? firstUrl(video?.nwm_video_url);
    if (playUrl) return { kind: 'video', playUrl, caption };
  }
  if (parsed.data.data.type === 'image') {
    const imageUrls = usableImageUrls(parsed.data.data.image_data);
    if (imageUrls.length > 0) return { kind: 'image', imageUrls, caption };
  }
  throw new Error('TikHub response did not include usable media');
}

export function createTikhubExtractor(token: string | undefined): Extractor {
  return {
    name: 'tikhub',
    async extract(normalizedUrl) {
      const normalized = normalizeVideoUrl(normalizedUrl);
      if (normalized?.platform === 'xhs') {
        throw new Error(
          'TikHub XHS endpoints require a paid balance (free credit is not accepted). Top up at user.tikhub.io or use a manifest fixture for XHS demos.',
        );
      }
      if (!token) {
        throw new NotConfiguredError('TikHub extractor', 'Set TIKHUB_TOKEN or EXTRACTOR=fixture.');
      }
      const media = parseHybridMedia(await fetchHybrid(normalizedUrl, token));
      const outDir = path.join(downloadsRoot(), hashUrl(normalizedUrl));
      mkdirSync(outDir, { recursive: true });
      if (media.kind === 'video') {
        const videoPath = path.join(outDir, 'video.mp4');
        await downloadFile(media.playUrl, videoPath);
        return { fixtureSlug: null, videoPath, audioPath: null, caption: media.caption };
      }
      const imagePaths = await downloadImages(media.imageUrls, outDir);
      const videoPath = path.join(outDir, 'video.mp4');
      await imagesToSlideshow(imagePaths, videoPath);
      return { fixtureSlug: null, videoPath, audioPath: null, caption: media.caption };
    },
  };
}

function firstUrl(mediaUrl: z.infer<typeof MediaUrlSchema> | undefined): string | null {
  if (!mediaUrl) return null;
  if (typeof mediaUrl === 'string') return mediaUrl;
  return mediaUrl.url_list[0] ?? null;
}

function usableImageUrls(imageData: z.infer<typeof ImageDataSchema> | undefined): string[] {
  const noWatermark = collectImageUrls(imageData?.no_watermark_image_list);
  const processable = noWatermark.filter((url) => !isLikelyHeic(url));
  if (processable.length > 0) return processable;
  const watermarked = collectImageUrls(imageData?.watermark_image_list);
  return watermarked.length > 0 ? watermarked : noWatermark;
}

function collectImageUrls(items: z.infer<typeof MediaUrlSchema>[] | undefined): string[] {
  return (items ?? []).map(firstUrl).filter((url): url is string => Boolean(url));
}

function isLikelyHeic(url: string): boolean {
  return url.split('?')[0].toLowerCase().endsWith('.heic');
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
