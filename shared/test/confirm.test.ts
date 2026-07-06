import { describe, expect, it } from 'vitest';
import { isConfirmationText } from '../src/confirm';

describe('isConfirmationText', () => {
  it.each(['YES', 'yes can', 'Ya boleh', 'ok see you sat', 'Confirmed 2 pax', 'boleh!'])(
    'accepts %s',
    (text) => {
      expect(isConfirmationText(text)).toBe(true);
    },
  );

  it.each(['no', 'cannot la', 'fully booked sorry', 'who is this?', ''])('rejects %s', (text) => {
    expect(isConfirmationText(text)).toBe(false);
  });

  it('rejects negated confirmations', () => {
    expect(isConfirmationText('no boleh')).toBe(false);
    expect(isConfirmationText('cannot confirm yet')).toBe(false);
    expect(isConfirmationText('not ok')).toBe(false);
  });
});
