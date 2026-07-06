import { describe, expect, it } from 'vitest';
import { normalizeVideoUrl } from '../src/videoUrl';

describe('normalizeVideoUrl', () => {
  it('normalizes a full TikTok video URL and strips tracking params', () => {
    const result = normalizeVideoUrl(
      'https://www.tiktok.com/@kuchingdive/video/7301234567890123456?is_from_webapp=1&sender_device=pc',
    );
    expect(result).toEqual({
      url: 'https://tiktok.com/@kuchingdive/video/7301234567890123456',
      platform: 'tiktok',
    });
  });

  it('keeps vm.tiktok.com short links opaque but normalized', () => {
    const result = normalizeVideoUrl('https://vm.tiktok.com/ZSAbCdEf/');
    expect(result).toEqual({ url: 'https://vm.tiktok.com/ZSAbCdEf', platform: 'tiktok' });
  });

  it('detects xiaohongshu URLs', () => {
    const result = normalizeVideoUrl('https://www.xiaohongshu.com/explore/66a1b2c3d4?xsec_token=AB');
    expect(result).toEqual({
      url: 'https://xiaohongshu.com/explore/66a1b2c3d4',
      platform: 'xhs',
    });
  });

  it('extracts the link out of XHS share-sheet prose', () => {
    const shareText = '😆 kAbCdE 😆 http://xhslink.com/a/AbCdEfGh, 复制本条信息，打开【小红书】App查看精彩内容！';
    const result = normalizeVideoUrl(shareText);
    expect(result).toEqual({ url: 'https://xhslink.com/a/AbCdEfGh', platform: 'xhs' });
  });

  it('labels other hosts unknown but still normalizes', () => {
    const result = normalizeVideoUrl('https://example.com/watch?v=1');
    expect(result).toEqual({ url: 'https://example.com/watch', platform: 'unknown' });
  });

  it('returns null when no URL is present', () => {
    expect(normalizeVideoUrl('paste a link here')).toBeNull();
    expect(normalizeVideoUrl('')).toBeNull();
  });
});
