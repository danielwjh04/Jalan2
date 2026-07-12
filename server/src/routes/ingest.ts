import { Router } from "express";
import { normalizeVideoUrl } from "@shared/videoUrl";
import type { TripPlan } from "@shared/trip";
import {
  coverUrlFor,
  loadCachedTrip,
  resolveFixtureSlug,
} from "../lib/fixtures";
import { runPipeline, type PipelineDeps } from "../pipeline/run";
import { createItinerary } from "../store/itineraries";

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
    const trip = preparedTripForUrl(normalized.url);
    if (trip) {
      res.json({ id: trip.id, kind: "trip" });
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
