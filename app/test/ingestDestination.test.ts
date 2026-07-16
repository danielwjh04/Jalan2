import { describe, expect, it } from "vitest";
import { ingestDestination } from "../src/lib/ingestDestination";

describe("ingestDestination", () => {
  it("carries the booking itinerary into a prepared trip route", () => {
    expect(
      ingestDestination({
        kind: "trip",
        id: "kuching-city-guide-01",
        bookingId: "booking-123",
      }),
    ).toBe("/trip/kuching-city-guide-01?bookingId=booking-123");
  });

  it("marks ordinary link bookings to continue into the generated guide", () => {
    expect(ingestDestination({ kind: "booking", id: "booking-456" })).toBe(
      "/itinerary/booking-456?view=guide",
    );
  });
});
