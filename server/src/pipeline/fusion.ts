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
    'You fuse evidence from a Malaysian adventure-tourism video into one booking record.',
    'Rules:',
    '- Use only the supplied caption, transcript, and vision readout. Never invent.',
    '- Prefer null over a guessed price, phone number, or date.',
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
  if (validated.ok) return validated.booking;
  const second = await requestBooking(client, model, [
    ...messages,
    { role: 'assistant', content: JSON.stringify(first) },
    {
      role: 'user',
      content: `That booking failed validation:\n${validated.problems.join('\n')}\nReturn a corrected booking that satisfies every rule.`,
    },
  ]);
  const revalidated = validateFusedBooking(second);
  if (revalidated.ok) return revalidated.booking;
  throw new Error(`Fusion failed validation twice: ${revalidated.problems.join('; ')}`);
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
