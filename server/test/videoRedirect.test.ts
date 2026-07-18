import { describe, expect, it, vi } from "vitest";
import { resolveVideoShareUrl } from "../src/lib/videoRedirect";
import { livePipelineUrl } from '../src/routes/ingest';

describe("resolveVideoShareUrl", () => {
  it("resolves a rotating XHS share link to the stable post ID", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, {
      status: 302,
      headers: {
        location: "https://www.xiaohongshu.com/discovery/item/692bb849000000001e02a6ce?share_id=new",
      },
    })) as unknown as typeof fetch;

    await expect(resolveVideoShareUrl(
      "https://xhslink.com/m/2x9CE6g3qRh",
      fetchImpl,
    )).resolves.toBe(
      "https://xiaohongshu.com/discovery/item/692bb849000000001e02a6ce",
    );
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("leaves non-short URLs untouched", async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const url = "https://www.tiktok.com/@jalan2/video/123";
    await expect(resolveVideoShareUrl(url, fetchImpl)).resolves.toBe(url);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("falls back to the original short URL when resolution fails", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    const url = "https://xhslink.com/m/temporary";
    await expect(resolveVideoShareUrl(url, fetchImpl)).resolves.toBe(url);
  });
});

describe('livePipelineUrl', () => {
  it('keeps the XHS share URL for extraction after using the stable ID for cache lookup', () => {
    expect(livePipelineUrl(
      'https://xhslink.com/o/temporary',
      'https://xiaohongshu.com/discovery/item/abc',
    )).toBe('https://xhslink.com/o/temporary');
  });
});
