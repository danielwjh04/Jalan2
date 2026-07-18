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

  it('uses the enabled shared Google key for Cantonese when no dedicated key is set', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      audioContent: Buffer.from('cantonese').toString('base64'),
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const routed = pickTts(loadConfig({ TTS_PROVIDER: 'cached', GOOGLE_MAPS_API_KEY: 'shared-google-key' }));

    await expect(routed.synthesize({
      ...baseRequest,
      languageCode: 'yue-HK',
      voiceName: 'yue-HK-Standard-A',
    })).resolves.toEqual(Buffer.from('cantonese'));
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining('key=shared-google-key'),
      expect.objectContaining({ method: 'POST' }),
    );
    fetcher.mockRestore();
  });
});
