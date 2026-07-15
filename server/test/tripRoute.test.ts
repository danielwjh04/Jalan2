import { describe, expect, it, vi } from "vitest";
import { normalizeVideoUrl } from "@shared/videoUrl";
import type { PlaceCandidate } from "@shared/trip";
import type { RoutingProvider } from "../src/adapters/routing/types";
import {
  createPreparedTripBooking,
  preparedTripForUrl,
} from "../src/routes/ingest";
import { customStop, optimizePreparedTrip } from "../src/routes/trips";
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
    expect(trip?.stops).toHaveLength(4);
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
        ordered_stop_ids: [preferences.start_stop_id ?? "waterfront", "cat-statue", "borneo-museum"],
        distance_meters: 1200,
        duration_minutes: 9,
        path: trip.stops.map((stop) => stop.location),
        provider: "offline",
      }),
    };
    const result = await optimizePreparedTrip(
      trip,
      ["waterfront", "borneo-museum", "cat-statue"],
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

  it("uses the trip region as the transit origin for an added stop", async () => {
    const place: PlaceCandidate = {
      place_id: "concubine-lane",
      name: "Concubine Lane",
      address: "Ipoh, Perak, Malaysia",
      location: { lat: 4.5975, lng: 101.0764 },
      google_maps_url: "https://maps.google.com/?cid=1",
      opening_window: null,
      suggested_activity: "Walk the heritage lane and try local snacks.",
      place_photo_available: true,
      place_photo_attributions: [],
      image_url: null,
      image_attributions: [],
    };
    const findRoute = vi.fn(async () => "https://www.easybook.com/ipoh-route");

    const stop = await customStop(place, "Ipoh, Perak", findRoute);

    expect(findRoute).toHaveBeenCalledWith("Ipoh", "Concubine Lane");
    expect(stop.easybook_url).toContain("ipoh-route");
  });
});
