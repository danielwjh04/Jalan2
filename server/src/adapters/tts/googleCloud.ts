import type { TextToSpeech } from './types';

const SYNTHESIZE_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

export function createGoogleCloudTts(apiKey: string): TextToSpeech {
  return {
    name: 'google_cloud',
    async synthesize(request) {
      if (!request.languageCode || !request.voiceName) {
        throw new Error('Google Cloud TTS requires languageCode and voiceName');
      }
      const response = await fetch(`${SYNTHESIZE_URL}?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          input: { text: request.text },
          voice: { languageCode: request.languageCode, name: request.voiceName },
          audioConfig: { audioEncoding: 'MP3', speakingRate: 0.94 },
        }),
      });
      const body = await response.json() as { audioContent?: string; error?: { message?: string } };
      if (!response.ok || !body.audioContent) {
        throw new Error(`Google Cloud TTS failed (${response.status}): ${body.error?.message ?? 'no audio returned'}`);
      }
      return Buffer.from(body.audioContent, 'base64');
    },
  };
}
