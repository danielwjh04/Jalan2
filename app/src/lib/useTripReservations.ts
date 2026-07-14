import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ReservationPreview,
  TripReservationBatch,
} from "@shared/reservation";
import type { TripPlan } from "@shared/trip";
import {
  createTripReservations,
  getCurrentTripReservation,
  getTripReservation,
  previewTripReservations,
} from "./api";
import {
  nextMalaysiaDates,
  validReservationTime,
} from "./reservationPresentation";

export interface TripReservationState {
  dates: string[];
  tripDate: string;
  pax: number;
  preview: ReservationPreview | null;
  batch: TripReservationBatch | null;
  times: Record<string, string>;
  busy: boolean;
  error: string | null;
  setTripDate: (date: string) => void;
  setPax: (pax: number) => void;
  setTime: (stopId: string, time: string) => void;
  review: () => Promise<void>;
  send: () => Promise<void>;
}

export function useTripReservations(trip: TripPlan): TripReservationState {
  const dates = useRef(nextMalaysiaDates()).current;
  const [tripDate, setTripDate] = useState(dates[0]);
  const [pax, setPax] = useState(2);
  const [preview, setPreview] = useState<ReservationPreview | null>(null);
  const [batch, setBatch] = useState<TripReservationBatch | null>(null);
  const [times, setTimes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(newRequestId()).current;
  const restore = useCallback(async (): Promise<void> => {
    try {
      setBatch(await getCurrentTripReservation(trip.id));
    } catch (reason) {
      if (!isMissing(reason)) setError(errorMessage(reason));
    }
  }, [trip.id]);
  useEffect(() => {
    void restore();
  }, [restore]);
  useEffect(() => {
    if (!batch || batch.counts.waiting === 0) return;
    const timer = setInterval(() => {
      void getTripReservation(batch.id)
        .then(setBatch)
        .catch((reason) => setError(errorMessage(reason)));
    }, 2_000);
    return () => clearInterval(timer);
  }, [batch?.id, batch?.counts.waiting]);
  const review = async (): Promise<void> =>
    run(setBusy, setError, async () => {
      const result = await previewTripReservations({
        tripId: trip.id,
        tripDate,
        pax,
      });
      setPreview(result);
      setTimes(
        Object.fromEntries(
          result.stops.map((stop) => [stop.stopId, stop.suggestedTime]),
        ),
      );
    });
  const send = async (): Promise<void> =>
    run(setBusy, setError, async () => {
      if (!preview || !Object.values(times).every(validReservationTime)) {
        throw new Error("Use a valid 24-hour time for every stop");
      }
      setBatch(
        await createTripReservations({
          tripId: trip.id,
          tripDate,
          pax,
          clientRequestId: requestId,
          requestedTimes: times,
        }),
      );
    });
  return {
    dates,
    tripDate,
    pax,
    preview,
    batch,
    times,
    busy,
    error,
    setTripDate,
    setPax,
    setTime: (id, time) => setTimes((current) => ({ ...current, [id]: time })),
    review,
    send,
  };
}

async function run(
  setBusy: (value: boolean) => void,
  setError: (value: string | null) => void,
  action: () => Promise<void>,
): Promise<void> {
  setBusy(true);
  setError(null);
  try {
    await action();
  } catch (reason) {
    setError(errorMessage(reason));
  } finally {
    setBusy(false);
  }
}

function newRequestId(): string {
  return `reserve-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function errorMessage(reason: unknown): string {
  return reason instanceof Error
    ? reason.message
    : "Reservation request failed";
}

function isMissing(reason: unknown): boolean {
  return errorMessage(reason).startsWith("No reservation found");
}
