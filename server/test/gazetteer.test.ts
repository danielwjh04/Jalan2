import { describe, expect, it } from 'vitest';
import { regionForPlace } from '../src/pipeline/gazetteer';

describe('regionForPlace', () => {
  it('resolves a gazetteer place to its region', () => {
    expect(regionForPlace('Bako National Park jetty')).toBe('Kuching');
  });

  it('matches case-insensitively with surrounding whitespace', () => {
    expect(regionForPlace('  kuching waterfront ')).toBe('Kuching');
  });

  it('returns null for places off the gazetteer', () => {
    expect(regionForPlace('Mulu airstrip')).toBeNull();
  });
});
