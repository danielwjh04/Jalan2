import {
  CreateTripReservationRequestSchema,
  ReservationPreviewRequestSchema,
  ReservationPreviewSchema,
  type CreateTripReservationRequest,
  type ReservationPreview,
  type ReservationPreviewRequest,
  type TripReservationBatch,
  type TripStopReservation,
} from "@shared/reservation";
import type { TripPlan, TripStop } from "@shared/trip";
import type {
  MessagingProvider,
  InboundMessage,
} from "../adapters/messaging/types";
import type { Config } from "../config";
import { operatorAddressFor } from "./booking";
import { reservationEligibility } from "./reservationEligibility";
import { getTrip } from "../store/trips";
import {
  currentReservationBatch,
  getReservationBatch,
  reservationBatchByRequest,
  setStoredReservationStatus,
  storedReservationByReference,
  storeReservationBatch,
  updateStoredReservation,
} from "../store/tripReservations";
import {
  buildStoredReservationBatch,
  sendReservationRequest,
} from "./tripReservationMessages";

export function previewTripReservations(
  config: Config,
  input: ReservationPreviewRequest,
): ReservationPreview {
  const request = ReservationPreviewRequestSchema.parse(input);
  const trip = editableTrip(request.tripId);
  const address = approvedAddress(config);
  let minute = trip.preferences?.day_start_minute ?? 540;
  const schedule = new Map(
    trip.route?.schedule?.map((visit) => [visit.stop_id, visit.arrival_minute]),
  );
  const stops = selectedStops(trip).map((stop) => {
    const suggestedMinute = schedule.get(stop.id) ?? minute;
    minute = suggestedMinute + stop.duration_minutes + 15;
    return {
      stopId: stop.id,
      stopName: stop.name,
      imageUrl: stop.image_url,
      eligibility: reservationEligibility(stop, Boolean(address)),
      suggestedTime: timeFor(suggestedMinute),
    };
  });
  return ReservationPreviewSchema.parse({ ...request, stops });
}

export async function createTripReservations(
  messaging: MessagingProvider,
  config: Config,
  input: CreateTripReservationRequest,
): Promise<TripReservationBatch> {
  const request = CreateTripReservationRequestSchema.parse(input);
  const existing = reservationBatchByRequest(request.clientRequestId);
  if (existing) return existing;
  const preview = previewTripReservations(config, request);
  if (!preview.stops.some(({ eligibility }) => eligibility === "BOOKABLE")) {
    throw new Error("This trip has no stops Jalan2 can reserve");
  }
  const batch = buildStoredReservationBatch(
    request,
    preview,
    approvedAddress(config),
  );
  storeReservationBatch(batch);
  for (const stop of batch.stops.filter(
    ({ eligibility }) => eligibility === "BOOKABLE",
  )) {
    await sendReservationRequest(messaging, batch, stop);
  }
  return getReservationBatch(batch.id) ?? failMissingBatch();
}

export function handleTripReservationInbound(
  message: InboundMessage,
): TripStopReservation | null {
  const reference = message.text
    .toUpperCase()
    .match(/\bJ2-[A-Z0-9]{4,8}\b/)?.[0];
  if (!reference) return null;
  const match = storedReservationByReference(reference);
  if (!match || match.stop.operatorAddress !== message.from) return null;
  const received = updateStoredReservation(
    match.batch.id,
    match.stop.id,
    (stop) => {
      stop.messages.push({
        direction: "inbound",
        text: message.text,
        at: new Date().toISOString(),
      });
    },
  );
  if (received.status !== "PENDING_CONFIRM") return received;
  if (/^\s*YES\b/i.test(message.text))
    return setStoredReservationStatus(
      match.batch.id,
      match.stop.id,
      "CONFIRMED",
    );
  if (/^\s*NO\b/i.test(message.text))
    return setStoredReservationStatus(
      match.batch.id,
      match.stop.id,
      "DECLINED",
    );
  return received;
}

export { currentReservationBatch, getReservationBatch };

function editableTrip(id: string): TripPlan {
  const trip = getTrip(id);
  if (!trip) throw new Error(`Unknown trip ${id}`);
  if (trip.origin === "curated")
    throw new Error("Add this discovery to Trips before reserving");
  return trip;
}

function selectedStops(trip: TripPlan): TripStop[] {
  const byId = new Map(trip.stops.map((stop) => [stop.id, stop]));
  return trip.selected_stop_ids
    .map((id) => byId.get(id))
    .filter((stop): stop is TripStop => Boolean(stop));
}

function approvedAddress(config: Config): string | null {
  try {
    return operatorAddressFor(config);
  } catch {
    return null;
  }
}

function timeFor(minutes: number): string {
  const normalized = minutes % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

function failMissingBatch(): never {
  throw new Error("Reservation batch was not stored");
}
