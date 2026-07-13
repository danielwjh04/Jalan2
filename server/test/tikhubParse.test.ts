import { describe, expect, it, vi } from 'vitest';
import { loadConfig } from '../src/config';
import { pickExtractor } from '../src/adapters/extractor';
import { parseHybridMedia, resolveTiktokShareUrl } from '../src/adapters/extractor/tikhub';
import { parseXhsMedia } from '../src/adapters/extractor/xhsMedia';

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

  it('requires a TikHub token for non-fixture XHS URLs', async () => {
    const extractor = pickExtractor(loadConfig({ EXTRACTOR: 'tikhub', TIKHUB_TOKEN: '' }));

    await expect(
      extractor.extract('https://xhslink.com/o/not-in-the-manifest'),
    ).rejects.toThrow(/TIKHUB_TOKEN/);
  });
});

describe('parseXhsMedia', () => {
  it('reads carousel images and a caption from an XHS response', () => {
    const media = parseXhsMedia({
      code: 200,
      data: {
        note: {
          title: 'Bengoh village escape',
          image_list: [
            { url_default: 'https://sns-img.example/one.jpg' },
            { url_default: 'https://sns-img.example/two.webp' },
          ],
        },
      },
    });
    expect(media).toEqual({
      kind: 'image',
      imageUrls: [
        'https://sns-img.example/one.jpg',
        'https://sns-img.example/two.webp',
      ],
      caption: 'Bengoh village escape',
    });
  });

  it('prefers the playable video URL over a video cover', () => {
    const media = parseXhsMedia({
      code: 200,
      data: {
        note: {
          desc: 'Local river guide',
          video: {
            cover: 'https://sns-img.example/cover.jpg',
            media: { stream: { h264: [{ master_url: 'https://sns-video.example/post.mp4' }] } },
          },
        },
      },
    });
    expect(media).toEqual({
      kind: 'video',
      playUrl: 'https://sns-video.example/post.mp4',
      caption: 'Local river guide',
    });
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
