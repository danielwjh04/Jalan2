import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MAX_SOCIAL_SOURCES, parseSocialUrls, sourcePlatform } from '@shared/social';

describe('multi-source social planner', () => {
  it('normalizes, deduplicates and limits mixed XHS and TikTok links', () => {
    const values = Array.from({ length: MAX_SOCIAL_SOURCES + 2 }, (_, index) => index % 2
      ? `https://vt.tiktok.com/code${index}/`
      : `http://xhslink.com/o/code${index}`);
    const result = parseSocialUrls(`${values.join('\n')}\n${values[0]}\nnot-a-link`);
    expect(result).toHaveLength(MAX_SOCIAL_SOURCES);
    expect(new Set(result).size).toBe(MAX_SOCIAL_SOURCES);
    expect(result[0]).toMatch(/^https:\/\//);
  });

  it('labels both supported source platforms', () => {
    expect(sourcePlatform('https://vt.tiktok.com/a')).toBe('TikTok');
    expect(sourcePlatform('https://xhslink.com/a')).toBe('XHS');
  });

  it('exposes selection, multi-post creation and route reordering in the UI', () => {
    const screen = readFileSync(resolve(__dirname, '../src/app/social-plan.tsx'), 'utf8');
    const reorder = readFileSync(resolve(__dirname, '../src/components/TripOrderEditor.web.tsx'), 'utf8');
    expect(screen).toContain('Read all posts');
    expect(screen).toContain('CHOOSE PLACES');
    expect(screen).toContain('createSocialCollection');
    expect(reorder).toContain('draggable');
    expect(reorder).toContain('Optimize + check');
  });
});
