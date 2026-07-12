import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { fixturesRoot } from '../../lib/paths';
import type { Retrieval, RetrievalResult } from './types';

const ResultsFileSchema = z.record(
  z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string().nullable(),
      imageUrl: z.string().nullable(),
    }),
  ),
);

let cache: Record<string, RetrievalResult[]> | null = null;

function resultsFile(): Record<string, RetrievalResult[]> {
  if (cache) return cache;
  const file = path.join(fixturesRoot(), 'retrieval', 'results.json');
  cache = existsSync(file) ? ResultsFileSchema.parse(JSON.parse(readFileSync(file, 'utf8'))) : {};
  return cache;
}

export function resetRetrievalFixtures(): void {
  cache = null;
}

// Offline stand-in: entries are real search output captured during rehearsal
// and served as cache, never fabricated. Unknown queries return [] so callers
// must handle the empty case honestly.
export function createFixtureRetrieval(): Retrieval {
  return {
    name: 'fixture',
    search(query, limit) {
      const lower = query.toLowerCase();
      const match = Object.entries(resultsFile()).find(([key]) =>
        lower.includes(key.toLowerCase()),
      );
      return Promise.resolve(match ? match[1].slice(0, limit) : []);
    },
  };
}
