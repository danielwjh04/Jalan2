import OpenAI from 'openai';
import { describe, expect, it, vi } from 'vitest';
import { loadCachedMenu } from '../src/lib/fixtures';
import { createOpenAIDishPhotoVerifier } from '../src/pipeline/dishPhotoVerifier';

const candidates = [{
  imageUrl: 'https://example.com/candidate.jpg',
  imageAttributions: [],
}];

function mockClient(parsed: object): { client: OpenAI; parse: ReturnType<typeof vi.fn> } {
  const parse = vi.fn(async () => ({ choices: [{ message: { parsed } }] }));
  return {
    client: { beta: { chat: { completions: { parse } } } } as unknown as OpenAI,
    parse,
  };
}

describe('dish photo verifier', () => {
  it('accepts only an exact high-confidence visual match', async () => {
    const menu = loadCachedMenu();
    if (!menu) throw new Error('Missing cached menu');
    const { client, parse } = mockClient({
      best_candidate_index: 0,
      verdict: 'exact',
      confidence: 0.92,
      reason: 'Crinkly pre-fried egg noodles in Malaysian-style soup.',
    });

    const selected = await createOpenAIDishPhotoVerifier(client, 'gpt-test')(
      menu.dishes.find((dish) => dish.name_local.includes('伊面')) ?? menu.dishes[0],
      candidates,
    );

    expect(selected).toBe(candidates[0]);
    expect(parse).toHaveBeenCalledOnce();
  });

  it('rejects a merely plausible image even at high confidence', async () => {
    const menu = loadCachedMenu();
    if (!menu) throw new Error('Missing cached menu');
    const { client } = mockClient({
      best_candidate_index: 0,
      verdict: 'plausible',
      confidence: 0.98,
      reason: 'A noodle dish, but the regional identity is not visible.',
    });

    const selected = await createOpenAIDishPhotoVerifier(client, 'gpt-test')(
      menu.dishes[0],
      candidates,
    );

    expect(selected).toBeNull();
  });
});
