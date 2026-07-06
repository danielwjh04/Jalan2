import type { Config } from '../../config';
import { resolveFixtureSlug } from '../../lib/fixtures';
import { createFixtureExtractor } from './fixture';
import { createTikhubExtractor } from './tikhub';
import type { Extractor } from './types';

export function pickExtractor(config: Config): Extractor {
  switch (config.EXTRACTOR) {
    case 'tikhub':
      return withFixtureFallback(createTikhubExtractor(config.TIKHUB_TOKEN));
    case 'fixture':
      return createFixtureExtractor();
  }
}

function withFixtureFallback(primary: Extractor): Extractor {
  const fixture = createFixtureExtractor();
  return {
    name: 'tikhub',
    async extract(normalizedUrl) {
      if (resolveFixtureSlug(normalizedUrl)) return fixture.extract(normalizedUrl);
      return primary.extract(normalizedUrl);
    },
  };
}
