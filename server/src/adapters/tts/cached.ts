import { NotConfiguredError } from '../../lib/errors';
import type { TextToSpeech } from './types';

// Cached mode serves only pre-generated fixture or cache mp3s, resolved by the
// voice service. Synthesis is deliberately unavailable so the demo can never
// silently depend on a live key.
export function createCachedTts(): TextToSpeech {
  return {
    name: 'cached',
    synthesize() {
      return Promise.reject(
        new NotConfiguredError(
          'ElevenLabs TTS',
          'Set TTS_PROVIDER=elevenlabs with ELEVENLABS_API_KEY to synthesize.',
        ),
      );
    },
  };
}
