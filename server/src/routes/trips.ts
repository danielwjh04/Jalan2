import { Router } from "express";
import type { TripPlan, TripStop } from "@shared/trip";
import { createOfflineRouting } from "../adapters/routing/offline";
import type { RoutingProvider } from "../adapters/routing/types";
import { loadCachedTrip } from "../lib/fixtures";

function selectedStops(trip: TripPlan, ids: string[]): TripStop[] {
  if (ids.length < 2 || new Set(ids).size !== ids.length) {
    throw new Error("Choose at least two unique stops");
  }
  const byId = new Map(trip.stops.map((stop) => [stop.id, stop]));
  return ids.map((id) => {
    const stop = byId.get(id);
    if (!stop) throw new Error(`Unknown stop ${id}`);
    return stop;
  });
}

export async function optimizePreparedTrip(
  trip: TripPlan,
  ids: string[],
  routing: RoutingProvider,
): Promise<TripPlan> {
  const stops = selectedStops(trip, ids);
  let route;
  try {
    route = await routing.optimize(stops, ids[0]);
  } catch {
    route = await createOfflineRouting().optimize(stops, ids[0]);
  }
  return { ...trip, selected_stop_ids: route.ordered_stop_ids, route };
}

export function tripsRouter(routing: RoutingProvider): Router {
  const router = Router();
  router.get("/trips/:id", (req, res) => {
    const trip = loadCachedTrip(req.params.id);
    if (!trip) res.status(404).json({ error: `Unknown trip ${req.params.id}` });
    else res.json(trip);
  });
  router.post("/trips/:id/optimize", async (req, res) => {
    const trip = loadCachedTrip(req.params.id);
    if (!trip) {
      res.status(404).json({ error: `Unknown trip ${req.params.id}` });
      return;
    }
    const ids = Array.isArray(req.body?.stopIds) ? req.body.stopIds : [];
    try {
      res.json(await optimizePreparedTrip(trip, ids, routing));
    } catch (error) {
      res
        .status(400)
        .json({
          error: error instanceof Error ? error.message : "Invalid stops",
        });
    }
  });
  return router;
}
