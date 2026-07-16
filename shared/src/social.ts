import { normalizeVideoUrl } from './videoUrl';

export const MAX_SOCIAL_SOURCES = 8;

export function parseSocialUrls(raw: string): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const value of raw.split(/[\s,]+/)) {
    const normalized = normalizeVideoUrl(value);
    if (!normalized || seen.has(normalized.url)) continue;
    seen.add(normalized.url);
    urls.push(normalized.url);
    if (urls.length === MAX_SOCIAL_SOURCES) break;
  }
  return urls;
}

export function sourcePlatform(url: string): 'XHS' | 'TikTok' {
  return /tiktok\.com/i.test(url) ? 'TikTok' : 'XHS';
}
