import {
  findAudioPath,
  findVideoPath,
  knownFixtures,
  readCaption,
  resolveFixtureSlug,
} from '../../lib/fixtures';
import type { Extractor } from './types';

export function createFixtureExtractor(): Extractor {
  return {
    name: 'fixture',
    async extract(normalizedUrl) {
      const slug = resolveFixtureSlug(normalizedUrl);
      if (!slug) {
        const known = knownFixtures()
          .map((f) => `  ${f.url} (${f.slug})`)
          .join('\n');
        throw new Error(`No fixture matches ${normalizedUrl}. Known demo URLs:\n${known}`);
      }
      return {
        fixtureSlug: slug,
        videoPath: findVideoPath(slug),
        audioPath: findAudioPath(slug),
        caption: readCaption(slug),
      };
    },
  };
}
