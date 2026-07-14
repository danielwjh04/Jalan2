import { describe, expect, it } from 'vitest';
import { buildTransitLinks } from '../src/transit';

const bakoJetty = { name: 'Bako jetty', lat: 1.7169, lng: 110.4462 };

describe('buildTransitLinks', () => {
  it('does not invent an EasyBook route from a meeting-point name', () => {
    const links = buildTransitLinks(bakoJetty);
    expect(links.easybookUrl).toBeNull();
  });

  it('leaves route validation to the server provider', () => {
    const links = buildTransitLinks({ name: 'Telaga Air jetty', lat: 1.6884, lng: 110.1721 });
    expect(links.easybookUrl).toBeNull();
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
