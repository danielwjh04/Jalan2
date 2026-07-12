import { describe, expect, it } from 'vitest';
import type { BookingJson } from '@shared/booking';
import type { Retrieval, RetrievalResult } from '../src/adapters/retrieval/types';
import { enrichTrust, scoreTrust } from '../src/pipeline/trust';

function result(title: string, snippet: string | null = null): RetrievalResult {
  return { title, url: 'https://example.com/page', snippet, imageUrl: null };
}

const BOOKING: BookingJson = {
  operator_name: 'Wanka Travel',
  activity: 'Kuching city tour',
  price_myr: 80,
  pax: 2,
  meeting_point: { name: 'Kuching Waterfront', lat: 1.5593, lng: 110.3439 },
  contact: { whatsapp: null, source: 'caption' },
  date_requested: null,
  confidence: 0.7,
  raw_evidence: { transcript_span: 'city tour', frame_ts: '1.0s' },
};

describe('scoreTrust', () => {
  it('is deterministic and proportional to matching results', () => {
    const results = [
      result('Wanka Travel Services contact page'),
      result('Unrelated noodle blog'),
      result('Wanka listings', 'travel agency directory'),
    ];
    const first = scoreTrust('Wanka Travel', results);
    expect(first).toEqual(scoreTrust('Wanka Travel', results));
    expect(first?.score).toBe(0.4);
    expect(first?.evidence.length).toBe(2);
  });

  it('returns null when nothing matches or there are no results', () => {
    expect(scoreTrust('Wanka Travel', [])).toBeNull();
    expect(scoreTrust('Wanka Travel', [result('Completely unrelated page')])).toBeNull();
  });
});

describe('enrichTrust', () => {
  it('attaches trust from retrieval results', async () => {
    const retrieval: Retrieval = {
      name: 'fixture',
      search: () => Promise.resolve([result('Wanka Travel reviews', 'registered agency')]),
    };
    const enriched = await enrichTrust(retrieval, BOOKING);
    expect(enriched.trust?.score).toBeGreaterThan(0);
    expect(enriched.trust?.evidence[0]).toContain('example.com');
  });

  it('yields null trust when retrieval finds nothing', async () => {
    const retrieval: Retrieval = { name: 'fixture', search: () => Promise.resolve([]) };
    const enriched = await enrichTrust(retrieval, BOOKING);
    expect(enriched.trust).toBeNull();
  });
});
