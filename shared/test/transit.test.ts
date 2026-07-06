import { describe, expect, it } from 'vitest';
import { buildTransitLinks } from '../src/transit';

const bakoJetty = { name: 'Bako jetty', lat: 1.7169, lng: 110.4462 };

describe('buildTransitLinks', () => {
  it('builds an EasyBook route page URL for a known route', () => {
    const links = buildTransitLinks(bakoJetty);
    expect(links.easybookUrl).toBe('https://www.easybook.com/en-my/bus/booking/kuching-to-bako');
  });

  it('lowercases and strips spaces from multi-word places', () => {
    const links = buildTransitLinks({ name: 'Telaga Air jetty', lat: 1.6884, lng: 110.1721 });
    expect(links.easybookUrl).toBe(
      'https://www.easybook.com/en-my/bus/booking/kuching-to-telagaair',
    );
  });

  it('returns null EasyBook URL for places off the route table', () => {
    const links = buildTransitLinks({ name: 'Mulu airstrip', lat: 4.05, lng: 114.8 });
    expect(links.easybookUrl).toBeNull();
  });

  it('always returns a Google Maps transit link to the coordinates', () => {
    const links = buildTransitLinks(bakoJetty);
    expect(links.mapsUrl).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=1.7169%2C110.4462&travelmode=transit',
    );
  });
});
