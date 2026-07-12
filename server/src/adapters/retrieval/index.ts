import type { Config } from '../../config';
import { NotConfiguredError } from '../../lib/errors';
import { createExaRetrieval } from './exa';
import { createFixtureRetrieval } from './fixture';
import type { Retrieval } from './types';

export function pickRetrieval(config: Config): Retrieval {
  switch (config.RETRIEVAL_PROVIDER) {
    case 'exa':
      if (!config.EXA_API_KEY) {
        throw new NotConfiguredError('Exa', 'Set EXA_API_KEY or use RETRIEVAL_PROVIDER=fixture.');
      }
      return createExaRetrieval(config.EXA_API_KEY);
    case 'fixture':
      return createFixtureRetrieval();
  }
}
