import { Router } from "express";
import {
  CreateTripReservationRequestSchema,
  ReservationPreviewRequestSchema,
} from "@shared/reservation";
import type { MessagingProvider } from "../adapters/messaging/types";
import type { Config } from "../config";
import {
  createTripReservations,
  currentReservationBatch,
  getReservationBatch,
  previewTripReservations,
} from "../services/tripReservations";

export function tripReservationsRouter(
  messaging: MessagingProvider,
  config: Config,
): Router {
  const router = Router();
  router.post("/trip-reservations/preview", (req, res) => {
    const input = ReservationPreviewRequestSchema.safeParse(req.body);
    if (!input.success) return invalid(res, "Invalid reservation preview");
    try {
      res.json(previewTripReservations(config, input.data));
    } catch (error) {
      conflict(res, error);
    }
  });
  router.post("/trip-reservations", async (req, res) => {
    const input = CreateTripReservationRequestSchema.safeParse(req.body);
    if (!input.success) return invalid(res, "Invalid reservation request");
    try {
      res.json(await createTripReservations(messaging, config, input.data));
    } catch (error) {
      conflict(res, error);
    }
  });
  router.get("/trip-reservations/current", (req, res) => {
    const tripId = typeof req.query.tripId === "string" ? req.query.tripId : "";
    if (!tripId) return invalid(res, "tripId is required");
    const batch = currentReservationBatch(tripId);
    if (!batch) return notFound(res, "No reservation found for this trip");
    res.json(batch);
  });
  router.get("/trip-reservations/:id", (req, res) => {
    const batch = getReservationBatch(req.params.id);
    if (!batch) return notFound(res, `Unknown reservation ${req.params.id}`);
    res.json(batch);
  });
  return router;
}

type JsonResponse = {
  status(code: number): { json(body: { error: string }): void };
};

function invalid(response: JsonResponse, message: string): void {
  response.status(400).json({ error: message });
}

function notFound(response: JsonResponse, message: string): void {
  response.status(404).json({ error: message });
}

function conflict(response: JsonResponse, error: unknown): void {
  response.status(409).json({
    error:
      error instanceof Error ? error.message : "Reservation request failed",
  });
}
