import { beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeVideoUrl } from '@shared/videoUrl';
import { createAutoExtractor } from '../src/adapters/extractor/auto';
import { pickExtractor } from '../src/adapters/extractor';
import type { ExtractedMedia } from '../src/adapters/extractor/types';
import { loadConfig } from '../src/config';

const media: ExtractedMedia = {
  fixtureSlug: null,
  videoPath: null,
  audioPath: null,
  coverPath: null,
  coverCandidates: [],
  caption: null,
};

const tiktok = { name: 'tikhub' as const, extract: vi.fn(async () => media) };
const xhs = { name: 'xhs-downloader' as const, extract: vi.fn(async () => media) };
const extractor = createAutoExtractor({ tiktok, xhs });

beforeEach(() => {
  tiktok.extract.mockClear();
  xhs.extract.mockClear();
});

describe('createAutoExtractor', () => {
  it('routes TikTok links to the TikTok delegate', async () => {
    await extractor.extract('https://tiktok.com/@wankatravel/video/7568057349664017684');
    await extractor.extract('https://vt.tiktok.com/ZSabc123');
    expect(tiktok.extract).toHaveBeenCalledTimes(2);
    expect(xhs.extract).not.toHaveBeenCalled();
  });

  it('routes Xiaohongshu links to the XHS delegate', async () => {
    await extractor.extract('https://xiaohongshu.com/discovery/item/abc123');
    await extractor.extract('https://xhslink.com/o/abc123');
    expect(xhs.extract).toHaveBeenCalledTimes(2);
    expect(tiktok.extract).not.toHaveBeenCalled();
  });

  it('rejects unsupported platforms and names the supported ones', async () => {
    await expect(extractor.extract('https://instagram.com/reel/abc123')).rejects.toThrow(
      /TikTok.*Xiaohongshu/,
    );
    expect(tiktok.extract).not.toHaveBeenCalled();
    expect(xhs.extract).not.toHaveBeenCalled();
  });
});

describe('pickExtractor with EXTRACTOR=auto', () => {
  it('still serves manifest URLs from the fixture cache', async () => {
    const picked = pickExtractor(loadConfig({ EXTRACTOR: 'auto' }));
    const normalized = normalizeVideoUrl('https://vt.tiktok.com/ZSCt5cY1k/');
    const result = await picked.extract(normalized?.url ?? '');
    expect(result.fixtureSlug).toBe('kuching-city-guide-01');
  });
});
