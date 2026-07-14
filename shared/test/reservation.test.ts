import { describe, expect, it } from "vitest";
import {
  CreateTripReservationRequestSchema,
  TripReservationBatchSchema,
  reservationCounts,
} from "../src/reservation";

const stop = {
  id: "reservation-1",
  batchId: "batch-1",
  stopId: "stop-1",
  reference: "J2-K4P7",
  stopName: "Cheong Fatt Tze Mansion",
  imageUrl: null,
  requestedStartISO: "2026-07-16T10:00:00+08:00",
  eligibility: "BOOKABLE" as const,
  status: "PENDING_CONFIRM" as const,
  failureReason: null,
  messages: [],
  updatedAt: "2026-07-15T18:00:00.000Z",
};

describe("trip reservation contracts", () => {
  it("accepts a mixed reservation batch and derives counts", () => {
    const stops = [
      stop,
      {
        ...stop,
        id: "reservation-2",
        stopId: "stop-2",
        reference: "J2-M8L2",
        eligibility: "WALK_IN" as const,
        status: "SKIPPED" as const,
      },
    ];
    const parsed = TripReservationBatchSchema.parse({
      id: "batch-1",
      clientRequestId: "request-1",
      tripId: "trip-1",
      tripDate: "2026-07-16",
      pax: 2,
      stops,
      counts: reservationCounts(stops),
      createdAt: "2026-07-15T18:00:00.000Z",
      updatedAt: "2026-07-15T18:00:00.000Z",
    });

    expect(parsed.counts).toEqual({
      confirmed: 0,
      waiting: 1,
      declined: 0,
      failed: 0,
      walkIn: 1,
      contactUnavailable: 0,
    });
  });

  it("rejects invalid dates, times, and duplicate stop ids", () => {
    expect(
      CreateTripReservationRequestSchema.safeParse({
        tripId: "trip-1",
        tripDate: "2026-02-30",
        pax: 2,
        clientRequestId: "request-1",
        requestedTimes: { "stop-1": "25:00" },
      }).success,
    ).toBe(false);

    const duplicate = { ...stop, id: "reservation-2", reference: "J2-M8L2" };
    expect(
      TripReservationBatchSchema.safeParse({
        id: "batch-1",
        clientRequestId: "request-1",
        tripId: "trip-1",
        tripDate: "2026-07-16",
        pax: 2,
        stops: [stop, duplicate],
        counts: reservationCounts([stop, duplicate]),
        createdAt: "2026-07-15T18:00:00.000Z",
        updatedAt: "2026-07-15T18:00:00.000Z",
      }).success,
    ).toBe(false);
  });
});
