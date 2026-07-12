import type { TextToSpeech, TtsRequest } from './types';

const BASE_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

export function createElevenLabsTts(apiKey: string): TextToSpeech {
  return {
    name: 'elevenlabs',
    async synthesize(request: TtsRequest): Promise<Buffer> {
      const response = await fetch(`${BASE_URL}/${request.voiceId}`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'content-type': 'application/json' },
        body: JSON.stringify({ text: request.text, model_id: request.modelId }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`ElevenLabs TTS failed (${response.status}): ${detail.slice(0, 200)}`);
      }
      return Buffer.from(await response.arrayBuffer());
    },
  };
}
