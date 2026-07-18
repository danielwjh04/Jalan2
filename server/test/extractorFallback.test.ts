import { describe, expect, it, vi } from 'vitest';
import { withExtractorFallback } from '../src/adapters/extractor/fallback';
import type { ExtractedMedia, Extractor } from '../src/adapters/extractor/types';

const media: ExtractedMedia = {
  fixtureSlug: null,
  videoPath: '/tmp/post.mp4',
  audioPath: null,
  coverPath: null,
  coverCandidates: [],
  caption: 'Ipoh food guide',
};

describe('withExtractorFallback', () => {
  it('uses the cloud extractor when the local sidecar is unavailable', async () => {
    const primary: Extractor = {
      name: 'xhs-downloader',
      extract: vi.fn(async () => { throw new Error('connect ECONNREFUSED 127.0.0.1:5556'); }),
    };
    const fallback: Extractor = {
      name: 'tikhub',
      extract: vi.fn(async () => media),
    };

    await expect(withExtractorFallback(primary, fallback).extract('https://xhslink.com/o/new'))
      .resolves.toBe(media);
    expect(fallback.extract).toHaveBeenCalledOnce();
  });

  it('does not call the cloud fallback when Docker succeeds', async () => {
    const primary: Extractor = { name: 'xhs-downloader', extract: vi.fn(async () => media) };
    const fallback: Extractor = { name: 'tikhub', extract: vi.fn(async () => media) };

    await withExtractorFallback(primary, fallback).extract('https://xhslink.com/o/new');
    expect(fallback.extract).not.toHaveBeenCalled();
  });
});
