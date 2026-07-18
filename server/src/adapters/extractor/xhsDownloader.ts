import { z } from 'zod';
import { GoogleAuth } from 'google-auth-library';
import { normalizeVideoUrl } from '@shared/videoUrl';
import { NotConfiguredError } from '../../lib/errors';
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
  data: XhsDataSchema.nullable(),
}).passthrough();

export function createXhsDownloaderExtractor(baseUrl: string, audience?: string): Extractor {
  return {
    name: 'xhs-downloader',
    async extract(normalizedUrl) {
      const normalized = normalizeVideoUrl(normalizedUrl);
      if (normalized?.platform !== 'xhs') {
        throw new Error('The self-hosted XHS extractor accepts Xiaohongshu links only');
      }
      const media = await fetchXhsPost(baseUrl, normalized.url, audience);
      return materializeMedia(media, normalized.url);
    },
  };
}

export function parseXhsDownloaderMedia(payload: unknown): HybridMedia {
  const parsed = XhsResponseSchema.safeParse(payload);
  if (!parsed.success) throw new Error('XHS-Downloader returned an invalid response');
  const data = parsed.data.data;
  if (!data) throw new Error(parsed.data.message ?? 'XHS-Downloader could not read this public post');
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

async function fetchXhsPost(baseUrl: string, postUrl: string, audience?: string): Promise<HybridMedia> {
  let failure: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await fetchXhsPostOnce(baseUrl, postUrl, audience);
    } catch (error) {
      failure = error;
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 750));
    }
  }
  throw failure;
}

async function fetchXhsPostOnce(baseUrl: string, postUrl: string, audience?: string): Promise<HybridMedia> {
  let response: Response;
  const endpoint = `${baseUrl.replace(/\/$/, '')}/xhs/detail`;
  try {
    const identityHeaders = audience ? await cloudRunIdentityHeaders(audience) : {};
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...identityHeaders },
      body: JSON.stringify({ url: postUrl, download: false }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    throw new NotConfiguredError(
      'XHS-Downloader sidecar',
      'Start it with: docker compose -f compose.xhs.yml up -d',
    );
  }
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`XHS-Downloader failed (${response.status}): ${detail.slice(0, 200)}`);
  }
  return parseXhsDownloaderMedia(await response.json());
}

async function cloudRunIdentityHeaders(audience: string): Promise<Record<string, string>> {
  const client = await new GoogleAuth().getIdTokenClient(audience);
  const headers = await client.getRequestHeaders(audience);
  return Object.fromEntries(Object.entries(headers).map(([key, value]) => [key, String(value)]));
}

function joinCaption(title: string | undefined, description: string | undefined): string | null {
  const parts = [title, description].map((part) => part?.trim()).filter(Boolean);
  return parts.length > 0 ? parts.join('\n\n') : null;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => /^https?:\/\//.test(value)))];
}
