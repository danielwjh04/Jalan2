import { describe, expect, it } from 'vitest';
import { MAX_SOCIAL_SOURCES, parseSocialUrls, sourcePlatform } from '../src/social';

describe('social source collection', () => {
  it('normalizes, deduplicates and limits mixed links', () => {
    const values = Array.from({ length: MAX_SOCIAL_SOURCES + 2 }, (_, index) => index % 2 ? `https://vt.tiktok.com/code${index}/` : `http://xhslink.com/o/code${index}`);
    const result = parseSocialUrls(`${values.join('\n')}\n${values[0]}\nnot-a-link`);
    expect(result).toHaveLength(MAX_SOCIAL_SOURCES);
    expect(new Set(result).size).toBe(MAX_SOCIAL_SOURCES);
    expect(result[0]).toMatch(/^https:\/\//);
  });

  it('labels XHS and TikTok', () => {
    expect(sourcePlatform('https://vt.tiktok.com/a')).toBe('TikTok');
    expect(sourcePlatform('https://xhslink.com/a')).toBe('XHS');
  });
});
