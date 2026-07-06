import type { Config } from '../../config';
import { createFixtureExtractor } from './fixture';
import { createTikhubExtractor } from './tikhub';
import type { Extractor } from './types';

export function pickExtractor(config: Config): Extractor {
  switch (config.EXTRACTOR) {
    case 'tikhub':
      return createTikhubExtractor(config.TIKHUB_TOKEN);
    case 'fixture':
      return createFixtureExtractor();
  }
}
