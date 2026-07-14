import { describe, expect, it } from "vitest";
import { normalizeVideoUrl } from "@shared/videoUrl";
import type { RoutingProvider } from "../src/adapters/routing/types";
import {
  createPreparedTripBooking,
  preparedTripForUrl,
} from "../src/routes/ingest";
import { optimizePreparedTrip } from "../src/routes/trips";
import { resetItineraries } from "../src/store/itineraries";

describe("prepared trips", () => {
  function cityTrip() {
    const normalized = normalizeVideoUrl("https://vt.tiktok.com/ZSCt5cY1k/");
    return preparedTripForUrl(normalized?.url ?? "");
  }

  it("routes a prepared link to its multi-stop trip", () => {
    const normalized = normalizeVideoUrl("https://vt.tiktok.com/ZSCt5cY1k/");
    expect(normalized).not.toBeNull();
    const trip = preparedTripForUrl(normalized?.url ?? "");
    expect(trip?.id).toBe("kuching-city-guide-01");
    expect(trip?.stops).toHaveLength(3);
  });

  it("creates a ready booking itinerary for the prepared trip", () => {
    resetItineraries();
    const normalized = normalizeVideoUrl("https://vt.tiktok.com/ZSCt5cY1k/");
    if (!normalized) throw new Error("Test URL did not normalize");
    const prepared = createPreparedTripBooking(normalized.url);
    expect(prepared?.trip.id).toBe("kuching-city-guide-01");
    expect(prepared?.itinerary.stage).toBe("READY");
    expect(prepared?.itinerary.status).toBe("DRAFT");
    expect(prepared?.itinerary.booking?.operator_name).toBe("Wanka Travel");
  });

  it("keeps the first selected stop fixed during optimization", async () => {
    const trip = cityTrip();
    if (!trip) throw new Error("Missing test trip");
    const routing: RoutingProvider = {
      name: "offline",
      optimize: async (_stops, preferences) => ({
        ordered_stop_ids: [preferences.start_stop_id ?? "waterfront", "topspot", "borneo-museum"],
        distance_meters: 1200,
        duration_minutes: 9,
        path: trip.stops.map((stop) => stop.location),
        provider: "offline",
      }),
    };
    const result = await optimizePreparedTrip(
      trip,
      ["waterfront", "borneo-museum", "topspot"],
      routing,
    );
    expect(result.selected_stop_ids[0]).toBe("waterfront");
  });

  it("falls back offline when Google routing fails", async () => {
    const trip = cityTrip();
    if (!trip) throw new Error("Missing test trip");
    const failing: RoutingProvider = {
      name: "google",
      optimize: async () => {
        throw new Error("network unavailable");
      },
    };
    const result = await optimizePreparedTrip(
      trip,
      trip.selected_stop_ids,
      failing,
    );
    expect(result.route?.provider).toBe("offline");
  });
});
