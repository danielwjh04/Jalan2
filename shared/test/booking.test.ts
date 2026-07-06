import { describe, expect, it } from 'vitest';
import { BookingJsonSchema, BookingJsonWireSchema } from '../src/booking';

const valid = {
  operator_name: 'Bako Dive Co',
  activity: 'Bako reef dive',
  price_myr: 250,
  pax: 2,
  meeting_point: { name: 'Bako jetty', lat: 1.7169, lng: 110.4462 },
  contact: { whatsapp: '+60123456789', source: 'vision' },
  date_requested: '2026-07-12T08:00:00+08:00',
  confidence: 0.85,
  raw_evidence: { transcript_span: 'RM250 per pax, meet at Bako jetty', frame_ts: '12.5s' },
};

describe('BookingJsonSchema', () => {
  it('accepts a fully populated booking', () => {
    expect(BookingJsonSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts nullable price, contact, and date', () => {
    const sparse = {
      ...valid,
      price_myr: null,
      contact: { whatsapp: null, source: 'speech' },
      date_requested: null,
    };
    expect(BookingJsonSchema.safeParse(sparse).success).toBe(true);
  });

  it('rejects confidence outside 0 to 1', () => {
    expect(BookingJsonSchema.safeParse({ ...valid, confidence: 1.2 }).success).toBe(false);
    expect(BookingJsonSchema.safeParse({ ...valid, confidence: -0.1 }).success).toBe(false);
  });

  it('rejects non-positive or fractional pax', () => {
    expect(BookingJsonSchema.safeParse({ ...valid, pax: 0 }).success).toBe(false);
    expect(BookingJsonSchema.safeParse({ ...valid, pax: 1.5 }).success).toBe(false);
  });

  it('rejects out-of-range coordinates', () => {
    const bad = { ...valid, meeting_point: { name: 'x', lat: 91, lng: 110 } };
    expect(BookingJsonSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects an unknown contact source', () => {
    const bad = { ...valid, contact: { whatsapp: null, source: 'guess' } };
    expect(BookingJsonSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a non-ISO date_requested', () => {
    expect(BookingJsonSchema.safeParse({ ...valid, date_requested: 'Saturday' }).success).toBe(
      false,
    );
  });
});

describe('BookingJsonWireSchema', () => {
  it('has the same keys as the strict schema', () => {
    expect(Object.keys(BookingJsonWireSchema.shape).sort()).toEqual(
      Object.keys(BookingJsonSchema.shape).sort(),
    );
  });

  it('accepts everything the strict schema accepts', () => {
    expect(BookingJsonWireSchema.safeParse(valid).success).toBe(true);
  });
});
