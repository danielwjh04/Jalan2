import type { MeetingPoint } from '@shared/transit';

// Known Kuching-area meeting points used to anchor fused coordinates against
// hallucination. Verify pins on a map during demo rehearsal before trusting
// them for navigation.
export const KUCHING_GAZETTEER: readonly MeetingPoint[] = [
  { name: 'Bako National Park jetty', lat: 1.7169, lng: 110.4462 },
  { name: 'Kuching Waterfront', lat: 1.5593, lng: 110.3439 },
  { name: 'Santubong jetty', lat: 1.7195, lng: 110.3178 },
  { name: 'Sematan beach', lat: 1.8065, lng: 109.7735 },
  { name: 'Telaga Air jetty', lat: 1.6884, lng: 110.1721 },
];
