import type OpenAI from 'openai';
import type { Config } from '../../config';
import { NotConfiguredError } from '../../lib/errors';
import { createOpenAiStt } from './openai';
import type { SpeechToText } from './types';

export function pickStt(config: Config, openai: OpenAI | null): SpeechToText | null {
  switch (config.STT_PROVIDER) {
    case 'elevenlabs':
      throw new NotConfiguredError(
        'ElevenLabs Scribe',
        'The adapter lands when the API key is provisioned. Use STT_PROVIDER=openai.',
      );
    case 'openai':
      return openai ? createOpenAiStt(openai, config.OPENAI_STT_MODEL) : null;
  }
}
