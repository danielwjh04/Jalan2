import type OpenAI from 'openai';
import { describe, expect, it, vi } from 'vitest';
import { chooseAestheticCover, sampleCoverCandidates } from '../src/pipeline/cover';

describe('sampleCoverCandidates', () => {
  it('samples large carousels evenly and keeps both ends', () => {
    const candidates = Array.from({ length: 14 }, (_, index) => `/tmp/image_${index + 1}.jpg`);
    const sampled = sampleCoverCandidates(candidates, 5);

    expect(sampled).toEqual([
      '/tmp/image_1.jpg',
      '/tmp/image_4.jpg',
      '/tmp/image_8.jpg',
      '/tmp/image_11.jpg',
      '/tmp/image_14.jpg',
    ]);
  });

  it('supports a one-image sample without dividing by zero', () => {
    expect(sampleCoverCandidates(['/tmp/one.jpg', '/tmp/two.jpg'], 1)).toEqual([
      '/tmp/one.jpg',
    ]);
  });
});

describe('chooseAestheticCover', () => {
  it('uses the model-selected source image without modifying it', async () => {
    const titleCard = 'server/fixtures/kuching-hidden-spots-02/cover.jpg';
    const destination = 'server/fixtures/kuching-city-guide-01/cover.jpg';
    const parse = vi.fn().mockResolvedValue({
      choices: [{ message: { parsed: {
        index: 1,
        focus_x: 0.4,
        focus_y: 0.65,
        zoom: 1.2,
        reason: 'Clear waterfall scene',
      } } }],
    });
    const client = {
      beta: { chat: { completions: { parse } } },
    } as unknown as OpenAI;

    await expect(
      chooseAestheticCover(client, 'gpt-4o-mini', [titleCard, destination]),
    ).resolves.toEqual({ path: destination, focusX: 0.4, focusY: 0.65, zoom: 1.2 });
    expect(parse).toHaveBeenCalledOnce();
  });

  it('asks for a focal crop even when there is only one candidate', async () => {
    const candidate = 'server/fixtures/kuching-city-guide-01/cover.jpg';
    const parse = vi.fn().mockResolvedValue({
      choices: [{ message: { parsed: {
        index: 0,
        focus_x: 0.6,
        focus_y: 0.4,
        zoom: 1.4,
        reason: 'Keep the food plate centered',
      } } }],
    });
    const client = {
      beta: { chat: { completions: { parse } } },
    } as unknown as OpenAI;

    await expect(chooseAestheticCover(client, 'model', [candidate])).resolves.toEqual({
      path: candidate,
      focusX: 0.6,
      focusY: 0.4,
      zoom: 1.4,
    });
    expect(parse).toHaveBeenCalledOnce();
  });

  it('avoids the promotional first slide when model selection fails', async () => {
    const titleCard = 'server/fixtures/kuching-hidden-spots-02/cover.jpg';
    const destination = 'server/fixtures/kuching-city-guide-01/cover.jpg';
    const parse = vi.fn().mockRejectedValue(new Error('model unavailable'));
    const client = {
      beta: { chat: { completions: { parse } } },
    } as unknown as OpenAI;

    await expect(
      chooseAestheticCover(client, 'model', [titleCard, destination]),
    ).resolves.toEqual({ path: destination, focusX: 0.5, focusY: 0.5, zoom: 1 });
  });
});
