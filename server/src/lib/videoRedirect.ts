import { normalizeVideoUrl } from "@shared/videoUrl";

type FetchLike = typeof fetch;

const MAX_REDIRECTS = 5;
const RESOLVE_TIMEOUT_MS = 8_000;

/**
 * XHS creates a new xhslink.com URL whenever the same post is shared. Resolve
 * that temporary URL to the stable discovery/item ID before fixture lookup so
 * one cached guide works for every share of the same post.
 */
export async function resolveVideoShareUrl(
  normalizedUrl: string,
  fetchImpl: FetchLike = fetch,
): Promise<string> {
  const initial = new URL(normalizedUrl);
  if (initial.hostname !== "xhslink.com") return normalizedUrl;

  let current = initial;
  try {
    for (let index = 0; index < MAX_REDIRECTS; index += 1) {
      const response = await fetchImpl(current, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(RESOLVE_TIMEOUT_MS),
        headers: {
          "user-agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
        },
      });
      await response.body?.cancel();
      const location = response.headers.get("location");
      if (!location) break;

      const next = new URL(location, current);
      if (!isTrustedXhsHost(next.hostname)) break;
      current = next;

      if (isXiaohongshuHost(current.hostname)) {
        return normalizeVideoUrl(current.toString())?.url ?? normalizedUrl;
      }
    }
  } catch (error) {
    console.warn(`[ingest] XHS short-link resolution failed: ${(error as Error).message}`);
  }

  return normalizedUrl;
}

function isTrustedXhsHost(hostname: string): boolean {
  return hostname === "xhslink.com" || isXiaohongshuHost(hostname);
}

function isXiaohongshuHost(hostname: string): boolean {
  return hostname === "xiaohongshu.com" || hostname.endsWith(".xiaohongshu.com");
}
