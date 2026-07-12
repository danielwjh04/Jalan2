import type { BookingJson, Trust } from '@shared/booking';
import type { Retrieval, RetrievalResult } from '../adapters/retrieval/types';

const TOP_RESULTS = 5;
const MAX_EVIDENCE = 3;

function tokens(operatorName: string): string[] {
  return operatorName
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function matches(result: RetrievalResult, operatorTokens: string[]): boolean {
  const haystack = `${result.title} ${result.snippet ?? ''}`.toLowerCase();
  const hits = operatorTokens.filter((token) => haystack.includes(token)).length;
  return hits >= Math.ceil(operatorTokens.length / 2);
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// Pure web-presence heuristic: the fraction of top results that plausibly
// reference the operator. Zero matches means null, never a guessed score.
// This is due diligence framing, not certification.
export function scoreTrust(operatorName: string, results: RetrievalResult[]): Trust | null {
  const operatorTokens = tokens(operatorName);
  if (operatorTokens.length === 0 || results.length === 0) return null;
  const top = results.slice(0, TOP_RESULTS);
  const matching = top.filter((result) => matches(result, operatorTokens));
  if (matching.length === 0) return null;
  return {
    score: Math.min(1, matching.length / TOP_RESULTS),
    evidence: matching
      .slice(0, MAX_EVIDENCE)
      .map((result) =>
        `${domainOf(result.url)}: ${result.snippet ?? result.title}`.replace(/\s+/g, ' ').trim(),
      ),
  };
}

export async function enrichTrust(
  retrieval: Retrieval,
  booking: BookingJson,
): Promise<BookingJson> {
  const results = await retrieval.search(`${booking.operator_name} Malaysia reviews`, TOP_RESULTS);
  return { ...booking, trust: scoreTrust(booking.operator_name, results) };
}
