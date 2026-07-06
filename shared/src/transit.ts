export interface MeetingPoint {
  name: string;
  lat: number;
  lng: number;
}

export interface TransitLinks {
  easybookUrl: string | null;
  mapsUrl: string;
}

interface EasybookRoute {
  match: RegExp;
  origin: string;
  destination: string;
}

// Kuching-origin routes EasyBook actually serves. Anything off this table
// falls through to the Google Maps transit link, which always resolves.
const EASYBOOK_ROUTES: readonly EasybookRoute[] = [
  { match: /bako/i, origin: 'Kuching', destination: 'Bako' },
  { match: /santubong/i, origin: 'Kuching', destination: 'Santubong' },
  { match: /sematan/i, origin: 'Kuching', destination: 'Sematan' },
  { match: /lundu/i, origin: 'Kuching', destination: 'Lundu' },
  { match: /telaga air/i, origin: 'Kuching', destination: 'Telaga Air' },
];

export function buildTransitLinks(point: MeetingPoint): TransitLinks {
  return {
    easybookUrl: buildEasybookUrl(point.name),
    mapsUrl: buildMapsUrl(point),
  };
}

// EasyBook uses SEO route pages (/bus/booking/kuching-to-sematan), not query
// params. Names are lowercased with spaces removed, matching their site.
function buildEasybookUrl(placeName: string): string | null {
  const route = EASYBOOK_ROUTES.find((r) => r.match.test(placeName));
  if (!route) return null;
  const slug = `${citySlug(route.origin)}-to-${citySlug(route.destination)}`;
  return `https://www.easybook.com/en-my/bus/booking/${slug}`;
}

function citySlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '');
}

function buildMapsUrl(point: MeetingPoint): string {
  const destination = `${point.lat},${point.lng}`;
  const params = new URLSearchParams({ api: '1', destination, travelmode: 'transit' });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
