import type { HybridMedia } from './tikhubMedia';

const IMAGE_KEYS = new Set(['image_list', 'images', 'images_list', 'imageList', 'imagesList']);
const CAPTION_KEYS = new Set(['desc', 'description', 'content', 'title']);
const XHS_IMAGE_ENDPOINT =
  'https://api.tikhub.io/api/v1/xiaohongshu/app_v2/get_image_note_detail';
const XHS_VIDEO_ENDPOINT =
  'https://api.tikhub.io/api/v1/xiaohongshu/app_v2/get_video_note_detail';

export async function fetchXhsMedia(shareText: string, token: string): Promise<HybridMedia> {
  const errors: string[] = [];
  for (const endpoint of [XHS_IMAGE_ENDPOINT, XHS_VIDEO_ENDPOINT]) {
    try {
      return parseXhsMedia(await fetchXhsDetail(endpoint, shareText, token));
    } catch (error) {
      errors.push((error as Error).message);
    }
  }
  throw new Error(`TikHub XHS extraction failed: ${errors.join('; ')}`);
}

export function parseXhsMedia(payload: unknown): HybridMedia {
  const caption = findCaption(payload);
  const videoUrl = findVideoUrls(payload)[0];
  if (videoUrl) return { kind: 'video', playUrl: videoUrl, caption };
  const imageUrls = findImageUrls(payload);
  if (imageUrls.length > 0) return { kind: 'image', imageUrls, caption };
  throw new Error('TikHub XHS response did not include usable post media');
}

async function fetchXhsDetail(endpoint: string, shareText: string, token: string): Promise<unknown> {
  const url = new URL(endpoint);
  url.searchParams.set('share_text', shareText);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  const payload = (await response.json()) as unknown;
  if (responseCode(payload) !== 200) throw new Error(responseMessage(payload));
  return payload;
}

function findImageUrls(payload: unknown): string[] {
  const values: unknown[] = [];
  walk(payload, (key, value) => {
    if (IMAGE_KEYS.has(key)) values.push(value);
  });
  return unique(values.flatMap(collectHttpUrls));
}

function findVideoUrls(payload: unknown): string[] {
  const urls: string[] = [];
  walk(payload, (key, value, path) => {
    const videoBranch = [...path, key].some((part) => /video|stream|h26[45]/i.test(part));
    if (videoBranch && typeof value === 'string' && videoScore(value) > 0) urls.push(value);
  });
  return unique(urls).sort((left, right) => videoScore(right) - videoScore(left));
}

function findCaption(payload: unknown): string | null {
  let caption: string | null = null;
  walk(payload, (key, value) => {
    if (!caption && CAPTION_KEYS.has(key) && typeof value === 'string' && value.trim()) {
      caption = value.trim();
    }
  });
  return caption;
}

function walk(
  value: unknown,
  visitor: (key: string, value: unknown, path: string[]) => void,
  path: string[] = [],
): void {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visitor, path);
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    visitor(key, child, path);
    walk(child, visitor, [...path, key]);
  }
}

function collectHttpUrls(value: unknown): string[] {
  if (typeof value === 'string') return isHttpUrl(value) ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(collectHttpUrls);
  if (!isRecord(value)) return [];
  return Object.values(value).flatMap(collectHttpUrls);
}

function videoScore(value: string): number {
  if (!isHttpUrl(value)) return 0;
  const clean = value.split('?')[0].toLowerCase();
  if (/\.(mp4|m3u8)$/.test(clean)) return 3;
  return /video|stream|master|play/.test(value.toLowerCase()) ? 2 : 0;
}

function responseCode(payload: unknown): number | null {
  return isRecord(payload) && typeof payload.code === 'number' ? payload.code : null;
}

function responseMessage(payload: unknown): string {
  if (isRecord(payload) && typeof payload.message === 'string') return payload.message;
  return 'TikHub XHS request was not successful';
}

function isHttpUrl(value: string): boolean {
  return value.startsWith('https://') || value.startsWith('http://');
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
