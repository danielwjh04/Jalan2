import { readFileSync } from 'node:fs';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const MAX_CANDIDATES = 10;

const CoverChoiceSchema = z.object({
  index: z.number().int().nonnegative().describe('Zero-based index of the strongest listing cover'),
  focus_x: z.number().min(0).max(1).describe('Horizontal focal point from left to right'),
  focus_y: z.number().min(0).max(1).describe('Vertical focal point from top to bottom'),
  zoom: z.number().min(1).max(3).describe('Crop zoom, where 1 keeps maximum context'),
  reason: z.string().describe('Short visual reason for the choice'),
});

export interface CoverSelection {
  path: string;
  focusX: number;
  focusY: number;
  zoom: number;
}

const COVER_INSTRUCTIONS = [
  'Choose the strongest hero image for a Malaysian travel experience listing.',
  'The image will be cropped to a wide 16:9 card around the focal point you return.',
  'Prefer a clear, sharp, naturally composed place, activity, landscape, food, or culture shot.',
  'The subject must still read immediately after a wide crop. Prefer visual depth, colour,',
  'a clean central subject, and enough surrounding context to make someone want to visit.',
  'Strongly reject promotional title cards, large baked-in words, collages, screenshots,',
  'app UI, duplicated frames, heavy watermarks, blur, extreme close-ups, and awkward faces.',
  'Set focus_x and focus_y to the centre of the important visual subject, away from text.',
  'Use zoom 1 for a normal photo. Use up to 3 only to isolate one clean scene from a collage',
  'or remove unavoidable text, while keeping enough context to understand the destination.',
  'Do not edit the image and do not infer whether an activity is safe or accredited.',
].join(' ');

export async function chooseAestheticCover(
  client: OpenAI,
  model: string,
  candidates: string[],
): Promise<CoverSelection | null> {
  if (candidates.length === 0) return null;
  const sampled = sampleCoverCandidates(candidates);
  try {
    const choice = await requestChoice(client, model, sampled);
    const selected = sampled[choice.index];
    return selected
      ? { path: selected, focusX: choice.focus_x, focusY: choice.focus_y, zoom: choice.zoom }
      : fallbackCandidate(sampled);
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

function fallbackCandidate(candidates: string[]): CoverSelection {
  return centered(candidates[Math.floor(candidates.length / 2)]);
}

function centered(path: string): CoverSelection {
  return { path, focusX: 0.5, focusY: 0.5, zoom: 1 };
}

async function requestChoice(client: OpenAI, model: string, paths: string[]): Promise<z.infer<typeof CoverChoiceSchema>> {
  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    { type: 'text', text: `${paths.length} candidates follow. Return the best index.` },
  ];
  for (const [index, imagePath] of paths.entries()) {
    content.push({ type: 'text', text: `Candidate ${index}:` });
    content.push({
      type: 'image_url',
      image_url: { url: toDataUrl(imagePath), detail: 'high' },
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
  return choice;
}

function toDataUrl(imagePath: string): string {
  return `data:image/jpeg;base64,${readFileSync(imagePath).toString('base64')}`;
}
