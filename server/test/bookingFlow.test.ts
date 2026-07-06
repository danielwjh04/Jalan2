import { beforeEach, describe, expect, it } from 'vitest';
import type { BookingJson } from '@shared/booking';
import { loadConfig } from '../src/config';
import { createMockProvider, MOCK_OPERATOR_ADDRESS } from '../src/adapters/messaging/mock';
import { bookItinerary, handleInbound } from '../src/services/booking';
import { rankedDirectory, resetDirectory } from '../src/store/directory';
import {
  createItinerary,
  getItinerary,
  resetItineraries,
  setBooking,
  setStage,
} from '../src/store/itineraries';

const config = loadConfig({});
const messaging = createMockProvider(0, () => {});

const booking: BookingJson = {
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

function readyItinerary(): string {
  const itinerary = createItinerary('https://tiktok.com/@kuchingdive/video/1');
  setBooking(itinerary.id, booking, 'cache');
  setStage(itinerary.id, 'READY');
  return itinerary.id;
}

beforeEach(() => {
  resetItineraries();
  resetDirectory();
});

describe('bookItinerary', () => {
  it('sends the composed message and moves DRAFT to PENDING_CONFIRM', async () => {
    const id = readyItinerary();
    const result = await bookItinerary(messaging, config, id, { dateISO: '2026-07-12', pax: 2 });
    expect(result.status).toBe('PENDING_CONFIRM');
    expect(result.operatorAddress).toBe(MOCK_OPERATOR_ADDRESS);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].direction).toBe('outbound');
    expect(result.messages[0].text).toContain('Bako reef dive');
    expect(result.messages[0].text).toContain('Pax: 2');
  });

  it('records demand in the directory', async () => {
    const id = readyItinerary();
    await bookItinerary(messaging, config, id, { dateISO: '2026-07-12', pax: 2 });
    const [entry] = rankedDirectory();
    expect(entry.operatorName).toBe('Kuching Dive Adventures');
    expect(entry.optedIn).toBe(false);
  });

  it('rejects itineraries that are not READY drafts', async () => {
    const itinerary = createItinerary('https://tiktok.com/@kuchingdive/video/2');
    await expect(
      bookItinerary(messaging, config, itinerary.id, { dateISO: '2026-07-12', pax: 2 }),
    ).rejects.toThrow(/not bookable/);
  });

  it('rejects double booking', async () => {
    const id = readyItinerary();
    await bookItinerary(messaging, config, id, { dateISO: '2026-07-12', pax: 2 });
    await expect(
      bookItinerary(messaging, config, id, { dateISO: '2026-07-13', pax: 3 }),
    ).rejects.toThrow(/not bookable/);
  });
});

describe('handleInbound', () => {
  it('confirms the pending itinerary on YES and opts the operator in', async () => {
    const id = readyItinerary();
    await bookItinerary(messaging, config, id, { dateISO: '2026-07-12', pax: 2 });
    const updated = handleInbound({ from: MOCK_OPERATOR_ADDRESS, text: 'YES can!' });
    expect(updated?.id).toBe(id);
    expect(updated?.status).toBe('CONFIRMED');
    expect(rankedDirectory()[0].optedIn).toBe(true);
  });

  it('keeps the itinerary pending on a non-confirmation reply', async () => {
    const id = readyItinerary();
    await bookItinerary(messaging, config, id, { dateISO: '2026-07-12', pax: 2 });
    const updated = handleInbound({ from: MOCK_OPERATOR_ADDRESS, text: 'who is this?' });
    expect(updated?.status).toBe('PENDING_CONFIRM');
    expect(getItinerary(id)?.messages).toHaveLength(2);
    expect(rankedDirectory()[0].optedIn).toBe(false);
  });

  it('returns null when nothing is pending', () => {
    expect(handleInbound({ from: MOCK_OPERATOR_ADDRESS, text: 'YES' })).toBeNull();
  });
});
