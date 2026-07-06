import { describe, expect, it } from 'vitest';
import { canTransition } from '../src/status';

describe('canTransition', () => {
  it('allows the happy path DRAFT -> PENDING_CONFIRM -> CONFIRMED', () => {
    expect(canTransition('DRAFT', 'PENDING_CONFIRM')).toBe(true);
    expect(canTransition('PENDING_CONFIRM', 'CONFIRMED')).toBe(true);
  });

  it('allows failure from active states', () => {
    expect(canTransition('DRAFT', 'FAILED')).toBe(true);
    expect(canTransition('PENDING_CONFIRM', 'FAILED')).toBe(true);
  });

  it('rejects skipping straight to CONFIRMED', () => {
    expect(canTransition('DRAFT', 'CONFIRMED')).toBe(false);
  });

  it('rejects leaving terminal states', () => {
    expect(canTransition('CONFIRMED', 'DRAFT')).toBe(false);
    expect(canTransition('CONFIRMED', 'FAILED')).toBe(false);
    expect(canTransition('FAILED', 'PENDING_CONFIRM')).toBe(false);
  });

  it('rejects self transitions', () => {
    expect(canTransition('DRAFT', 'DRAFT')).toBe(false);
  });
});
