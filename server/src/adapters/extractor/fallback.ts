import type { Extractor } from './types';

export function withExtractorFallback(primary: Extractor, fallback: Extractor): Extractor {
  return {
    name: primary.name,
    async extract(normalizedUrl) {
      try {
        return await primary.extract(normalizedUrl);
      } catch (primaryError) {
        try {
          return await fallback.extract(normalizedUrl);
        } catch (fallbackError) {
          throw new Error(
            `Primary ${primary.name} failed: ${message(primaryError)}; fallback ${fallback.name} failed: ${message(fallbackError)}`,
          );
        }
      }
    },
  };
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
