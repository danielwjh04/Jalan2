import {
  TripReservationBatchSchema,
  reservationCounts,
  type ReservationStatus,
  type TripReservationBatch,
  type TripStopReservation,
} from "@shared/reservation";

export interface StoredStopReservation extends TripStopReservation {
  operatorAddress: string | null;
  sendAttemptedAt: string | null;
}

export interface StoredReservationBatch {
  id: string;
  clientRequestId: string;
  tripId: string;
  tripDate: string;
  pax: number;
  stops: StoredStopReservation[];
  createdAt: string;
  updatedAt: string;
}

const batches = new Map<string, StoredReservationBatch>();
const batchIdsByRequest = new Map<string, string>();

export function storeReservationBatch(
  batch: StoredReservationBatch,
): TripReservationBatch {
  batches.set(batch.id, batch);
  batchIdsByRequest.set(batch.clientRequestId, batch.id);
  return toPublicBatch(batch);
}

export function reservationBatchByRequest(
  clientRequestId: string,
): TripReservationBatch | null {
  const id = batchIdsByRequest.get(clientRequestId);
  return id ? getReservationBatch(id) : null;
}

export function getReservationBatch(id: string): TripReservationBatch | null {
  const batch = batches.get(id);
  return batch ? toPublicBatch(batch) : null;
}

export function currentReservationBatch(
  tripId: string,
): TripReservationBatch | null {
  const batch = [...batches.values()]
    .filter((candidate) => candidate.tripId === tripId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  return batch ? toPublicBatch(batch) : null;
}

export function storedReservationByReference(
  reference: string,
): { batch: StoredReservationBatch; stop: StoredStopReservation } | null {
  for (const batch of batches.values()) {
    const stop = batch.stops.find(
      (candidate) => candidate.reference === reference,
    );
    if (stop) return { batch, stop };
  }
  return null;
}

export function updateStoredReservation(
  batchId: string,
  stopId: string,
  update: (stop: StoredStopReservation) => void,
): TripStopReservation {
  const batch = batches.get(batchId);
  if (!batch) throw new Error(`Unknown reservation batch ${batchId}`);
  const stop = batch.stops.find((candidate) => candidate.id === stopId);
  if (!stop) throw new Error(`Unknown stop reservation ${stopId}`);
  update(stop);
  const now = new Date().toISOString();
  stop.updatedAt = now;
  batch.updatedAt = now;
  return toPublicStop(stop);
}

export function setStoredReservationStatus(
  batchId: string,
  stopId: string,
  status: ReservationStatus,
  failureReason: string | null = null,
): TripStopReservation {
  return updateStoredReservation(batchId, stopId, (stop) => {
    stop.status = status;
    stop.failureReason = failureReason;
  });
}

export function resetTripReservations(): void {
  batches.clear();
  batchIdsByRequest.clear();
}

export function toPublicStop(stop: StoredStopReservation): TripStopReservation {
  const {
    operatorAddress: _operatorAddress,
    sendAttemptedAt: _sendAttemptedAt,
    ...value
  } = stop;
  return value;
}

function toPublicBatch(batch: StoredReservationBatch): TripReservationBatch {
  const stops = batch.stops.map(toPublicStop);
  return TripReservationBatchSchema.parse({
    ...batch,
    stops,
    counts: reservationCounts(stops),
  });
}
