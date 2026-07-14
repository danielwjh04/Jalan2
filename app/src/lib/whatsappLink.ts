import type { BookingJson } from '@shared/booking';
import type { BookingRequest } from '@shared/status';

export function buildWhatsAppDeepLink(
  booking: BookingJson,
  requested: BookingRequest,
  demoNumber: string | undefined,
): string | null {
  const phone = normalizeWhatsAppNumber(booking.contact.whatsapp) ?? normalizeWhatsAppNumber(demoNumber);
  if (!phone) return null;
  const message = composeWhatsAppBookingDraft(booking, requested);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function buildOperatorChatLink(address: string | null): string | null {
  const phone = normalizeWhatsAppNumber(address);
  return phone ? `https://wa.me/${phone}` : null;
}

function normalizeWhatsAppNumber(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const withoutScheme = trimmed.replace(/^whatsapp:/i, '').trim();
  const digits = withoutScheme.replace(/\D/g, '');
  return digits.length >= 8 ? digits : null;
}

function composeWhatsAppBookingDraft(booking: BookingJson, requested: BookingRequest): string {
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
