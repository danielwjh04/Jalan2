import { describe, expect, it } from 'vitest';
import { normalizeVideoUrl } from '@shared/videoUrl';
import { createFixtureExtractor } from '../src/adapters/extractor/fixture';
import { knownFixtures, loadCachedBooking } from '../src/lib/fixtures';

const extractor = createFixtureExtractor();

function normalized(raw: string): string {
  const result = normalizeVideoUrl(raw);
  if (!result) throw new Error(`Test URL failed to normalize: ${raw}`);
  return result.url;
}

describe('FixtureExtractor', () => {
  it('resolves a manifest URL to its fixture', async () => {
    const media = await extractor.extract(
      normalized('https://www.tiktok.com/@kuchingdive/video/7301234567890123456?utm_source=share'),
    );
    expect(media.fixtureSlug).toBe('kuching-dive-01');
    expect(media.caption).toContain('RM250');
  });

  it('resolves share short-links to the same fixture', async () => {
    const media = await extractor.extract(normalized('https://vm.tiktok.com/ZSjKuDive1/'));
    expect(media.fixtureSlug).toBe('kuching-dive-01');
  });

  it('rejects unknown URLs and lists the known demo URLs', async () => {
    await expect(extractor.extract('https://tiktok.com/@nobody/video/1')).rejects.toThrow(
      /Known demo URLs/,
    );
  });
});

describe('fixture data integrity', () => {
  it('every manifest fixture has a schema-valid cached booking', () => {
    const fixtures = knownFixtures();
    expect(fixtures.length).toBeGreaterThan(0);
    const slugs = [...new Set(fixtures.map((f) => f.slug))];
    for (const slug of slugs) {
      expect(loadCachedBooking(slug), `booking.cached.json for ${slug}`).not.toBeNull();
    }
  });
});
