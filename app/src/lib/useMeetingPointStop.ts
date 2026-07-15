import { useEffect, useState } from 'react';
import type { Itinerary } from '@shared/status';
import type { TripStop } from '@shared/trip';
import { getTrip } from './api';
import { findMeetingPointStop } from './meetingPointStop';

export function useMeetingPointStop(itinerary: Itinerary | null): TripStop | null {
  const [stop, setStop] = useState<TripStop | null>(null);
  const tripId = itinerary?.tripId ?? null;
  const point = itinerary?.booking?.meeting_point;
  const name = point?.name;
  const lat = point?.lat;
  const lng = point?.lng;
  useEffect(() => {
    let cancelled = false;
    if (!tripId || name === undefined || lat === undefined || lng === undefined) {
      setStop(null);
      return;
    }
    getTrip(tripId)
      .then((trip) => {
        if (!cancelled) setStop(findMeetingPointStop(trip, { name, lat, lng }));
      })
      .catch(() => {
        if (!cancelled) setStop(null);
      });
    return () => {
      cancelled = true;
    };
  }, [tripId, name, lat, lng]);
  return stop;
}
