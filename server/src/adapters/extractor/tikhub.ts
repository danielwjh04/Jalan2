import { z } from 'zod';
import { normalizeVideoUrl } from '@shared/videoUrl';
import { NotConfiguredError } from '../../lib/errors';
import { downloadDir, materializeMedia } from './downloadedMedia';
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
      const outDir = downloadDir(lookupUrl);
      const media = normalized?.platform === 'xhs'
        ? await fetchXhsMedia(lookupUrl, token)
        : await extractHybridOrFallback(lookupUrl, token, outDir, normalized?.platform);
      if ('videoPath' in media) return media;
      return materializeMedia(media, lookupUrl);
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
