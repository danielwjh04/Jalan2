import { describe, expect, it, vi } from 'vitest';
import { loadConfig } from '../src/config';
import { pickExtractor } from '../src/adapters/extractor';
import { parseHybridMedia, resolveTiktokShareUrl } from '../src/adapters/extractor/tikhub';

describe('parseHybridMedia', () => {
  it('reads a video post with a string HQ URL', () => {
    const media = parseHybridMedia({
      code: 200,
      data: {
        type: 'video',
        desc: 'Kuching caption',
        video_data: { nwm_video_url_HQ: 'https://media.example/video.mp4' },
      },
    });

    expect(media).toEqual({
      kind: 'video',
      playUrl: 'https://media.example/video.mp4',
      caption: 'Kuching caption',
    });
  });

  it('reads a video post with only url_list form', () => {
    const media = parseHybridMedia({
      code: 200,
      data: {
        type: 'video',
        video_data: { nwm_video_url: { url_list: ['https://media.example/list.mp4'] } },
      },
    });

    expect(media).toEqual({
      kind: 'video',
      playUrl: 'https://media.example/list.mp4',
      caption: null,
    });
  });

  it('reads an image post with string and url_list images', () => {
    const media = parseHybridMedia({
      code: 200,
      data: {
        type: 'image',
        desc: 'Hidden Kuching spots',
        image_data: {
          no_watermark_image_list: [
            'https://media.example/one.jpg',
            { url_list: ['https://media.example/two.jpg'] },
          ],
        },
      },
    });

    expect(media).toEqual({
      kind: 'image',
      imageUrls: ['https://media.example/one.jpg', 'https://media.example/two.jpg'],
      caption: 'Hidden Kuching spots',
    });
  });

  it('uses watermarked image URLs when no-watermark URLs are HEIC-only', () => {
    const media = parseHybridMedia({
      code: 200,
      data: {
        type: 'image',
        image_data: {
          no_watermark_image_list: ['https://media.example/one.heic'],
          watermark_image_list: [{ url_list: ['https://media.example/one.webp'] }],
        },
      },
    });

    expect(media).toEqual({
      kind: 'image',
      imageUrls: ['https://media.example/one.webp'],
      caption: null,
    });
  });

  it('throws on unusable payloads', () => {
    expect(() => parseHybridMedia({ nope: true })).toThrow(/TikHub/);
  });
});

describe('pickExtractor tikhub mode', () => {
  it('uses fixture fallback for manifest XHS URLs', async () => {
    const extractor = pickExtractor(loadConfig({ EXTRACTOR: 'tikhub', TIKHUB_TOKEN: 'fake' }));

    const media = await extractor.extract('https://xhslink.com/o/9JcR3bXBDL4');

    expect(media.fixtureSlug).toBe('kuching-cafes-03');
  });

  it('throws the paid balance message for non-fixture XHS URLs', async () => {
    const extractor = pickExtractor(loadConfig({ EXTRACTOR: 'tikhub', TIKHUB_TOKEN: 'fake' }));

    await expect(
      extractor.extract('https://xhslink.com/o/not-in-the-manifest'),
    ).rejects.toThrow(/paid balance/);
  });
});

describe('resolveTiktokShareUrl', () => {
  it('follows TikTok share redirects before TikHub lookup', async () => {
    const fetcher = vi.fn(async () => ({
      url: 'https://www.tiktok.com/@jonlzx/video/7359768031976754439?_r=1',
      body: { cancel: vi.fn() },
    }));

    await expect(resolveTiktokShareUrl('https://vt.tiktok.com/ZSCtb9qPy', fetcher)).resolves.toBe(
      'https://tiktok.com/@jonlzx/video/7359768031976754439',
    );
  });
});
