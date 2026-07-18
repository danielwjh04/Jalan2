import type { Config } from '../../config';
import { resolveFixtureSlug } from '../../lib/fixtures';
import { createAutoExtractor } from './auto';
import { createFixtureExtractor } from './fixture';
import { withExtractorFallback } from './fallback';
import { createTikhubExtractor } from './tikhub';
import type { Extractor } from './types';
import { createXhsDownloaderExtractor } from './xhsDownloader';

export function pickExtractor(config: Config): Extractor {
  switch (config.EXTRACTOR) {
    case 'auto': {
      const tikhub = createTikhubExtractor(config.TIKHUB_TOKEN);
      return configuredExtractor(config, createAutoExtractor({
        tiktok: tikhub,
        // Local development gets the higher-control self-hosted extractor.
        // Cloud Functions cannot reach localhost, so TikHub handles XHS when
        // the sidecar is unavailable.
        xhs: withExtractorFallback(
          createXhsDownloaderExtractor(config.XHS_DOWNLOADER_URL, config.XHS_DOWNLOADER_AUDIENCE),
          tikhub,
        ),
      }));
    }
    case 'tikhub':
      return configuredExtractor(config, createTikhubExtractor(config.TIKHUB_TOKEN));
    case 'xhs-downloader':
      return configuredExtractor(config, createXhsDownloaderExtractor(
        config.XHS_DOWNLOADER_URL,
        config.XHS_DOWNLOADER_AUDIENCE,
      ));
    case 'fixture':
      return createFixtureExtractor();
  }
}

function configuredExtractor(config: Config, primary: Extractor): Extractor {
  return config.PIPELINE_MODE === 'live' ? primary : withFixtureFallback(primary);
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
