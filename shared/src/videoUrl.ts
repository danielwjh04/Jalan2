export type VideoPlatform = 'tiktok' | 'xhs' | 'unknown';

export interface NormalizedVideoUrl {
  url: string;
  platform: VideoPlatform;
}

const URL_PATTERN = /https?:\/\/[^\s"'<>]+/i;

// Accepts raw share text (XHS share sheets wrap the link in emoji and prose),
// pulls the first URL, and canonicalizes it so the same video always maps to
// the same fixture-manifest key regardless of tracking params.
export function normalizeVideoUrl(raw: string): NormalizedVideoUrl | null {
  const match = raw.match(URL_PATTERN);
  if (!match) return null;
  const candidate = match[0].replace(/[.,!?;:)\]]+$/, '');
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const path = parsed.pathname.replace(/\/+$/, '');
  return { url: `https://${host}${path}`, platform: platformOf(host) };
}

function platformOf(host: string): VideoPlatform {
  if (host === 'vm.tiktok.com' || host === 'tiktok.com' || host.endsWith('.tiktok.com')) {
    return 'tiktok';
  }
  if (host === 'xhslink.com' || host === 'xiaohongshu.com' || host.endsWith('.xiaohongshu.com')) {
    return 'xhs';
  }
  return 'unknown';
}
