import { createReadStream } from 'node:fs';
import OpenAI from 'openai';
import type { SpeechToText, Transcript } from './types';

export function createOpenAiStt(client: OpenAI, model: string): SpeechToText {
  return {
    name: 'openai',
    async transcribe(audioPath) {
      // Only whisper models support verbose_json with segment timestamps.
      if (model.startsWith('whisper')) return transcribeVerbose(client, model, audioPath);
      const result = await client.audio.transcriptions.create({
        file: createReadStream(audioPath),
        model,
      });
      return { text: result.text, segments: [] };
    },
  };
}

async function transcribeVerbose(
  client: OpenAI,
  model: string,
  audioPath: string,
): Promise<Transcript> {
  const result = await client.audio.transcriptions.create({
    file: createReadStream(audioPath),
    model,
    response_format: 'verbose_json',
  });
  const segments = (result.segments ?? []).map((segment) => ({
    start: segment.start,
    end: segment.end,
    text: segment.text,
  }));
  return { text: result.text, segments };
}
