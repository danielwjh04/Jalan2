import { randomUUID } from "node:crypto";
import type {
  CreateTripReservationRequest,
  ReservationPreview,
} from "@shared/reservation";
import type { MessagingProvider } from "../adapters/messaging/types";
import {
  setStoredReservationStatus,
  updateStoredReservation,
  type StoredReservationBatch,
  type StoredStopReservation,
} from "../store/tripReservations";

export function buildStoredReservationBatch(
  request: CreateTripReservationRequest,
  preview: ReservationPreview,
  operatorAddress: string | null,
): StoredReservationBatch {
  const id = randomUUID();
  const now = new Date().toISOString();
  const stops = preview.stops.map((stop): StoredStopReservation => ({
    id: randomUUID(),
    batchId: id,
    stopId: stop.stopId,
    reference: referenceId(),
    stopName: stop.stopName,
    imageUrl: stop.imageUrl,
    requestedStartISO: `${request.tripDate}T${request.requestedTimes[stop.stopId] ?? stop.suggestedTime}:00+08:00`,
    eligibility: stop.eligibility,
    status: stop.eligibility === "BOOKABLE" ? "PENDING_CONFIRM" : "SKIPPED",
    failureReason: null,
    messages: [],
    updatedAt: now,
    operatorAddress: stop.eligibility === "BOOKABLE" ? operatorAddress : null,
    sendAttemptedAt: null,
  }));
  return {
    id,
    clientRequestId: request.clientRequestId,
    tripId: request.tripId,
    tripDate: request.tripDate,
    pax: request.pax,
    stops,
    createdAt: now,
    updatedAt: now,
  };
}

export async function sendReservationRequest(
  messaging: MessagingProvider,
  batch: StoredReservationBatch,
  stop: StoredStopReservation,
): Promise<void> {
  const body = operatorMessage(batch, stop);
  updateStoredReservation(batch.id, stop.id, (item) => {
    item.sendAttemptedAt = new Date().toISOString();
  });
  try {
    await messaging.sendBookingRequest(stop.operatorAddress ?? "", body);
    updateStoredReservation(batch.id, stop.id, (item) => {
      item.messages.push({
        direction: "outbound",
        text: body,
        at: new Date().toISOString(),
      });
    });
  } catch (error) {
    setStoredReservationStatus(
      batch.id,
      stop.id,
      "FAILED",
      error instanceof Error ? error.message : "Messaging provider failed",
    );
  }
}

function operatorMessage(
  batch: StoredReservationBatch,
  stop: StoredStopReservation,
): string {
  return [
    `Hi! Jalan2 is checking availability for ${stop.stopName}:`,
    `- Date and time: ${stop.requestedStartISO}`,
    `- Guests: ${batch.pax}`,
    `- Reference: ${stop.reference}`,
    `Reply YES ${stop.reference} to confirm or NO ${stop.reference} to decline.`,
  ].join("\n");
}

function referenceId(): string {
  return `J2-${randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}
