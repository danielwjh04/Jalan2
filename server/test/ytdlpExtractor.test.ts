import { describe, expect, it } from 'vitest';
import { captionFromYtDlpInfo } from '../src/adapters/extractor/ytdlp';

describe('captionFromYtDlpInfo', () => {
  it('prefers description over title', () => {
    expect(
      captionFromYtDlpInfo({
        title: 'Fallback title',
        description: 'Detailed caption',
      }),
    ).toBe('Detailed caption');
  });

  it('falls back to title when description is blank', () => {
    expect(captionFromYtDlpInfo({ title: 'River cruise RM25', description: '' })).toBe(
      'River cruise RM25',
    );
  });
});
