import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BookingJson } from '@shared/booking';
import type { Retrieval, RetrievalResult } from '../src/adapters/retrieval/types';
import {
  discoverOperator,
  extractContact,
  extractSocialChannels,
  needsOperatorDiscovery,
  operatorNameFrom,
} from '../src/services/operatorDiscovery';

const booking: BookingJson = {
  operator_name: 'Unnamed local operator',
  activity: 'Sri Bintang Hill hike',
  price_myr: null,
  pax: 2,
  meeting_point: { name: 'Sri Bintang Hill', lat: 3.1842, lng: 101.6438 },
  contact: { whatsapp: null, source: 'caption' },
  date_requested: null,
  confidence: 0.6,
  raw_evidence: { transcript_span: '', frame_ts: '3.0s' },
};

function result(title: string, text: string | null, url = 'https://example.my/tours'): RetrievalResult {
  return { title, url, snippet: text?.slice(0, 300) ?? null, imageUrl: null, text };
}

describe('needsOperatorDiscovery', () => {
  it('triggers only when the video evidenced no contact', () => {
    expect(needsOperatorDiscovery(booking)).toBe(true);
    expect(needsOperatorDiscovery({
      ...booking,
      contact: { whatsapp: '+60138201122', source: 'caption' },
    })).toBe(false);
  });
});

describe('extractContact', () => {
  it('reads a wa.me link as the most precise contact', () => {
    const contact = extractContact(result('Tours', 'Book at https://wa.me/60198765432 today'));
    expect(contact).toEqual({ number: '+60198765432', kind: 'whatsapp-link' });
  });

  it('reads an api.whatsapp.com send link', () => {
    const contact = extractContact(result('Tours', 'https://api.whatsapp.com/send?phone=60138201122'));
    expect(contact).toEqual({ number: '+60138201122', kind: 'whatsapp-link' });
  });

  it('normalizes an international mobile number', () => {
    const contact = extractContact(result('Tours', 'Call +60 12-345 6789 today'));
    expect(contact).toEqual({ number: '+60123456789', kind: 'mobile' });
  });

  it('normalizes a local mobile number', () => {
    const contact = extractContact(result('Tours', 'WhatsApp 012-345 6789 to book'));
    expect(contact).toEqual({ number: '+60123456789', kind: 'mobile' });
  });

  it('accepts a landline only next to a contact word', () => {
    const contact = extractContact(result('Tours', 'Contact us: 082-246 088 (Kuching office)'));
    expect(contact).toEqual({ number: '+6082246088', kind: 'landline' });
  });

  it('rejects a landline-shaped number without contact context', () => {
    expect(extractContact(result('Tours', 'Entry fee RM12, opened 03-1998 6000 years ago')))
      .toBeNull();
  });

  it('scans past a context-free landline to a later contactable one', () => {
    const contact = extractContact(result(
      'Tours',
      'Founded 038-812 3456 metres up. Call 082-246 088 to reserve.',
    ));
    expect(contact?.number).toBe('+6082246088');
  });

  it('reads the full text beyond the display snippet', () => {
    const text = `${'about the trail. '.repeat(40)}Contact: WhatsApp 013-820 1122`;
    const contact = extractContact(result('Tours', text));
    expect(contact).toEqual({ number: '+60138201122', kind: 'mobile' });
  });

  it('returns null when nothing phone-like appears', () => {
    expect(extractContact(result('Tours', 'Open daily 9am to 5pm'))).toBeNull();
  });
});

describe('extractSocialChannels', () => {
  it('captures Facebook pages and Instagram profiles', () => {
    const channels = extractSocialChannels(result(
      'Tours',
      'Follow facebook.com/sribintangguides and instagram.com/sribintang.hikes',
    ));
    expect(channels).toEqual({
      facebook: 'https://facebook.com/sribintangguides',
      instagram: 'https://instagram.com/sribintang.hikes',
    });
  });

  it('ignores share widgets and post permalinks', () => {
    const channels = extractSocialChannels(result(
      'Tours',
      'Share via facebook.com/sharer.php?u=x or see instagram.com/reels/abc123',
    ));
    expect(channels).toEqual({ facebook: null, instagram: null });
  });

  it('scans past widgets and pixels to the real page link', () => {
    const channels = extractSocialChannels(result(
      'Tours',
      'facebook.com/plugins/like.php then follow facebook.com/sribintangguides',
    ));
    expect(channels.facebook).toBe('https://facebook.com/sribintangguides');
  });

  it('returns nulls when no social links appear', () => {
    expect(extractSocialChannels(result('Tours', 'Open daily 9am to 5pm')))
      .toEqual({ facebook: null, instagram: null });
  });
});

