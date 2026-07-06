import type { MeetingPoint } from '@shared/transit';

export interface GazetteerPlace extends MeetingPoint {
  region: string;
}

// Known Kuching-area meeting points used to anchor fused coordinates against
// hallucination. Verify pins on a map during demo rehearsal before trusting
// them for navigation. Adding places for a new region here automatically
// updates the app's region labels.
export const KUCHING_GAZETTEER: readonly GazetteerPlace[] = [
  { name: 'Bako National Park jetty', lat: 1.7169, lng: 110.4462, region: 'Kuching' },
  { name: 'Kuching Waterfront', lat: 1.5593, lng: 110.3439, region: 'Kuching' },
  { name: 'Santubong jetty', lat: 1.7195, lng: 110.3178, region: 'Kuching' },
  { name: 'Sematan beach', lat: 1.8065, lng: 109.7735, region: 'Kuching' },
  { name: 'Telaga Air jetty', lat: 1.6884, lng: 110.1721, region: 'Kuching' },
];

export function regionForPlace(placeName: string): string | null {
  const normalized = placeName.trim().toLowerCase();
  const place = KUCHING_GAZETTEER.find((entry) => entry.name.toLowerCase() === normalized);
  return place?.region ?? null;
}
