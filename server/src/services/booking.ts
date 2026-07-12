import type { BookingJson } from '@shared/booking';
import { isConfirmationText } from '@shared/confirm';
import type { BookingRequest, Itinerary } from '@shared/status';
import type { Config } from '../config';
import type { InboundMessage, MessagingProvider } from '../adapters/messaging/types';
import { MOCK_OPERATOR_ADDRESS } from '../adapters/messaging/mock';
import { NotConfiguredError } from '../lib/errors';
import { markOptedIn, recordDemand } from '../store/directory';
import {
  allItineraries,
  appendMessage,
  getItinerary,
  setRequested,
  transition,
} from '../store/itineraries';

// Outbound messages only ever go to the env-configured demo phone, never to
// numbers extracted from videos. Consensual opt-in, no cold contact.
export function operatorAddressFor(config: Config): string {
  switch (config.MESSAGING_PROVIDER) {
    case 'twilio':
      if (!config.OPERATOR_WHATSAPP) {
        throw new NotConfiguredError('Operator WhatsApp', 'Set OPERATOR_WHATSAPP=whatsapp:+60...');
      }
      return config.OPERATOR_WHATSAPP;
    case 'telegram':
      if (!config.OPERATOR_TELEGRAM_CHAT_ID) {
        throw new NotConfiguredError('Operator Telegram chat', 'Set OPERATOR_TELEGRAM_CHAT_ID.');
      }
      return config.OPERATOR_TELEGRAM_CHAT_ID;
    case 'mock':
      return MOCK_OPERATOR_ADDRESS;
  }
}

export function composeOperatorMessage(booking: BookingJson, requested: BookingRequest): string {
  const date = new Date(requested.dateISO).toDateString();
  const price = booking.price_myr === null ? '' : ` (~RM${booking.price_myr}/pax)`;
  return [
    `Hi ${booking.operator_name}! A tourist found your ${booking.activity}${price} on Jalan2 and wants to book:`,
    `- Date: ${date}`,
    `- Pax: ${requested.pax}`,
    `- Meet: ${booking.meeting_point.name}`,
    'Reply YES to confirm this booking and get listed for future tourists. Reply anything else to decline.',
  ].join('\n');
}

export async function bookItinerary(
  messaging: MessagingProvider,
  config: Config,
  id: string,
  requested: BookingRequest,
): Promise<Itinerary> {
  const itinerary = getItinerary(id);
  if (!itinerary) throw new Error(`Unknown itinerary ${id}`);
  if (itinerary.status !== 'DRAFT' || itinerary.stage !== 'READY' || !itinerary.booking) {
    throw new Error(
      `Itinerary ${id} is not bookable (status=${itinerary.status}, stage=${itinerary.stage})`,
    );
  }
  const to = operatorAddressFor(config);
  const body = composeOperatorMessage(itinerary.booking, requested);
  await messaging.sendBookingRequest(to, body);
  setRequested(id, requested, to);
  appendMessage(id, { direction: 'outbound', text: body, at: new Date().toISOString() });
  recordDemand(itinerary.booking);
  return transition(id, 'PENDING_CONFIRM');
}

export function handleInbound(message: InboundMessage): Itinerary | null {
  // Strict correlation: a reply confirms only a booking that was actually sent
  // to that sender. Newest-first resolves multiple pendings to the same
  // operator; an unknown sender must never confirm anything.
  const pending = allItineraries()
    .filter((it) => it.status === 'PENDING_CONFIRM')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const target = pending.find((it) => it.operatorAddress === message.from) ?? null;
  if (!target) return null;
  appendMessage(target.id, {
    direction: 'inbound',
    text: message.text,
    at: new Date().toISOString(),
  });
  if (!isConfirmationText(message.text)) return getItinerary(target.id) ?? null;
  const confirmed = transition(target.id, 'CONFIRMED');
  if (confirmed.booking) markOptedIn(confirmed.booking.operator_name);
  return confirmed;
}
