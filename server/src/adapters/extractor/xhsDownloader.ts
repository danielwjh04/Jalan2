import { z } from 'zod';
import { normalizeVideoUrl } from '@shared/videoUrl';
import { materializeMedia } from './downloadedMedia';
import type { HybridMedia } from './tikhubMedia';
import type { Extractor } from './types';

const XhsDataSchema = z.object({
  '作品标题': z.string().optional(),
  '作品描述': z.string().optional(),
  '作品类型': z.string().optional(),
  '下载地址': z.union([z.string(), z.array(z.string())]),
}).passthrough();

const XhsResponseSchema = z.object({
  message: z.string().optional(),
  data: XhsDataSchema,
}).passthrough();

export function createXhsDownloaderExtractor(baseUrl: string): Extractor {
  return {
    name: 'xhs-downloader',
    async extract(normalizedUrl) {
      const normalized = normalizeVideoUrl(normalizedUrl);
      if (normalized?.platform !== 'xhs') {
        throw new Error('The self-hosted XHS extractor accepts Xiaohongshu links only');
      }
      const media = await fetchXhsPost(baseUrl, normalized.url);
      return materializeMedia(media, normalized.url);
    },
  };
}

export function parseXhsDownloaderMedia(payload: unknown): HybridMedia {
  const parsed = XhsResponseSchema.safeParse(payload);
  if (!parsed.success) throw new Error('XHS-Downloader returned an invalid response');
  const data = parsed.data.data;
  const urls = unique(typeof data['下载地址'] === 'string'
    ? [data['下载地址']]
    : data['下载地址']);
  if (urls.length === 0) throw new Error('XHS-Downloader returned no source media');
  const caption = joinCaption(data['作品标题'], data['作品描述']);
  if (data['作品类型']?.includes('视频')) {
    return { kind: 'video', playUrl: urls[0], caption };
  }
  return { kind: 'image', imageUrls: urls, caption };
}

async function fetchXhsPost(baseUrl: string, postUrl: string): Promise<HybridMedia> {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/xhs/detail`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: postUrl, download: false }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`XHS-Downloader failed (${response.status}): ${detail.slice(0, 200)}`);
  }
  return parseXhsDownloaderMedia(await response.json());
}

function joinCaption(title: string | undefined, description: string | undefined): string | null {
  const parts = [title, description].map((part) => part?.trim()).filter(Boolean);
  return parts.length > 0 ? parts.join('\n\n') : null;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => /^https?:\/\//.test(value)))];
}
