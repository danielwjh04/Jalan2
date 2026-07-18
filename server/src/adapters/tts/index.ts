import type { Config } from '../../config';
import { NotConfiguredError } from '../../lib/errors';
import { createCachedTts } from './cached';
import { createElevenLabsTts } from './elevenlabs';
import { createGoogleCloudTts } from './googleCloud';
import { createLanguageRoutingTts } from './languageRouter';
import type { TextToSpeech } from './types';

export function pickTts(config: Config): TextToSpeech {
  const primary = pickPrimaryTts(config);
  // The demo project has Text-to-Speech enabled on the same restricted Google
  // key used for Maps. Prefer a dedicated key when supplied, but do not leave
  // Cantonese silently disabled when the shared key is explicitly enabled for
  // texttospeech.googleapis.com.
  const googleTtsKey = config.GOOGLE_CLOUD_TTS_API_KEY ?? config.GOOGLE_MAPS_API_KEY;
  const cantonese = googleTtsKey
    ? createGoogleCloudTts(googleTtsKey)
    : unavailableCantoneseTts();
  return createLanguageRoutingTts(primary, cantonese);
}

function unavailableCantoneseTts(): TextToSpeech {
  return {
    name: 'google_cloud',
    async synthesize() {
      throw new NotConfiguredError(
        'Google Cloud Cantonese TTS',
        'Set GOOGLE_CLOUD_TTS_API_KEY, or enable Text-to-Speech on GOOGLE_MAPS_API_KEY.',
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
