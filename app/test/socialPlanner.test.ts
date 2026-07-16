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

  it('uses one shared link composer and keeps route reordering in the guide', () => {
    const screen = readFileSync(resolve(__dirname, '../src/app/social-plan.tsx'), 'utf8');
    const reorder = readFileSync(resolve(__dirname, '../src/components/TripOrderEditor.web.tsx'), 'utf8');
    const list = readFileSync(resolve(__dirname, '../src/components/TripStopList.tsx'), 'utf8');
    expect(screen).toContain('<SocialGuideComposer');
    expect(screen).toContain('generateSocialGuide');
    expect(screen).not.toContain('Read all posts');
    expect(screen).not.toContain('CHOOSE PLACES');
    expect(reorder).toContain('draggable');
    expect(list).toContain('label="Optimise"');
  });
});
