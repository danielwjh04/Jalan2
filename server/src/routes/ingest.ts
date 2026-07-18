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
import { resolveVideoShareUrl } from "../lib/videoRedirect";
import { runPipeline, type PipelineDeps } from "../pipeline/run";
import { createItinerary, setBooking, setStage, setTripId } from "../store/itineraries";

interface PreparedTripBooking {
  trip: TripPlan;
  itinerary: Itinerary;
}

export function ingestRouter(deps: PipelineDeps): Router {
  const router = Router();
  router.post("/ingest", async (req, res) => {
    const raw = typeof req.body?.url === "string" ? req.body.url : "";
    const normalized = normalizeVideoUrl(raw);
    if (!normalized) {
      res
        .status(400)
        .json({ error: "Body must include url containing a video link" });
      return;
    }
    const sourceUrl = await resolveVideoShareUrl(normalized.url);
    if (sourceUrl !== normalized.url) {
      console.info(`[ingest] resolved ${normalized.url} -> ${sourceUrl}`);
    }
    // Explicit local live runs bypass the stage fixture. In production/demo
    // the same URL remains deterministic unless the caller opts in to the
    // Docker-backed extractor with { mode: "live" }.
    const forceLive = req.body?.mode === "live";
    const prepared = forceLive ? null : createPreparedTripBooking(sourceUrl);
    if (prepared) {
      res.json({
        id: prepared.trip.id,
        kind: "trip",
        bookingId: prepared.itinerary.id,
      });
      return;
    }
    // Keep the rotating share URL for live XHS extraction. It carries the
    // access context that some downloaders need; the resolved stable ID above
    // is only for fixture/cache lookup.
    const pipelineUrl = livePipelineUrl(normalized.url, sourceUrl);
    const itinerary = createItinerary(
      pipelineUrl,
      coverUrlFor(resolveFixtureSlug(sourceUrl)),
    );
    void runPipeline(deps, itinerary.id, pipelineUrl);
    res.status(202).json({ id: itinerary.id, kind: "booking" });
  });
  return router;
}

export function livePipelineUrl(original: string, resolved: string): string {
  return new URL(original).hostname === 'xhslink.com' ? original : resolved;
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
  setTripId(itinerary.id, trip.id);
  setStage(itinerary.id, "READY");
  return { trip, itinerary };
}
