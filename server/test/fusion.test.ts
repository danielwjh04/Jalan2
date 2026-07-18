import { describe, expect, it } from 'vitest';
import type { BookingJson } from '@shared/booking';
import {
  buildFusionMessages,
  removeUngroundedContact,
  removeUngroundedPrice,
  validateFusedBooking,
} from '../src/pipeline/fusion';

const evidence = {
  caption: 'Hidden reef dive RM250, WhatsApp 013-820 1122',
  transcript: {
    text: 'two dives at the reef off Bako, RM250 per person',
    segments: [{ start: 12.0, end: 16.5, text: 'two dives at the reef off Bako, RM250 per person' }],
  },
  vision: {
    frames: [
      {
        ts: '14.5s',
        on_screen_text: 'RM250 ALL GEAR INCLUDED',
        price_candidates: ['RM250'],
        phone_candidates: ['013-820 1122'],
        place_candidates: ['Bako'],
        operator_or_logo: 'Kuching Dive Adventures',
      },
    ],
  },
};

const validBooking: BookingJson = {
  operator_name: 'Kuching Dive Adventures',
  activity: 'Bako reef dive',
  price_myr: 250,
  pax: 2,
  meeting_point: { name: 'Bako National Park jetty', lat: 1.7169, lng: 110.4462 },
  contact: { whatsapp: '+60138201122', source: 'caption' },
  date_requested: null,
  confidence: 0.88,
  raw_evidence: { transcript_span: 'RM250 per person', frame_ts: '14.5s' },
};

describe('buildFusionMessages', () => {
  it('includes every evidence block in the user message', () => {
    const [system, user] = buildFusionMessages(evidence);
    expect(system.role).toBe('system');
    expect(user.role).toBe('user');
    const text = String(user.content);
    expect(text).toContain('Hidden reef dive RM250');
    expect(text).toContain('[12.0s-16.5s] two dives at the reef off Bako');
    expect(text).toContain('RM250 ALL GEAR INCLUDED');
  });

  it('states the meeting point coordinate rule in the system prompt', () => {
    const [system] = buildFusionMessages(evidence);
    const text = String(system.content);
    expect(text).toContain('places database after fusion');
    expect(text).toContain('Never invent');
  });

  it('falls back to plain transcript text when there are no segments', () => {
    const [, user] = buildFusionMessages({
      ...evidence,
      transcript: { text: 'plain text only', segments: [] },
    });
    expect(String(user.content)).toContain('plain text only');
  });
});

describe('validateFusedBooking', () => {
  it('accepts a valid booking', () => {
    const outcome = validateFusedBooking(validBooking);
    expect(outcome.ok).toBe(true);
  });

  it('clamps out-of-range confidence instead of failing', () => {
    const outcome = validateFusedBooking({ ...validBooking, confidence: 1.4 });
    expect(outcome.ok && outcome.booking.confidence).toBe(1);
  });

  it('rejects coordinates outside Malaysia', () => {
    const outcome = validateFusedBooking({
      ...validBooking,
      meeting_point: { name: 'Somewhere', lat: 40.7, lng: -74.0 },
    });
    expect(!outcome.ok && outcome.problems[0]).toMatch(/outside Malaysia bounds/);
  });

  it('reports schema violations as problems', () => {
    const { operator_name: _dropped, ...missingOperator } = validBooking;
    const outcome = validateFusedBooking(missingOperator);
    expect(!outcome.ok && outcome.problems.join(' ')).toContain('operator_name');
  });

  it('discards source dates because the tourist has not requested one yet', () => {
    const outcome = validateFusedBooking({ ...validBooking, date_requested: '2026-07-12' });
    expect(outcome.ok && outcome.booking.date_requested).toBeNull();
  });

  it('falls back to null when date_requested is not a parseable date', () => {
    const outcome = validateFusedBooking({ ...validBooking, date_requested: 'sometime soon' });
    expect(outcome.ok && outcome.booking.date_requested).toBeNull();
  });

  it('uses the neutral two-person default instead of advertised capacity', () => {
    const outcome = validateFusedBooking({ ...validBooking, pax: 30 });
    expect(outcome.ok && outcome.booking.pax).toBe(2);
  });

  it('coerces an un-evidenced zero price to null', () => {
    const outcome = validateFusedBooking({ ...validBooking, price_myr: 0 });
    expect(outcome.ok && outcome.booking.price_myr).toBeNull();
  });

  it('coerces an empty whatsapp string to null', () => {
    const outcome = validateFusedBooking({
      ...validBooking,
      contact: { whatsapp: '', source: 'caption' },
    });
    expect(outcome.ok && outcome.booking.contact.whatsapp).toBeNull();
  });

  it('coerces a punctuation-only whatsapp string to null', () => {
    const outcome = validateFusedBooking({
      ...validBooking,
      contact: { whatsapp: ',', source: 'vision' },
    });
    expect(outcome.ok && outcome.booking.contact.whatsapp).toBeNull();
  });

  it('coerces a prefixed null-like whatsapp value to null', () => {
    const outcome = validateFusedBooking({
      ...validBooking,
      contact: { whatsapp: '+60null', source: 'caption' },
    });
    expect(outcome.ok && outcome.booking.contact.whatsapp).toBeNull();
  });
});

