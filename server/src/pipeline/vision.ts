import { readFileSync } from 'node:fs';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import type { Keyframe } from './keyframes';

export const VisionReadoutSchema = z.object({
  frames: z.array(
    z.object({
      ts: z.string().describe('Frame timestamp label exactly as given, e.g. "12.5s"'),
      on_screen_text: z.string().describe('All legible on-screen text, verbatim'),
      price_candidates: z.array(z.string()),
      phone_candidates: z.array(z.string()),
      place_candidates: z.array(z.string()),
      operator_or_logo: z.string().nullable(),
    }),
  ),
});

export type VisionReadout = z.infer<typeof VisionReadoutSchema>;

const VISION_INSTRUCTIONS = [
  'You read keyframes from a Malaysian TikTok or Xiaohongshu travel post.',
  'Read Simplified and Traditional Chinese, Malay, and English, including mixed-language captions.',
  'For each frame report only text that is actually legible: captions, watermarks,',
  'signs, prices, phone numbers, place names, food stops, and operator names or logos.',
  'Put every explicitly visible venue or destination in place_candidates as a standalone name.',
  'Preserve visible Latin-script names such as "Susung Waterfall" or "Sunny Hill" even when',
  'they appear inside a Chinese sentence. Do not replace a specific name with a broad area.',
  'Do not guess or infer beyond what is visible.',
  'Use empty arrays and null when nothing qualifies.',
].join(' ');

export async function readFrames(
  client: OpenAI,
  model: string,
  frames: Keyframe[],
): Promise<VisionReadout> {
  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    { type: 'text', text: `${frames.length} frames follow, each labeled with its timestamp.` },
  ];
  for (const frame of frames) {
    content.push({ type: 'text', text: `Frame at ${frame.ts.toFixed(1)}s:` });
    content.push({
      type: 'image_url',
      image_url: { url: toDataUrl(frame.path), detail: 'high' },
    });
  }
  const completion = await client.beta.chat.completions.parse({
    model,
    messages: [
      { role: 'system', content: VISION_INSTRUCTIONS },
      { role: 'user', content },
    ],
    response_format: zodResponseFormat(VisionReadoutSchema, 'vision_readout'),
  });
  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) throw new Error('Vision readout returned no parsed content');
  return parsed;
}

function toDataUrl(imagePath: string): string {
  return `data:image/jpeg;base64,${readFileSync(imagePath).toString('base64')}`;
}
