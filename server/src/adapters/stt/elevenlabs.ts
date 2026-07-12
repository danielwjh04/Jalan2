import { readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import type { SpeechToText, Transcript } from './types';

const SCRIBE_URL = 'https://api.elevenlabs.io/v1/speech-to-text';

const ScribeWordSchema = z.object({
  text: z.string(),
  start: z.number().optional(),
  end: z.number().optional(),
});

const ScribeResponseSchema = z.object({
  text: z.string(),
  words: z.array(ScribeWordSchema).optional(),
});

// Scribe's payload is validated here so any API shape drift surfaces as one
// failing function instead of corrupt transcripts downstream.
export function parseScribeResponse(json: unknown): Transcript {
  const parsed = ScribeResponseSchema.parse(json);
  const timed = (parsed.words ?? []).filter(
    (word) => word.start !== undefined && word.end !== undefined,
  );
  if (timed.length === 0) return { text: parsed.text, segments: [] };
  return {
    text: parsed.text,
    segments: [
      {
        start: timed[0].start ?? 0,
        end: timed[timed.length - 1].end ?? 0,
        text: parsed.text,
      },
    ],
  };
}

export function createElevenLabsStt(apiKey: string, modelId: string): SpeechToText {
  return {
    name: 'elevenlabs',
    async transcribe(audioPath) {
      const form = new FormData();
      form.append('model_id', modelId);
      form.append('file', new Blob([readFileSync(audioPath)]), path.basename(audioPath));
      const response = await fetch(SCRIBE_URL, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: form,
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`ElevenLabs Scribe failed (${response.status}): ${detail.slice(0, 200)}`);
      }
      return parseScribeResponse(await response.json());
    },
  };
}
