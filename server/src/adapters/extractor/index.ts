import type { Config } from '../../config';
import { resolveFixtureSlug } from '../../lib/fixtures';
import { createFixtureExtractor } from './fixture';
import { createTikhubExtractor } from './tikhub';
import type { Extractor } from './types';
import { createXhsDownloaderExtractor } from './xhsDownloader';

export function pickExtractor(config: Config): Extractor {
  switch (config.EXTRACTOR) {
    case 'tikhub':
      return withFixtureFallback(createTikhubExtractor(config.TIKHUB_TOKEN));
    case 'xhs-downloader':
      return withFixtureFallback(createXhsDownloaderExtractor(config.XHS_DOWNLOADER_URL));
    case 'fixture':
      return createFixtureExtractor();
  }
}

function withFixtureFallback(primary: Extractor): Extractor {
  const fixture = createFixtureExtractor();
  return {
    name: primary.name,
    async extract(normalizedUrl) {
      if (resolveFixtureSlug(normalizedUrl)) return fixture.extract(normalizedUrl);
      return primary.extract(normalizedUrl);
    },
  };
}
