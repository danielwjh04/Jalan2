export interface MeetingPoint {
  name: string;
  lat: number;
  lng: number;
}

export interface TransitLinks {
  easybookUrl: string | null;
  mapsUrl: string;
}

export function buildTransitLinks(point: MeetingPoint): TransitLinks {
  return {
    easybookUrl: null,
    mapsUrl: buildMapsUrl(point),
  };
}

function buildMapsUrl(point: MeetingPoint): string {
  const destination = `${point.lat},${point.lng}`;
  const params = new URLSearchParams({ api: '1', destination, travelmode: 'transit' });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
