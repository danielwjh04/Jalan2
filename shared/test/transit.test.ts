import { describe, expect, it } from 'vitest';
import { buildTransitLinks } from '../src/transit';

const bakoJetty = { name: 'Bako jetty', lat: 1.7169, lng: 110.4462 };

describe('buildTransitLinks', () => {
  it('builds an EasyBook search URL for a known route with the date', () => {
    const links = buildTransitLinks(bakoJetty, '2026-07-12T08:00:00+08:00');
    expect(links.easybookUrl).toBe(
      'https://www.easybook.com/en-my/bus/search?from=Kuching&to=Bako&date=2026-07-12',
    );
  });

  it('omits the date param when no date is requested', () => {
    const links = buildTransitLinks(bakoJetty, null);
    expect(links.easybookUrl).toBe('https://www.easybook.com/en-my/bus/search?from=Kuching&to=Bako');
  });

  it('returns null EasyBook URL for places off the route table', () => {
    const links = buildTransitLinks({ name: 'Mulu airstrip', lat: 4.05, lng: 114.8 }, null);
    expect(links.easybookUrl).toBeNull();
  });

  it('always returns a Google Maps transit link to the coordinates', () => {
    const links = buildTransitLinks(bakoJetty, null);
    expect(links.mapsUrl).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=1.7169%2C110.4462&travelmode=transit',
    );
  });
});
