import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { BookingJsonSchema, BookingJsonWireSchema, type BookingJson } from '@shared/booking';
import type { Transcript } from '../adapters/stt/types';
import { KUCHING_GAZETTEER } from './gazetteer';
import type { VisionReadout } from './vision';

export interface FusionEvidence {
  caption: string | null;
  transcript: Transcript;
  vision: VisionReadout;
}

export type ValidationOutcome =
  | { ok: true; booking: BookingJson }
  | { ok: false; problems: string[] };

const MALAYSIA_BOUNDS = { latMin: 0.8, latMax: 7.5, lngMin: 99.6, lngMax: 119.3 };

export function buildFusionMessages(
  evidence: FusionEvidence,
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const gazetteer = KUCHING_GAZETTEER.map((p) => `- ${p.name}: ${p.lat}, ${p.lng}`).join('\n');
  const system = [
    'You fuse evidence from a Malaysian adventure-tourism video into one booking record.',
    'Rules:',
    '- Use only the supplied caption, transcript, and vision readout. Never invent.',
    '- Prefer null over a guessed price, phone number, or date.',
    '- Never use 0 or an empty string as a placeholder. Use null when a field is',
    '  not evidenced.',
    '- contact.source names the evidence stream where the number was actually found.',
    '- raw_evidence.transcript_span is a verbatim transcript quote; frame_ts is the',
    '  timestamp of the most useful frame.',
    '- Take meeting_point coordinates from this gazetteer when the named place matches;',
    '  otherwise use coordinates only if explicitly evidenced:',
    gazetteer,
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
  const inBounds =
    lat >= MALAYSIA_BOUNDS.latMin &&
    lat <= MALAYSIA_BOUNDS.latMax &&
    lng >= MALAYSIA_BOUNDS.lngMin &&
    lng <= MALAYSIA_BOUNDS.lngMax;
  if (!inBounds) {
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

// The wire schema sent to OpenAI leaves confidence and date_requested loosely
// typed (strict-mode JSON schema rejects min/max/format keywords), so the
// model's reply can violate the strict schema's bounds or datetime format.
// Sanitize those two fields before validation instead of failing the whole
// booking over a clamp or a reformat.
function sanitizeCandidate(candidate: unknown): unknown {
  if (typeof candidate !== 'object' || candidate === null) return candidate;
  const record = { ...(candidate as Record<string, unknown>) };
  if (typeof record.confidence === 'number') {
    record.confidence = Math.min(1, Math.max(0, record.confidence));
  }
  if (typeof record.date_requested === 'string') {
    record.date_requested = toIsoDatetime(record.date_requested);
  }
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
  if (typeof record.whatsapp === 'string' && record.whatsapp.trim() === '') {
    record.whatsapp = null;
  }
  return record;
}

function toIsoDatetime(value: string): string | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function formatTranscript(transcript: Transcript): string {
  if (transcript.segments.length === 0) return transcript.text || '(none)';
  return transcript.segments
    .map((s) => `[${s.start.toFixed(1)}s-${s.end.toFixed(1)}s] ${s.text.trim()}`)
    .join('\n');
}
