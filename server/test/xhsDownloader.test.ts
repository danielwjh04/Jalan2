import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config';
import { pickExtractor } from '../src/adapters/extractor';
import { parseXhsDownloaderMedia } from '../src/adapters/extractor/xhsDownloader';

describe('parseXhsDownloaderMedia', () => {
  it('reads an image carousel and preserves the full source caption', () => {
    const media = parseXhsDownloaderMedia({
      message: 'success',
      data: {
        作品标题: '古晋侏罗纪徒步攻略',
        作品描述: 'Bengoh Dam RM57 day trip',
        作品类型: '图文',
        下载地址: [
          'https://ci.xiaohongshu.com/one?format=jpeg',
          'https://ci.xiaohongshu.com/two?format=jpeg',
        ],
      },
    });

    expect(media).toEqual({
      kind: 'image',
      imageUrls: [
        'https://ci.xiaohongshu.com/one?format=jpeg',
        'https://ci.xiaohongshu.com/two?format=jpeg',
      ],
      caption: '古晋侏罗纪徒步攻略\n\nBengoh Dam RM57 day trip',
    });
  });

  it('reads a video post', () => {
    expect(parseXhsDownloaderMedia({
      data: {
        作品类型: '视频',
        作品描述: 'Local guide introduction',
        下载地址: 'https://sns-video.xhscdn.com/post.mp4',
      },
    })).toEqual({
      kind: 'video',
      playUrl: 'https://sns-video.xhscdn.com/post.mp4',
      caption: 'Local guide introduction',
    });
  });

  it('rejects responses without usable media', () => {
    expect(() => parseXhsDownloaderMedia({ data: {} })).toThrow(/invalid response/);
  });
});

describe('xhs-downloader extractor selection', () => {
  it('keeps fixture fallback for curated demo links', async () => {
    const extractor = pickExtractor(loadConfig({ EXTRACTOR: 'xhs-downloader' }));
    const media = await extractor.extract('https://xhslink.com/o/9JcR3bXBDL4');

    expect(extractor.name).toBe('xhs-downloader');
    expect(media.fixtureSlug).toBe('kuching-cafes-03');
  });

  it('rejects non-XHS links before calling the sidecar', async () => {
    const extractor = pickExtractor(loadConfig({ EXTRACTOR: 'xhs-downloader' }));
    await expect(extractor.extract('https://tiktok.com/@jalan2/video/123')).rejects.toThrow(
      /Xiaohongshu links only/,
    );
  });
});
