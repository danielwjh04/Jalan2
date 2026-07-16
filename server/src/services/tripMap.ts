import type { TripStop } from '@shared/trip';

const MAX_MAP_STOPS = 15;

export function buildGoogleStaticTripMapUrl(
  apiKey: string,
  stops: TripStop[],
): string {
  const mapped = stops.filter(hasValidLocation).slice(0, MAX_MAP_STOPS);
  if (mapped.length === 0) throw new Error('A map needs at least one located stop');

  const url = new URL('https://maps.googleapis.com/maps/api/staticmap');
  url.searchParams.set('size', '640x390');
  url.searchParams.set('scale', '2');
  url.searchParams.set('format', 'png');
  url.searchParams.set('maptype', 'roadmap');
  url.searchParams.set('language', 'en');
  url.searchParams.set('region', 'MY');
  url.searchParams.set('key', apiKey);

  if (mapped.length > 1) {
    const coordinates = mapped.map(coordinate).join('|');
    url.searchParams.append('path', `color:0x52705Eff|weight:5|geodesic:true|${coordinates}`);
  }
  mapped.forEach((stop, index) => {
    const color = index === 0 ? '0xD14B3F' : '0x52705E';
    const label = markerLabel(index);
    url.searchParams.append('markers', `color:${color}|label:${label}|${coordinate(stop)}`);
  });
  return url.toString();
}

export function selectTripMapStops(stops: TripStop[], ids: string[]): TripStop[] {
  if (ids.length === 0) return stops.filter(hasValidLocation).slice(0, MAX_MAP_STOPS);
  if (ids.length > MAX_MAP_STOPS || new Set(ids).size !== ids.length) {
    throw new Error(`Choose between 1 and ${MAX_MAP_STOPS} unique stops`);
  }
  const byId = new Map(stops.map((stop) => [stop.id, stop]));
  return ids.map((id) => {
    const stop = byId.get(id);
    if (!stop || !hasValidLocation(stop)) throw new Error(`Unknown map stop ${id}`);
    return stop;
  });
}

function hasValidLocation(stop: TripStop): boolean {
  return Number.isFinite(stop.location.lat) && Number.isFinite(stop.location.lng)
    && Math.abs(stop.location.lat) <= 90 && Math.abs(stop.location.lng) <= 180;
}

function coordinate(stop: TripStop): string {
  return `${stop.location.lat},${stop.location.lng}`;
}

function markerLabel(index: number): string {
  return index < 9 ? String(index + 1) : String.fromCharCode(65 + index - 9);
}