describe('operatorNameFrom', () => {
  it('takes the head of a separated title', () => {
    expect(operatorNameFrom(result('Bukit Kiara Trails | KL hiking guides', null)))
      .toBe('Bukit Kiara Trails');
  });

  it('falls back to the domain for a too-short title', () => {
    expect(operatorNameFrom(result('KL', null))).toBe('example.my');
  });
});

describe('discoverOperator', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not found', { status: 404 })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads social hrefs and a wa.me link from the winning page html', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      '<a href="https://www.facebook.com/sribintangguides">FB</a>' +
      '<a href="https://wa.me/60138201122">Chat</a>',
      { status: 200, headers: { 'content-type': 'text/html' } },
    )));
    const retrieval: Retrieval = {
      name: 'fixture',
      search: async () => [result('Sri Bintang Guides', 'Guided sunrise hikes daily')],
    };
    const discovered = await discoverOperator(retrieval, booking);
    expect(discovered?.whatsapp).toBe('+60138201122');
    expect(discovered?.facebook).toBe('https://facebook.com/sribintangguides');
  });

  it('lets a wa.me link on the page outrank a text-matched number', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      '<a href="https://wa.me/60128628009">WhatsApp us</a>',
      { status: 200, headers: { 'content-type': 'text/html' } },
    )));
    const retrieval: Retrieval = {
      name: 'fixture',
      search: async () => [result('Sri Bintang Guides', 'Office line 013-820 1122')],
    };
    const discovered = await discoverOperator(retrieval, booking);
    expect(discovered?.whatsapp).toBe('+60128628009');
  });

  it('keeps text-derived contacts when the page fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    const retrieval: Retrieval = {
      name: 'fixture',
      search: async () => [result('Sri Bintang Guides', 'WhatsApp 013-820 1122 to book')],
    };
    const discovered = await discoverOperator(retrieval, booking);
    expect(discovered?.whatsapp).toBe('+60138201122');
    expect(discovered?.facebook).toBeNull();
  });

  it('prefers a WhatsApp link over a higher-ranked plain mobile', async () => {
    const retrieval: Retrieval = {
      name: 'fixture',
      search: async () => [
        result('Ranked First Tours', 'Call 012-345 6789'),
        result('Sri Bintang Guides', 'Book at https://wa.me/60138201122'),
      ],
    };
    const discovered = await discoverOperator(retrieval, booking);
    expect(discovered?.name).toBe('Sri Bintang Guides');
    expect(discovered?.whatsapp).toBe('+60138201122');
  });

  it('attaches social channels only from the winning result', async () => {
    const retrieval: Retrieval = {
      name: 'fixture',
      search: async () => [
        result('Unrelated blog', 'Follow facebook.com/someoneelse for updates'),
        result('Sri Bintang Guides', 'WhatsApp 013-820 1122, DM instagram.com/sribintang.hikes'),
      ],
    };
    const discovered = await discoverOperator(retrieval, booking);
    expect(discovered?.facebook).toBeNull();
    expect(discovered?.instagram).toBe('https://instagram.com/sribintang.hikes');
  });

  it('returns the top result without a phone when none carries one', async () => {
    const retrieval: Retrieval = {
      name: 'fixture',
      search: async () => [result('Hiking blog roundup', 'Ten trails to try')],
    };
    const discovered = await discoverOperator(retrieval, booking);
    expect(discovered?.name).toBe('Hiking blog roundup');
    expect(discovered?.whatsapp).toBeNull();
  });

  it('requests expanded page text from retrieval', async () => {
    let requestedCharacters: number | undefined;
    const retrieval: Retrieval = {
      name: 'fixture',
      search: async (_query, _limit, textCharacters) => {
        requestedCharacters = textCharacters;
        return [];
      },
    };
    expect(await discoverOperator(retrieval, booking)).toBeNull();
    expect(requestedCharacters).toBe(3000);
  });

  it('returns null when retrieval finds nothing or fails', async () => {
    const empty: Retrieval = { name: 'fixture', search: async () => [] };
    const failing: Retrieval = {
      name: 'fixture',
      search: async () => { throw new Error('retrieval down'); },
    };
    expect(await discoverOperator(empty, booking)).toBeNull();
    expect(await discoverOperator(failing, booking)).toBeNull();
  });
});
