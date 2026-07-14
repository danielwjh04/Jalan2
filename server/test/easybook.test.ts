import { describe, expect, it, vi } from 'vitest';
import { findEasybookRoute, routePageMatches } from '../src/adapters/transit/easybook';

describe('EasyBook route validation', () => {
  it('accepts a page that contains both route cities', () => {
    expect(routePageMatches(
      'Depart Trip Kuching to Kota Kinabalu Choose Seats',
      'Kuching',
      'Kota Kinabalu',
    )).toBe(true);
  });

  it('rejects an unavailable route page', () => {
    expect(routePageMatches('EasyBook home page', 'Kuching', 'Bako')).toBe(false);
  });

  it('returns a handoff only after validating the official page', async () => {
    const fetcher = vi.fn(async () => new Response(
      'Depart Trip Kuching to Kota Kinabalu Choose Seats',
      { status: 200 },
    ));
    await expect(findEasybookRoute('Kuching', 'Kota Kinabalu', fetcher)).resolves.toBe(
      'https://www.easybook.com/en-my/bus/booking/kuching-to-kotakinabalu',
    );
  });
});
