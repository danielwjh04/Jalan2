import { z } from 'zod';
import type { Retrieval, RetrievalResult } from './types';

const SEARCH_URL = 'https://api.exa.ai/search';

const ExaResultSchema = z.object({
  title: z.string().nullable().optional(),
  url: z.string(),
  text: z.string().optional(),
  image: z.string().optional(),
});

const ExaResponseSchema = z.object({ results: z.array(ExaResultSchema) });

const SNIPPET_CHARACTERS = 300;

// Exa's payload is validated here so any API shape drift surfaces as one
// failing function instead of silently empty search results.
export function parseExaResponse(json: unknown): RetrievalResult[] {
  return ExaResponseSchema.parse(json).results.map((result) => ({
    title: result.title ?? result.url,
    url: result.url,
    snippet: result.text ? result.text.slice(0, SNIPPET_CHARACTERS) : null,
    imageUrl: result.image ?? null,
    text: result.text ?? null,
  }));
}

export function createExaRetrieval(apiKey: string): Retrieval {
  return {
    name: 'exa',
    async search(query, limit, textCharacters = SNIPPET_CHARACTERS) {
      const response = await fetch(SEARCH_URL, {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
        body: JSON.stringify({
          query,
          numResults: limit,
          contents: { text: { maxCharacters: textCharacters } },
        }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Exa search failed (${response.status}): ${detail.slice(0, 200)}`);
      }
      return parseExaResponse(await response.json());
    },
  };
}
