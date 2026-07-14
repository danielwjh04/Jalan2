import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MessagingProvider } from "../src/adapters/messaging/types";
import { MOCK_OPERATOR_ADDRESS } from "../src/adapters/messaging/mock";
import { loadConfig } from "../src/config";
import {
  createTripReservations,
  handleTripReservationInbound,
  previewTripReservations,
} from "../src/services/tripReservations";
import { copyDiscoveryTrip, resetTrips, saveTrip } from "../src/store/trips";
import { resetTripReservations } from "../src/store/tripReservations";

const config = loadConfig({});

beforeEach(() => {
  resetTrips();
  resetTripReservations();
});

describe("trip reservation batches", () => {
  it("previews selected stops without sending", () => {
    const trip = copyDiscoveryTrip("melaka-river-and-heritage", "copy-1");
    const send = vi.fn();

    const preview = previewTripReservations(config, {
      tripId: trip.id,
      tripDate: "2026-07-20",
      pax: 2,
    });

    expect(send).not.toHaveBeenCalled();
    expect(preview.stops.map(({ eligibility }) => eligibility)).toContain(
      "BOOKABLE",
    );
    expect(preview.stops.map(({ eligibility }) => eligibility)).toContain(
      "WALK_IN",
    );
    expect(
      preview.stops.every(({ suggestedTime }) =>
        /^\d{2}:\d{2}$/.test(suggestedTime),
      ),
    ).toBe(true);
  });

  it("sends each bookable stop once and hides destinations", async () => {
    const trip = copyDiscoveryTrip("melaka-river-and-heritage", "copy-1");
    const bodies: string[] = [];
    const messaging = provider(async (_to, body) => {
      bodies.push(body);
      return { messageId: "message-1" };
    });
    const preview = previewTripReservations(config, {
      tripId: trip.id,
      tripDate: "2026-07-20",
      pax: 2,
    });
    const request = requestFor(
      trip.id,
      preview.stops.map(({ stopId, suggestedTime }) => [stopId, suggestedTime]),
    );

    const first = await createTripReservations(messaging, config, request);
    const retried = await createTripReservations(messaging, config, request);

    expect(first.id).toBe(retried.id);
    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toMatch(/YES J2-[A-Z0-9]+/);
    expect(JSON.stringify(first)).not.toMatch(/mock:operator|operatorAddress/);
  });

  it("keeps a provider failure local to one stop", async () => {
    const source = copyDiscoveryTrip("melaka-river-and-heritage", "copy-1");
    const trip = saveTrip({
      ...source,
      stops: source.stops.map((stop) => ({
        ...stop,
        reservation_hint: "bookable" as const,
      })),
    });
    let attempts = 0;
    const messaging = provider(async () => {
      attempts += 1;
      if (attempts === 2) throw new Error("provider unavailable");
      return { messageId: `message-${attempts}` };
    });
    const preview = previewTripReservations(config, {
      tripId: trip.id,
      tripDate: "2026-07-20",
      pax: 2,
    });

    const batch = await createTripReservations(
      messaging,
      config,
      requestFor(
        trip.id,
        preview.stops.map(({ stopId, suggestedTime }) => [
          stopId,
          suggestedTime,
        ]),
      ),
    );

    expect(batch.counts.waiting).toBe(3);
    expect(batch.counts.failed).toBe(1);
  });

  it("correlates YES and NO by reference and sender", async () => {
    const trip = copyDiscoveryTrip("melaka-river-and-heritage", "copy-1");
    const preview = previewTripReservations(config, {
      tripId: trip.id,
      tripDate: "2026-07-20",
      pax: 2,
    });
    const batch = await createTripReservations(
      provider(),
      config,
      requestFor(
        trip.id,
        preview.stops.map(({ stopId, suggestedTime }) => [
          stopId,
          suggestedTime,
        ]),
      ),
    );
    const pending = batch.stops.find(
      ({ status }) => status === "PENDING_CONFIRM",
    );
    if (!pending) throw new Error("Missing pending reservation");

    expect(
      handleTripReservationInbound({
        from: "mock:wrong",
        text: `YES ${pending.reference}`,
      }),
    ).toBeNull();
    expect(
      handleTripReservationInbound({
        from: MOCK_OPERATOR_ADDRESS,
        text: `NO ${pending.reference}`,
      })?.status,
    ).toBe("DECLINED");
    expect(
      handleTripReservationInbound({
        from: MOCK_OPERATOR_ADDRESS,
        text: `YES ${pending.reference}`,
      })?.status,
    ).toBe("DECLINED");
  });

  it("rejects an immutable curated template", () => {
    expect(() =>
      previewTripReservations(config, {
        tripId: "melaka-river-and-heritage",
        tripDate: "2026-07-20",
        pax: 2,
      }),
    ).toThrow(/add this discovery/i);
  });
});

function provider(
  send: MessagingProvider["sendBookingRequest"] = async () => ({
    messageId: "message-1",
  }),
): MessagingProvider {
  return { name: "mock", sendBookingRequest: send };
}

function requestFor(tripId: string, times: [string, string][]) {
  return {
    tripId,
    tripDate: "2026-07-20",
    pax: 2,
    clientRequestId: "reserve-1",
    requestedTimes: Object.fromEntries(times),
  };
}
