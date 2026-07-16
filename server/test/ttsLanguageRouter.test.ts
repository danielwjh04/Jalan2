import { describe, expect, it, vi } from 'vitest';
import type { TextToSpeech } from '../src/adapters/tts/types';
import { createLanguageRoutingTts } from '../src/adapters/tts/languageRouter';
import { pickTts } from '../src/adapters/tts';
import { loadConfig } from '../src/config';

function provider(name: TextToSpeech['name'], output: string): TextToSpeech & { synthesize: ReturnType<typeof vi.fn> } {
  return { name, synthesize: vi.fn(async () => Buffer.from(output)) };
}

const baseRequest = { text: 'hello', voiceId: 'voice', modelId: 'model' };

describe('language-routing TTS', () => {
  it('routes explicit yue-HK requests to the Cantonese provider', async () => {
    const primary = provider('elevenlabs', 'mandarin');
    const cantonese = provider('google_cloud', 'cantonese');
    const routed = createLanguageRoutingTts(primary, cantonese);

    await expect(routed.synthesize({ ...baseRequest, languageCode: 'yue-HK' })).resolves.toEqual(Buffer.from('cantonese'));
    expect(cantonese.synthesize).toHaveBeenCalledOnce();
    expect(primary.synthesize).not.toHaveBeenCalled();
  });

  it('keeps Malay and Mandarin requests on the primary provider', async () => {
    const primary = provider('elevenlabs', 'primary');
    const cantonese = provider('google_cloud', 'cantonese');
    const routed = createLanguageRoutingTts(primary, cantonese);

    await expect(routed.synthesize(baseRequest)).resolves.toEqual(Buffer.from('primary'));
    expect(primary.synthesize).toHaveBeenCalledOnce();
    expect(cantonese.synthesize).not.toHaveBeenCalled();
  });

  it('never sends Cantonese to ElevenLabs or a Maps-only key', async () => {
    const routed = pickTts(loadConfig({ TTS_PROVIDER: 'cached', GOOGLE_MAPS_API_KEY: 'maps-only' }));

    await expect(routed.synthesize({ ...baseRequest, languageCode: 'yue-HK' }))
      .rejects.toThrow('Set a dedicated GOOGLE_CLOUD_TTS_API_KEY');
  });
});
