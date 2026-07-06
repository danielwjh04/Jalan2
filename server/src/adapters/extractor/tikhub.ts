import { NotConfiguredError } from '../../lib/errors';
import type { Extractor } from './types';

// Extension point for the hosted extractor. The API wiring lands once the
// hackathon token is provisioned; until then the fixture extractor is the
// supported path and this adapter fails loudly instead of pretending.
export function createTikhubExtractor(token: string | undefined): Extractor {
  return {
    name: 'tikhub',
    async extract() {
      if (!token) {
        throw new NotConfiguredError('TikHub extractor', 'Set TIKHUB_TOKEN or EXTRACTOR=fixture.');
      }
      throw new NotConfiguredError(
        'TikHub extractor',
        'API wiring is pending the hackathon token contract. Use EXTRACTOR=fixture.',
      );
    },
  };
}
