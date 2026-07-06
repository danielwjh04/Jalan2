import { describe, expect, it } from 'vitest';
import { resolveBaseUrl } from '../src/lib/baseUrl';

describe('resolveBaseUrl', () => {
  it('uses EXPO_PUBLIC_API_BASE_URL when the primary API URL is absent', () => {
    expect(
      resolveBaseUrl({
        apiUrl: undefined,
        apiBaseUrl: 'http://192.168.1.23:3001',
        hostUri: 'localhost:8081',
      }),
    ).toBe('http://192.168.1.23:3001');
  });
});
