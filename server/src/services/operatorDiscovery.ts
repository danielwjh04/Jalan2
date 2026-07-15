import type { BookingJson } from '@shared/booking';
import type { DiscoveredOperator } from '@shared/status';
import type { Retrieval, RetrievalResult } from '../adapters/retrieval/types';

const RESULT_COUNT = 5;
const TEXT_CHARACTERS = 3000;
const CONTEXT_WINDOW = 40;

// Extraction tiers, most precise first: an explicit WhatsApp link, then a
// Malaysian mobile, then a landline that sits next to a contact word so
// prices and dates never pass as phone numbers.
const WA_LINK_PATTERN = /(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=)(\+?\d{9,15})/i;
const MOBILE_PATTERN = /(?:\+?60[\s-]?|\b0)1\d(?:[\s-]?\d){6,8}/;
const LANDLINE_PATTERN = /(?:\+?60[\s-]?|\b0)[3-9]\d?(?:[\s-]?\d){6,8}/g;
const LANDLINE_CONTEXT = /(call|tel|phone|whatsapp|contact|hubungi|booking)/i;

type ContactKind = 'whatsapp-link' | 'mobile' | 'landline';
const KIND_PRIORITY: Record<ContactKind, number> = {
  'whatsapp-link': 0,
  mobile: 1,
  landline: 2,
};

export interface FoundContact {
  number: string;
  kind: ContactKind;
}

export function needsOperatorDiscovery(booking: BookingJson): boolean {
  return booking.contact.whatsapp === null;
}

export async function discoverOperator(
  retrieval: Retrieval,
  booking: BookingJson,
): Promise<DiscoveredOperator | null> {
  const query = `${booking.activity} ${booking.meeting_point.name} Malaysia tour operator guide booking contact`;
  const results = await retrieval.search(query, RESULT_COUNT, TEXT_CHARACTERS).catch(() => []);
  const withContact = results
    .map((result) => ({ result, contact: extractContact(result) }))
    .filter((entry): entry is { result: RetrievalResult; contact: FoundContact } =>
      entry.contact !== null,
    )
    .sort((left, right) => KIND_PRIORITY[left.contact.kind] - KIND_PRIORITY[right.contact.kind]);
  const best = withContact[0] ?? (results[0] ? { result: results[0], contact: null } : null);
  if (!best) return null;
  const pageHtml = (await fetchPageHtml(best.result.url)) ?? '';
  const fromText = extractSocialChannels(best.result);
  const fromPage = socialChannelsIn(pageHtml);
  return {
    name: operatorNameFrom(best.result),
    url: best.result.url,
    snippet: best.result.snippet,
    whatsapp: resolveWhatsApp(best.contact, pageHtml),
    facebook: fromText.facebook ?? fromPage.facebook,
    instagram: fromText.instagram ?? fromPage.instagram,
  };
}

// An explicit wa.me link on the operator's own page beats a number pattern
// matched out of search text; a wa.me link found in the search text beats both.
function resolveWhatsApp(contact: FoundContact | null, pageHtml: string): string | null {
  if (contact?.kind === 'whatsapp-link') return contact.number;
  return whatsAppLinkIn(pageHtml) ?? contact?.number ?? null;
}

// Facebook and Instagram handles are read only from the same page that named
// the operator, so another listing's socials are never attributed to them.
// Search text rarely contains them (they live in icon hrefs), so the winning
// page's HTML is fetched once, bounded, and scanned for hrefs too.
const FACEBOOK_PATTERN = /(?:facebook\.com|fb\.com)\/([A-Za-z0-9][A-Za-z0-9.\-_]{2,})/i;
const INSTAGRAM_PATTERN = /instagram\.com\/([A-Za-z0-9][A-Za-z0-9._]{1,29})/i;
const FACEBOOK_NON_PAGES = new Set([
  'sharer.php', 'share', 'login', 'plugins', 'hashtag', 'events', 'groups', 'watch',
]);
const INSTAGRAM_NON_PROFILES = new Set(['p', 'reel', 'reels', 'explore', 'stories', 'accounts']);
const PAGE_TIMEOUT_MS = 5000;
const PAGE_BYTE_CAP = 200_000;

export function extractSocialChannels(
  result: RetrievalResult,
): Pick<DiscoveredOperator, 'facebook' | 'instagram'> {
  return socialChannelsIn(`${result.title} ${result.text ?? result.snippet ?? ''} ${result.url}`);
}

export function socialChannelsIn(
  haystack: string,
): Pick<DiscoveredOperator, 'facebook' | 'instagram'> {
  return {
    facebook: firstValidHandle(haystack, FACEBOOK_PATTERN, FACEBOOK_NON_PAGES, 'https://facebook.com/'),
    instagram: firstValidHandle(haystack, INSTAGRAM_PATTERN, INSTAGRAM_NON_PROFILES, 'https://instagram.com/'),
  };
}

// Widgets and pixels (plugins, sharer, tr) often appear before the page's own
// profile link, so every match is considered rather than only the first.
function firstValidHandle(
  haystack: string,
  pattern: RegExp,
  excluded: Set<string>,
  prefix: string,
): string | null {
  const scanner = new RegExp(pattern.source, 'gi');
  let match = scanner.exec(haystack);
  while (match !== null) {
    if (!excluded.has(match[1].toLowerCase())) return `${prefix}${match[1]}`;
    match = scanner.exec(haystack);
  }
  return null;
}

function whatsAppLinkIn(haystack: string): string | null {
  const link = haystack.match(WA_LINK_PATTERN);
  return link ? `+${link[1].replace(/\D/g, '')}` : null;
}

async function fetchPageHtml(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
      headers: { accept: 'text/html' },
    });
    if (!response.ok) return null;
    return (await response.text()).slice(0, PAGE_BYTE_CAP);
  } catch {
    return null;
  }
}

export function extractContact(result: RetrievalResult): FoundContact | null {
  const haystack = `${result.title} ${result.text ?? result.snippet ?? ''}`;
  const link = haystack.match(WA_LINK_PATTERN);
  if (link) return { number: `+${link[1].replace(/\D/g, '')}`, kind: 'whatsapp-link' };
  const mobile = haystack.match(MOBILE_PATTERN);
  if (mobile) return { number: normalizeMalaysian(mobile[0]), kind: 'mobile' };
  const landline = landlineWithContext(haystack);
  return landline ? { number: normalizeMalaysian(landline), kind: 'landline' } : null;
}

function landlineWithContext(haystack: string): string | null {
  const pattern = new RegExp(LANDLINE_PATTERN.source, 'g');
  let match = pattern.exec(haystack);
  while (match !== null) {
    const windowStart = Math.max(0, match.index - CONTEXT_WINDOW);
    if (LANDLINE_CONTEXT.test(haystack.slice(windowStart, match.index))) return match[0];
    match = pattern.exec(haystack);
  }
  return null;
}

function normalizeMalaysian(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.startsWith('60') ? `+${digits}` : `+6${digits}`;
}

export function operatorNameFrom(result: RetrievalResult): string {
  const head = result.title.split(/\s*[|•·]\s*|\s+-\s+/)[0].trim();
  if (head.length >= 3) return head;
  try {
    return new URL(result.url).hostname.replace(/^www\./, '');
  } catch {
    return result.title || result.url;
  }
}
