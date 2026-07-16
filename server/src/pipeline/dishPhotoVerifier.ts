import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import type { Dish } from '@shared/menu';
import type { DishPhoto } from '../adapters/foodImages/types';

const PhotoMatchSchema = z.object({
  best_candidate_index: z.number().int().min(0).max(4).nullable(),
  verdict: z.enum(['exact', 'plausible', 'reject']),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
});

export type DishPhotoVerifier = (
  dish: Dish,
  candidates: DishPhoto[],
) => Promise<DishPhoto | null>;

const SYSTEM_PROMPT = [
  'You are a conservative Malaysian food-photo verifier.',
  'Choose an image only when its visible dish identity matches the menu row, not merely because it contains noodles.',
  'Check noodle shape and preparation, soup versus dry versus gravy, colour, toppings, and Malaysian regional style.',
  'Regional distinctions are mandatory: Kuala Lumpur Hokkien mee is dark soy wok-fried; Penang Hokkien mee is prawn noodle soup; Singapore Hokkien mee is a pale seafood-stock fried noodle dish.',
  'Yee mee uses pre-fried egg noodles and must not be represented by curry, stew, rice, or an unrelated noodle bowl.',
  'Handmade noodles or 手工面 in a Malaysian kopitiam are commonly ban mian-style wheat noodles, not yee mee.',
  'If the menu identity or regional variant is ambiguous, or no image is a strong match, reject all candidates.',
  'Never reward composition or beauty over food identity. A missing photo is better than a wrong photo.',
].join(' ');

export function createOpenAIDishPhotoVerifier(client: OpenAI, model: string): DishPhotoVerifier {
  return async (dish, candidates) => {
    const shortlist = candidates.slice(0, 5);
    if (shortlist.length === 0) return null;
    const completion = await client.beta.chat.completions.parse({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: [
                `Menu text: ${dish.name_local}`,
                `Interpretation: ${dish.name_english}`,
                `Malaysian search identity: ${dish.image_search_query}`,
                'The following images are numbered candidates. Return an exact match only when the visible evidence supports this precise dish and regional style.',
              ].join('\n'),
            },
            ...shortlist.flatMap((candidate, index) => ([
              { type: 'text' as const, text: `Candidate ${index}` },
              {
                type: 'image_url' as const,
                image_url: { url: candidate.imageUrl, detail: 'high' as const },
              },
            ])),
          ],
        },
      ],
      response_format: zodResponseFormat(PhotoMatchSchema, 'dish_photo_match'),
    });
    const match = completion.choices[0]?.message.parsed;
    if (!match || match.best_candidate_index === null) return null;
    if (match.verdict !== 'exact' || match.confidence < 0.78) return null;
    return shortlist[match.best_candidate_index] ?? null;
  };
}
