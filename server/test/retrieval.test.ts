import { describe, expect, it } from 'vitest';
import { parseExaResponse } from '../src/adapters/retrieval/exa';
import { createFixtureRetrieval } from '../src/adapters/retrieval/fixture';

describe('parseExaResponse', () => {
  it('maps results with text and image', () => {
    const results = parseExaResponse({
      results: [
        {
          title: 'Kolo Mee guide',
          url: 'https://example.com/kolo-mee',
          text: 'Kuching noodle classic',
          image: 'https://example.com/kolo.jpg',
        },
      ],
    });
    expect(results).toEqual([
      {
        title: 'Kolo Mee guide',
        url: 'https://example.com/kolo-mee',
        snippet: 'Kuching noodle classic',
        imageUrl: 'https://example.com/kolo.jpg',
        text: 'Kuching noodle classic',
      },
    ]);
  });

  it('falls back to the url as title and nulls missing fields', () => {
    const results = parseExaResponse({ results: [{ url: 'https://example.com/x', title: null }] });
    expect(results[0]).toEqual({
      title: 'https://example.com/x',
      url: 'https://example.com/x',
      snippet: null,
      imageUrl: null,
      text: null,
    });
  });

  it('throws on a malformed payload', () => {
    expect(() => parseExaResponse({ hits: [] })).toThrow();
  });
});

describe('createFixtureRetrieval', () => {
  it('returns [] for queries with no captured results', async () => {
    const retrieval = createFixtureRetrieval();
    await expect(retrieval.search('never captured query', 3)).resolves.toEqual([]);
  });
});
