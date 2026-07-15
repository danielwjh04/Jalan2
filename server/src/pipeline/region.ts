import { haversineMeters, type GeoPoint } from '@shared/trip';

export const MALAYSIA_BOUNDS = { latMin: 0.8, latMax: 7.5, lngMin: 99.6, lngMax: 119.3 };

interface RegionAnchor extends GeoPoint {
  city: string;
  state: string;
}

// Nearest-anchor lookup instead of state bounding boxes: peninsular state
// boxes overlap badly, and the label only drives display copy and Places
// query bias, so border-town imprecision is harmless.
const REGION_ANCHORS: readonly RegionAnchor[] = [
  { city: 'Kuching', state: 'Sarawak', lat: 1.5533, lng: 110.3592 },
  { city: 'Sibu', state: 'Sarawak', lat: 2.287, lng: 111.8305 },
  { city: 'Miri', state: 'Sarawak', lat: 4.3995, lng: 113.9914 },
  { city: 'Kota Kinabalu', state: 'Sabah', lat: 5.9788, lng: 116.0753 },
  { city: 'Sandakan', state: 'Sabah', lat: 5.8394, lng: 118.1172 },
  { city: 'Tawau', state: 'Sabah', lat: 4.2448, lng: 117.8911 },
  { city: 'Kuala Lumpur', state: 'Kuala Lumpur', lat: 3.139, lng: 101.6869 },
  { city: 'Shah Alam', state: 'Selangor', lat: 3.0733, lng: 101.5185 },
  { city: 'George Town', state: 'Penang', lat: 5.4141, lng: 100.3288 },
  { city: 'Ipoh', state: 'Perak', lat: 4.5975, lng: 101.0901 },
  { city: 'Johor Bahru', state: 'Johor', lat: 1.4927, lng: 103.7414 },
  { city: 'Malacca City', state: 'Malacca', lat: 2.1896, lng: 102.2501 },
  { city: 'Kuantan', state: 'Pahang', lat: 3.8077, lng: 103.326 },
  { city: 'Kota Bharu', state: 'Kelantan', lat: 6.1254, lng: 102.2381 },
  { city: 'Kuala Terengganu', state: 'Terengganu', lat: 5.3302, lng: 103.1408 },
  { city: 'Alor Setar', state: 'Kedah', lat: 6.1248, lng: 100.3678 },
  { city: 'Kangar', state: 'Perlis', lat: 6.4414, lng: 100.1986 },
  { city: 'Seremban', state: 'Negeri Sembilan', lat: 2.7259, lng: 101.9424 },
];

export function inMalaysiaBounds(point: GeoPoint): boolean {
  return (
    point.lat >= MALAYSIA_BOUNDS.latMin &&
    point.lat <= MALAYSIA_BOUNDS.latMax &&
    point.lng >= MALAYSIA_BOUNDS.lngMin &&
    point.lng <= MALAYSIA_BOUNDS.lngMax
  );
}

export function regionFromCoordinates(point: GeoPoint): string {
  if (!inMalaysiaBounds(point)) return 'Malaysia';
  let nearest = REGION_ANCHORS[0];
  let nearestDistance = Infinity;
  for (const anchor of REGION_ANCHORS) {
    const distance = haversineMeters(point, anchor);
    if (distance < nearestDistance) {
      nearest = anchor;
      nearestDistance = distance;
    }
  }
  return `${nearest.state}, Malaysia`;
}
