import { normalizeVideoUrl } from '@shared/videoUrl';
import type { Extractor } from './types';

export interface AutoExtractorDelegates {
  tiktok: Extractor;
  xhs: Extractor;
}

// Routes each link to the extractor for its platform so a single
// EXTRACTOR=auto setting serves both TikTok and Xiaohongshu live.
export function createAutoExtractor(delegates: AutoExtractorDelegates): Extractor {
  return {
    name: 'auto',
    async extract(normalizedUrl) {
      const normalized = normalizeVideoUrl(normalizedUrl);
      if (normalized?.platform === 'tiktok') return delegates.tiktok.extract(normalizedUrl);
      if (normalized?.platform === 'xhs') return delegates.xhs.extract(normalizedUrl);
      throw new Error(
        'No live extractor for this link. Supported platforms: TikTok (tiktok.com, vt.tiktok.com, vm.tiktok.com) and Xiaohongshu (xiaohongshu.com, xhslink.com).',
      );
    },
  };
}