describe('removeUngroundedPrice', () => {
  it('keeps an activity price evidenced in the selected frame', () => {
    expect(removeUngroundedPrice(validBooking, evidence).price_myr).toBe(250);
  });

  it('drops a parking price taken from another carousel slide', () => {
    const mixedEvidence = {
      caption: 'White Water Rafting. Parking RM20 at a different attraction.',
      transcript: { text: '', segments: [] },
      vision: {
        frames: [{
          ts: '4.0s',
          on_screen_text: 'Parking RM20',
          price_candidates: ['RM20'],
          phone_candidates: [],
          place_candidates: ['Lost World of Tambun'],
          operator_or_logo: null,
        }, {
          ts: '8.0s',
          on_screen_text: 'White Water Rafting',
          price_candidates: [],
          phone_candidates: [],
          place_candidates: ['Gopeng Glamping Park'],
          operator_or_logo: null,
        }],
      },
    };
    const rafting = {
      ...validBooking,
      activity: 'White Water Rafting',
      price_myr: 20,
      raw_evidence: { transcript_span: 'White Water Rafting', frame_ts: '8.0s' },
    };

    expect(removeUngroundedPrice(rafting, mixedEvidence).price_myr).toBeNull();
  });
});

describe('removeUngroundedContact', () => {
  it('keeps a number evidenced on the selected activity frame', () => {
    expect(removeUngroundedContact(validBooking, evidence).contact.whatsapp).toBe('+60138201122');
  });

  it('drops a restaurant number borrowed by an activity on another slide', () => {
    const mixedEvidence = {
      ...evidence,
      caption: null,
      transcript: { text: '', segments: [] },
      vision: {
        frames: [{
          ts: '2.0s',
          on_screen_text: 'Nam Heong 012-5888 766',
          price_candidates: [],
          phone_candidates: ['012-5888 766'],
          place_candidates: ['Nam Heong'],
          operator_or_logo: null,
        }, {
          ts: '8.0s',
          on_screen_text: 'White Water Rafting',
          price_candidates: [],
          phone_candidates: [],
          place_candidates: ['Gopeng Glamping Park'],
          operator_or_logo: null,
        }],
      },
    };
    const rafting: BookingJson = {
      ...validBooking,
      activity: 'White Water Rafting',
      contact: { whatsapp: '+60125888766', source: 'vision' },
      raw_evidence: { transcript_span: 'White Water Rafting', frame_ts: '8.0s' },
    };

    expect(removeUngroundedContact(rafting, mixedEvidence).contact.whatsapp).toBeNull();
  });
});
