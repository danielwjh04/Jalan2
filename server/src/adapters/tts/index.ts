import type { Config } from '../../config';
import { NotConfiguredError } from '../../lib/errors';
import { createCachedTts } from './cached';
import { createElevenLabsTts } from './elevenlabs';
import type { TextToSpeech } from './types';

export function pickTts(config: Config): TextToSpeech {
  switch (config.TTS_PROVIDER) {
    case 'elevenlabs':
      if (!config.ELEVENLABS_API_KEY) {
        throw new NotConfiguredError(
          'ElevenLabs TTS',
          'Set ELEVENLABS_API_KEY or use TTS_PROVIDER=cached.',
        );
      }
      return createElevenLabsTts(config.ELEVENLABS_API_KEY);
    case 'cached':
      return createCachedTts();
  }
}
