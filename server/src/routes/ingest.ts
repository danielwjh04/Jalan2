import { Router } from "express";
import { normalizeVideoUrl } from "@shared/videoUrl";
import type { TripPlan } from "@shared/trip";
import type { Itinerary } from "@shared/status";
import {
  coverUrlFor,
  loadCachedBooking,
  loadCachedTrip,
  resolveFixtureSlug,
} from "../lib/fixtures";
import { runPipeline, type PipelineDeps } from "../pipeline/run";
import { createItinerary, setBooking, setStage } from "../store/itineraries";

interface PreparedTripBooking {
  trip: TripPlan;
  itinerary: Itinerary;
}

export function ingestRouter(deps: PipelineDeps): Router {
  const router = Router();
  router.post("/ingest", (req, res) => {
    const raw = typeof req.body?.url === "string" ? req.body.url : "";
    const normalized = normalizeVideoUrl(raw);
    if (!normalized) {
      res
        .status(400)
        .json({ error: "Body must include url containing a video link" });
      return;
    }
    const prepared = createPreparedTripBooking(normalized.url);
    if (prepared) {
      res.json({
        id: prepared.trip.id,
        kind: "trip",
        bookingId: prepared.itinerary.id,
      });
      return;
    }
    const itinerary = createItinerary(
      normalized.url,
      coverUrlFor(resolveFixtureSlug(normalized.url)),
    );
    void runPipeline(deps, itinerary.id, normalized.url);
    res.status(202).json({ id: itinerary.id, kind: "booking" });
  });
  return router;
}

export function preparedTripForUrl(normalizedUrl: string): TripPlan | null {
  const slug = resolveFixtureSlug(normalizedUrl);
  return slug ? loadCachedTrip(slug) : null;
}

export function createPreparedTripBooking(
  normalizedUrl: string,
): PreparedTripBooking | null {
  const slug = resolveFixtureSlug(normalizedUrl);
  if (!slug) return null;
  const trip = loadCachedTrip(slug);
  const booking = loadCachedBooking(slug);
  if (!trip || !booking) return null;
  const itinerary = createItinerary(normalizedUrl, coverUrlFor(slug));
  setBooking(itinerary.id, booking, "cache");
  setStage(itinerary.id, "READY");
  return { trip, itinerary };
}
