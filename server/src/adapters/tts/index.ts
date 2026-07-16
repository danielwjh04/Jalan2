import type { Config } from '../../config';
import { NotConfiguredError } from '../../lib/errors';
import { createCachedTts } from './cached';
import { createElevenLabsTts } from './elevenlabs';
import { createGoogleCloudTts } from './googleCloud';
import { createLanguageRoutingTts } from './languageRouter';
import type { TextToSpeech } from './types';

export function pickTts(config: Config): TextToSpeech {
  const primary = pickPrimaryTts(config);
  const cantonese = config.GOOGLE_CLOUD_TTS_API_KEY
    ? createGoogleCloudTts(config.GOOGLE_CLOUD_TTS_API_KEY)
    : unavailableCantoneseTts();
  return createLanguageRoutingTts(primary, cantonese);
}

function unavailableCantoneseTts(): TextToSpeech {
  return {
    name: 'google_cloud',
    async synthesize() {
      throw new NotConfiguredError(
        'Google Cloud Cantonese TTS',
        'Set a dedicated GOOGLE_CLOUD_TTS_API_KEY permitted to call texttospeech.googleapis.com.',
      );
    },
  };
}

function pickPrimaryTts(config: Config): TextToSpeech {
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
