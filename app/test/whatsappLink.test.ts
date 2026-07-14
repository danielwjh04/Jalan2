import { describe, expect, it } from 'vitest';
import type { BookingJson } from '@shared/booking';
import { buildOperatorChatLink, buildWhatsAppDeepLink } from '../src/lib/whatsappLink';

const booking: BookingJson = {
  operator_name: 'The Boathouse Tioman',
  activity: 'underwater LRT coach reef dive',
  price_myr: null,
  pax: 2,
  meeting_point: { name: 'Pulau Tioman', lat: 2.7933, lng: 104.1586 },
  contact: { whatsapp: null, source: 'vision' },
  date_requested: null,
  confidence: 0.6,
  raw_evidence: { transcript_span: 'Thanks for watching!', frame_ts: '8.2s' },
};

describe('buildWhatsAppDeepLink', () => {
  it('uses the configured demo number when the video has no WhatsApp contact', () => {
    const link = buildWhatsAppDeepLink(booking, { dateISO: '2026-07-07', pax: 2 }, '+65 9123 4567');
    expect(link?.startsWith('https://wa.me/6591234567?text=')).toBe(true);
    expect(decodeURIComponent(link?.split('text=')[1] ?? '')).toContain(
      'Hi The Boathouse Tioman!',
    );
  });

  it('prefers an evidenced video contact over the demo fallback', () => {
    const withContact = {
      ...booking,
      contact: { whatsapp: 'whatsapp:+60 13-820 1122', source: 'caption' },
    } satisfies BookingJson;
    const link = buildWhatsAppDeepLink(withContact, { dateISO: '2026-07-07', pax: 3 }, '+65 9123');
    expect(link?.startsWith('https://wa.me/60138201122?text=')).toBe(true);
    expect(decodeURIComponent(link?.split('text=')[1] ?? '')).toContain('- Pax: 3');
  });

  it('returns null when neither number is usable', () => {
    expect(buildWhatsAppDeepLink(booking, { dateISO: '2026-07-07', pax: 2 }, 'abc')).toBeNull();
  });
});

describe('buildOperatorChatLink', () => {
  it('opens the confirmed operator address without drafting a second booking', () => {
    expect(buildOperatorChatLink('whatsapp:+60 13-820 1122')).toBe(
      'https://wa.me/60138201122',
    );
  });

  it('returns null for an unusable address', () => {
    expect(buildOperatorChatLink('mock:operator')).toBeNull();
  });
});
