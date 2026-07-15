import { haversineMeters, type TripPlan, type TripStop } from '@shared/trip';
import type { MeetingPoint } from '@shared/transit';

const MATCH_RADIUS_METERS = 500;

// The booking meeting point carries no place_id, but the trip built from the
// same video usually contains the identical stop with photos attached.
export function findMeetingPointStop(
  trip: Pick<TripPlan, 'stops'> | null,
  point: MeetingPoint,
): TripStop | null {
  if (!trip) return null;
  const byName = trip.stops.find((stop) => normalize(stop.name) === normalize(point.name));
  if (byName) return byName;
  let nearest: TripStop | null = null;
  let nearestDistance = MATCH_RADIUS_METERS;
  for (const stop of trip.stops) {
    const distance = haversineMeters(stop.location, { lat: point.lat, lng: point.lng });
    if (distance <= nearestDistance) {
      nearest = stop;
      nearestDistance = distance;
    }
  }
  return nearest;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
