import { describe, expect, it } from 'vitest';
import { cachedVoicePath, voiceHash } from '../src/lib/voiceCache';

const REQUEST = { text: 'Kopi O kosong satu.', voiceId: 'voice-a', modelId: 'model-x' };

describe('voiceHash', () => {
  it('is stable for identical requests', () => {
    expect(voiceHash(REQUEST)).toBe(voiceHash({ ...REQUEST }));
  });

  it('changes when any component changes', () => {
    expect(voiceHash(REQUEST)).not.toBe(voiceHash({ ...REQUEST, text: 'Teh C peng satu.' }));
    expect(voiceHash(REQUEST)).not.toBe(voiceHash({ ...REQUEST, voiceId: 'voice-b' }));
    expect(voiceHash(REQUEST)).not.toBe(voiceHash({ ...REQUEST, modelId: 'model-y' }));
    expect(voiceHash(REQUEST)).not.toBe(voiceHash({ ...REQUEST, languageCode: 'yue-HK' }));
    expect(voiceHash(REQUEST)).not.toBe(voiceHash({ ...REQUEST, voiceName: 'yue-HK-Standard-A' }));
  });

  it('is 16 hex chars and maps to an mp3 cache path', () => {
    const hash = voiceHash(REQUEST);
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
    expect(cachedVoicePath(hash).endsWith(`${hash}.mp3`)).toBe(true);
  });
});
