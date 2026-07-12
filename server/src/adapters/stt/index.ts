import type OpenAI from 'openai';
import type { Config } from '../../config';
import { createElevenLabsStt } from './elevenlabs';
import { createOpenAiStt } from './openai';
import type { SpeechToText } from './types';

export function pickStt(config: Config, openai: OpenAI | null): SpeechToText | null {
  switch (config.STT_PROVIDER) {
    case 'elevenlabs':
      return config.ELEVENLABS_API_KEY
        ? createElevenLabsStt(config.ELEVENLABS_API_KEY, config.ELEVENLABS_STT_MODEL)
        : null;
    case 'openai':
      return openai ? createOpenAiStt(openai, config.OPENAI_STT_MODEL) : null;
  }
}
