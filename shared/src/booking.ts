import { z } from 'zod';

// Deterministic web-presence signal computed from retrieval results after
// fusion. Never produced by the fusion model, so it has no wire twin.
export const TrustSchema = z.object({
  score: z.number().min(0).max(1),
  evidence: z.array(z.string()),
});

export type Trust = z.infer<typeof TrustSchema>;

export const BookingJsonSchema = z.object({
  operator_name: z.string().min(1),
  activity: z.string().min(1),
  price_myr: z.number().nonnegative().nullable(),
  pax: z.number().int().positive(),
  meeting_point: z.object({
    name: z.string().min(1),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  contact: z.object({
    whatsapp: z.string().nullable(),
    source: z.enum(['speech', 'vision', 'caption']),
  }),
  date_requested: z.string().datetime({ offset: true }).nullable(),
  confidence: z.number().min(0).max(1),
  raw_evidence: z.object({
    transcript_span: z.string(),
    frame_ts: z.string(),
  }),
  trust: TrustSchema.nullable().optional(),
});

export type BookingJson = z.infer<typeof BookingJsonSchema>;

// Relaxed twin of BookingJsonSchema for the OpenAI structured-output request:
// strict-mode JSON schema rejects min/max/format keywords, so constraints move
// into .describe() text and the strict schema validates the model's reply.
export const BookingJsonWireSchema = z.object({
  operator_name: z.string().describe('Business or guide name exactly as evidenced'),
  activity: z.string().describe('Short bookable activity, e.g. "Bako reef dive"'),
  price_myr: z
    .number()
    .nullable()
    .describe('Price per pax in MYR; null when no price is evidenced'),
  pax: z.number().describe('Whole number of participants; 2 when not stated'),
  meeting_point: z.object({
    name: z.string().describe('Named meeting point, e.g. "Bako jetty"'),
    lat: z.number().describe('Latitude in decimal degrees within Malaysia'),
    lng: z.number().describe('Longitude in decimal degrees within Malaysia'),
  }),
  contact: z.object({
    whatsapp: z
      .string()
      .nullable()
      .describe('Phone number only when it appears in the evidence; else null'),
    source: z
      .enum(['speech', 'vision', 'caption'])
      .describe('Where the contact number was actually found'),
  }),
  date_requested: z.string().nullable().describe('ISO-8601 date-time or null'),
  confidence: z.number().describe('0 to 1 per the rubric in the instructions'),
  raw_evidence: z.object({
    transcript_span: z.string().describe('Verbatim quote from the transcript'),
    frame_ts: z.string().describe('Timestamp of the evidencing frame, e.g. "12.5s"'),
  }),
});
