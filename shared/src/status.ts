import type { BookingJson } from './booking';

export type ItineraryStatus = 'DRAFT' | 'PENDING_CONFIRM' | 'CONFIRMED' | 'FAILED';

export type PipelineStage =
  | 'QUEUED'
  | 'EXTRACTING'
  | 'TRANSCRIBING'
  | 'READING_FRAMES'
  | 'FUSING'
  | 'READY'
  | 'ERROR';

const TRANSITIONS: Record<ItineraryStatus, readonly ItineraryStatus[]> = {
  DRAFT: ['PENDING_CONFIRM', 'FAILED'],
  PENDING_CONFIRM: ['CONFIRMED', 'FAILED'],
  CONFIRMED: [],
  FAILED: [],
};

export function canTransition(from: ItineraryStatus, to: ItineraryStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export interface ItineraryMessage {
  direction: 'outbound' | 'inbound';
  text: string;
  at: string;
}

export interface BookingRequest {
  dateISO: string;
  pax: number;
}

export interface Itinerary {
  id: string;
  tripId: string | null;
  experienceId: string | null;
  sourceUrl: string;
  coverUrl: string | null;
  status: ItineraryStatus;
  stage: PipelineStage;
  booking: BookingJson | null;
  servedFrom: 'live' | 'cache' | null;
  requested: BookingRequest | null;
  operatorAddress: string | null;
  messages: ItineraryMessage[];
  error: string | null;
  createdAt: string;
  updatedAt: string;
}
