import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { BookingJsonSchema, BookingJsonWireSchema, type BookingJson } from '@shared/booking';
import type { Transcript } from '../adapters/stt/types';
import { inMalaysiaBounds } from './region';
import type { VisionReadout } from './vision';

export interface FusionEvidence {
  caption: string | null;
  transcript: Transcript;
  vision: VisionReadout;
}

export type ValidationOutcome =
  | { ok: true; booking: BookingJson }
  | { ok: false; problems: string[] };

export function buildFusionMessages(
  evidence: FusionEvidence,
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const system = [
    'You fuse evidence from a Malaysian travel post into one grounded booking record.',
    'Rules:',
    '- Use only the supplied caption, transcript, and vision readout. Never invent.',
    '- The activity and meeting point must describe the post\'s main trip or first explicit',
    '  itinerary stop, not a hashtag, sponsor, incidental product, or place inferred from scenery.',
    '- Prefer null over a guessed price, phone number, or date.',
    '- price_myr is the price of the selected booking activity only. A parking,',
    '  meal, hotel, entrance, or other stop price must never become the activity',
    '  price. Use null unless the amount and activity are tied together in the',
    '  same caption passage, transcript segment, or frame.',
    '- pax is the tourist party size. No tourist choice exists during ingestion,',
    '  so always set pax to 2. Never use tour capacity or available seats.',
    '- date_requested is chosen by the tourist after ingestion. Always set it to null;',
    '  never use a date advertised inside the source post.',
    '- operator_name must be a named person or business from the evidence. If no',
    '  operator is named, use exactly "Unnamed local operator". Never treat a',
    '  platform name such as Facebook, fb, WhatsApp, XHS, or TikTok as an operator.',
    '- Never use 0 or an empty string as a placeholder. Use null when a field is',
    '  not evidenced.',
    '- contact.source names the evidence stream where the number was actually found.',
    '- raw_evidence.transcript_span is a verbatim transcript quote; frame_ts is the',
    '  timestamp of the most useful frame.',
    '- meeting_point is the named start or gathering place from the evidence. Set',
    '  lat and lng to the widely known coordinates of that named place in Malaysia;',
    '  city-level accuracy is enough because coordinates are re-verified against a',
    '  places database after fusion.',
    'Confidence rubric: 0.9 or higher when key fields are corroborated by two or more',
    'evidence streams; around 0.6 when single-source; below 0.4 when the operator or',
    'activity is unclear.',
  ].join('\n');
  const user = [
    `Caption:\n${evidence.caption ?? '(none)'}`,
    `Transcript:\n${formatTranscript(evidence.transcript)}`,
    `Vision readout:\n${JSON.stringify(evidence.vision, null, 2)}`,
  ].join('\n\n');
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

export function validateFusedBooking(candidate: unknown): ValidationOutcome {
  const parsed = BookingJsonSchema.safeParse(sanitizeCandidate(candidate));
  if (!parsed.success) {
    const problems = parsed.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`,
    );
    return { ok: false, problems };
  }
  const { lat, lng } = parsed.data.meeting_point;
  if (!inMalaysiaBounds(parsed.data.meeting_point)) {
    return { ok: false, problems: [`meeting_point is outside Malaysia bounds: ${lat}, ${lng}`] };
  }
  return { ok: true, booking: parsed.data };
}

export async function fuse(
  client: OpenAI,
  model: string,
  evidence: FusionEvidence,
): Promise<BookingJson> {
  const messages = buildFusionMessages(evidence);
  const first = await requestBooking(client, model, messages);
  const validated = validateFusedBooking(first);
  if (validated.ok) return enforceFieldEvidence(validated.booking, evidence);
  const second = await requestBooking(client, model, [
    ...messages,
    { role: 'assistant', content: JSON.stringify(first) },
    {
      role: 'user',
      content: `That booking failed validation:\n${validated.problems.join('\n')}\nReturn a corrected booking that satisfies every rule.`,
    },
  ]);
  const revalidated = validateFusedBooking(second);
  if (revalidated.ok) return enforceFieldEvidence(revalidated.booking, evidence);
  throw new Error(`Fusion failed validation twice: ${revalidated.problems.join('; ')}`);
}

function enforceFieldEvidence(booking: BookingJson, evidence: FusionEvidence): BookingJson {
  return removeUngroundedContact(removeUngroundedPrice(booking, evidence), evidence);
}

export function removeUngroundedPrice(
  booking: BookingJson,
  evidence: FusionEvidence,
): BookingJson {
  if (booking.price_myr === null) return booking;
  const amount = String(booking.price_myr);
  const selectedFrame = evidence.vision.frames.find((frame) => frame.ts === booking.raw_evidence.frame_ts);
  const frameGrounded = selectedFrame?.price_candidates.some((candidate) =>
    numericAmount(candidate) === amount) && mentionsActivity(
    selectedFrame?.on_screen_text ?? '', booking.activity,
  );
  const quoteGrounded = numericAmount(booking.raw_evidence.transcript_span) === amount;
  const segmentGrounded = evidence.transcript.segments.some((segment) =>
    numericAmount(segment.text) === amount && mentionsActivity(segment.text, booking.activity));
  const captionGrounded = nearbyPriceMentionsActivity(evidence.caption, amount, booking.activity);
  return frameGrounded || quoteGrounded || segmentGrounded || captionGrounded
    ? booking
    : { ...booking, price_myr: null };
}

export function removeUngroundedContact(
  booking: BookingJson,
  evidence: FusionEvidence,
): BookingJson {
  const whatsapp = booking.contact.whatsapp;
  if (!whatsapp) return booking;
  const number = phoneDigits(whatsapp);
  const grounded = booking.contact.source === 'vision'
    ? evidence.vision.frames
      .find((frame) => frame.ts === booking.raw_evidence.frame_ts)
      ?.phone_candidates.some((candidate) => phoneDigits(candidate) === number) ?? false
    : booking.contact.source === 'speech'
      ? evidence.transcript.segments.some((segment) =>
        containsPhone(segment.text, number) && mentionsActivity(segment.text, booking.activity))
      : captionSegmentGroundsContact(evidence.caption, number, booking.activity);
  return grounded ? booking : {
    ...booking,
    contact: { ...booking.contact, whatsapp: null },
  };
}

function captionSegmentGroundsContact(
  caption: string | null,
  number: string,
  activity: string,
): boolean {
  if (!caption) return false;
  return caption.split(/[\n.!?。！？]+/u).some((segment) =>
    containsPhone(segment, number) && mentionsActivity(segment, activity));
}

function containsPhone(text: string, expected: string): boolean {
  const candidates = text.match(/(?:\+?60|0)\s*\d(?:[\s-]*\d){7,10}/g) ?? [];
  return candidates.some((candidate) => phoneDigits(candidate) === expected);
}

function phoneDigits(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('0') ? `60${digits.slice(1)}` : digits;
}

function nearbyPriceMentionsActivity(
  text: string | null,
  amount: string,
  activity: string,
): boolean {
  if (!text) return false;
  const price = new RegExp(`(?:RM\\s*)?${escapeRegex(amount)}(?:\\.00)?`, 'i');
  return text
    .split(/[\n.!?。！？]+/u)
    .some((segment) => price.test(segment) && mentionsActivity(segment, activity));
}

function mentionsActivity(text: string, activity: string): boolean {
  const lowered = text.toLowerCase();
  const tokens = activity.toLowerCase().match(/[a-z]{4,}/g) ?? [];
  return tokens.some((token) => lowered.includes(token));
}

function numericAmount(text: string): string | null {
  const match = text.match(/(?:RM\s*)?(\d+(?:\.\d{1,2})?)/i);
  if (!match) return null;
  return String(Number(match[1]));
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function requestBooking(
  client: OpenAI,
  model: string,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
): Promise<unknown> {
  const completion = await client.beta.chat.completions.parse({
    model,
    messages,
    response_format: zodResponseFormat(BookingJsonWireSchema, 'booking'),
  });
  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) throw new Error('Fusion returned no parsed content');
  return parsed;
}

// The wire schema leaves numeric constraints loose. Clamp confidence and keep
// tourist-only choices deterministic before validating model output.
function sanitizeCandidate(candidate: unknown): unknown {
  if (typeof candidate !== 'object' || candidate === null) return candidate;
  const record = { ...(candidate as Record<string, unknown>) };
  if (typeof record.confidence === 'number') {
    record.confidence = Math.min(1, Math.max(0, record.confidence));
  }
  record.date_requested = null;
  record.pax = 2;
  // The model sometimes returns 0 or "" as an "unknown" sentinel; the schema
  // accepts both as real values, so coerce them to null to keep the booking
  // honest and avoid rendering "RM0 / pax".
  if (record.price_myr === 0) record.price_myr = null;
  record.contact = sanitizeContact(record.contact);
  return record;
}

function sanitizeContact(contact: unknown): unknown {
  if (typeof contact !== 'object' || contact === null) return contact;
  const record = { ...(contact as Record<string, unknown>) };
  if (typeof record.whatsapp === 'string' && !hasPhoneEvidence(record.whatsapp)) {
    record.whatsapp = null;
  }
  return record;
}

function hasPhoneEvidence(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return !/[a-z]/i.test(value) && digits.length >= 8 && digits.length <= 15;
}

function formatTranscript(transcript: Transcript): string {
  if (transcript.segments.length === 0) return transcript.text || '(none)';
  return transcript.segments
    .map((s) => `[${s.start.toFixed(1)}s-${s.end.toFixed(1)}s] ${s.text.trim()}`)
    .join('\n');
}
