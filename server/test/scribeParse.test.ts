import { describe, expect, it } from 'vitest';
import { parseScribeResponse } from '../src/adapters/stt/elevenlabs';

describe('parseScribeResponse', () => {
  it('maps text and word timings to one spanning segment', () => {
    const transcript = parseScribeResponse({
      text: 'Dive at Bako jetty',
      words: [
        { text: 'Dive', start: 0.1, end: 0.4 },
        { text: ' ', start: 0.4, end: 0.5 },
        { text: 'at Bako jetty', start: 0.5, end: 1.8 },
      ],
    });
    expect(transcript.text).toBe('Dive at Bako jetty');
    expect(transcript.segments).toEqual([{ start: 0.1, end: 1.8, text: 'Dive at Bako jetty' }]);
  });

  it('returns no segments when words carry no timings', () => {
    const transcript = parseScribeResponse({ text: 'hello', words: [{ text: 'hello' }] });
    expect(transcript.segments).toEqual([]);
  });

  it('handles a words-free payload', () => {
    expect(parseScribeResponse({ text: 'hello' })).toEqual({ text: 'hello', segments: [] });
  });

  it('throws on a malformed payload', () => {
    expect(() => parseScribeResponse({ transcript: 'wrong shape' })).toThrow();
  });
});
