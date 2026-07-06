import { randomUUID } from 'node:crypto';
import type { BookingJson } from '@shared/booking';
import { canTransition } from '@shared/status';
import type {
  BookingRequest,
  Itinerary,
  ItineraryMessage,
  ItineraryStatus,
  PipelineStage,
} from '@shared/status';

const itineraries = new Map<string, Itinerary>();

export function createItinerary(sourceUrl: string, coverUrl: string | null = null): Itinerary {
  const now = new Date().toISOString();
  const itinerary: Itinerary = {
    id: randomUUID(),
    sourceUrl,
    coverUrl,
    status: 'DRAFT',
    stage: 'QUEUED',
    booking: null,
    servedFrom: null,
    requested: null,
    operatorAddress: null,
    messages: [],
    error: null,
    createdAt: now,
    updatedAt: now,
  };
  itineraries.set(itinerary.id, itinerary);
  return itinerary;
}

export function getItinerary(id: string): Itinerary | undefined {
  return itineraries.get(id);
}

export function allItineraries(): Itinerary[] {
  return [...itineraries.values()];
}

export function setStage(id: string, stage: PipelineStage): Itinerary {
  const itinerary = getOrThrow(id);
  itinerary.stage = stage;
  return touch(itinerary);
}

export function setBooking(
  id: string,
  booking: BookingJson,
  servedFrom: 'live' | 'cache',
): Itinerary {
  const itinerary = getOrThrow(id);
  itinerary.booking = booking;
  itinerary.servedFrom = servedFrom;
  return touch(itinerary);
}

export function setRequested(
  id: string,
  requested: BookingRequest,
  operatorAddress: string,
): Itinerary {
  const itinerary = getOrThrow(id);
  itinerary.requested = requested;
  itinerary.operatorAddress = operatorAddress;
  return touch(itinerary);
}

export function appendMessage(id: string, message: ItineraryMessage): Itinerary {
  const itinerary = getOrThrow(id);
  itinerary.messages.push(message);
  return touch(itinerary);
}

export function transition(id: string, to: ItineraryStatus): Itinerary {
  const itinerary = getOrThrow(id);
  if (!canTransition(itinerary.status, to)) {
    throw new Error(`Illegal itinerary transition ${itinerary.status} -> ${to}`);
  }
  itinerary.status = to;
  return touch(itinerary);
}

export function setItineraryError(id: string, message: string): Itinerary {
  const itinerary = getOrThrow(id);
  itinerary.stage = 'ERROR';
  itinerary.error = message;
  if (canTransition(itinerary.status, 'FAILED')) itinerary.status = 'FAILED';
  return touch(itinerary);
}

export function resetItineraries(): void {
  itineraries.clear();
}

function getOrThrow(id: string): Itinerary {
  const itinerary = itineraries.get(id);
  if (!itinerary) throw new Error(`Unknown itinerary ${id}`);
  return itinerary;
}

function touch(itinerary: Itinerary): Itinerary {
  itinerary.updatedAt = new Date().toISOString();
  return itinerary;
}
