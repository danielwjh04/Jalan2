import { readFileSync } from 'node:fs';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const MAX_CANDIDATES = 10;

const CoverChoiceSchema = z.object({
  index: z.number().describe('Zero-based index of the strongest listing cover'),
  reason: z.string().describe('Short visual reason for the choice'),
});

const COVER_INSTRUCTIONS = [
  'Choose the strongest hero image for a Malaysian travel experience listing.',
  'Prefer one clear, sharp, naturally composed photograph that shows the place,',
  'activity, landscape, food, or culture. Prefer minimal text overlays.',
  'Avoid promotional title cards, collages, screenshots, app UI, duplicated frames,',
  'heavy watermarks, blurry images, and close portraits that hide the destination.',
  'Do not edit the image and do not infer whether an activity is safe or accredited.',
].join(' ');

export async function chooseAestheticCover(
  client: OpenAI,
  model: string,
  candidates: string[],
): Promise<string | null> {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];
  const sampled = sampleCoverCandidates(candidates);
  try {
    const index = await requestChoice(client, model, sampled);
    return sampled[index] ?? fallbackCandidate(sampled);
  } catch (error) {
    console.warn(`[cover] aesthetic selection failed: ${(error as Error).message}`);
    return fallbackCandidate(sampled);
  }
}

export function sampleCoverCandidates(
  candidates: string[],
  limit = MAX_CANDIDATES,
): string[] {
  if (limit <= 1) return candidates.slice(0, 1);
  if (candidates.length <= limit) return candidates;
  return Array.from({ length: limit }, (_, index) => {
    const sourceIndex = Math.round((index * (candidates.length - 1)) / (limit - 1));
    return candidates[sourceIndex];
  });
}

function fallbackCandidate(candidates: string[]): string {
  return candidates[Math.floor(candidates.length / 2)];
}

async function requestChoice(client: OpenAI, model: string, paths: string[]): Promise<number> {
  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    { type: 'text', text: `${paths.length} candidates follow. Return the best index.` },
  ];
  for (const [index, imagePath] of paths.entries()) {
    content.push({ type: 'text', text: `Candidate ${index}:` });
    content.push({
      type: 'image_url',
      image_url: { url: toDataUrl(imagePath), detail: 'low' },
    });
  }
  const completion = await client.beta.chat.completions.parse({
    model,
    messages: [
      { role: 'system', content: COVER_INSTRUCTIONS },
      { role: 'user', content },
    ],
    response_format: zodResponseFormat(CoverChoiceSchema, 'cover_choice'),
  });
  const choice = completion.choices[0]?.message.parsed;
  if (!choice || !Number.isInteger(choice.index) || !paths[choice.index]) {
    throw new Error('Cover selection returned an invalid index');
  }
  return choice.index;
}

function toDataUrl(imagePath: string): string {
  return `data:image/jpeg;base64,${readFileSync(imagePath).toString('base64')}`;
}
