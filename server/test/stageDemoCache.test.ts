import { describe, expect, it } from "vitest";
import { normalizeVideoUrl } from "@shared/videoUrl";
import {
  loadCachedBooking,
  loadCachedTrip,
  resolveFixtureSlug,
} from "../src/lib/fixtures";

const SHARED_XHS_URL = "http://xhslink.com/o/8GLTfuGOS5T";

describe("stage demo cache", () => {
  it("maps the shared XHS link to a complete cached journey", () => {
    const normalized = normalizeVideoUrl(SHARED_XHS_URL);
    expect(normalized?.url).toBe("https://xhslink.com/o/8GLTfuGOS5T");

    const slug = normalized ? resolveFixtureSlug(normalized.url) : null;
    expect(slug).toBe("xhs-ipoh-gopeng-demo-04");
    if (!slug) throw new Error("Expected the shared XHS fixture");

    const trip = loadCachedTrip(slug);
    expect(trip?.title).toBe("Ipoh 3D2N: hot springs, rafting & hidden eats");
    expect(trip?.source_creator).toBe("小霈霈奇遇记");
    expect(trip?.stops).toHaveLength(15);
    expect(trip?.selected_stop_ids[0]).toBe("kl-ipoh-intercity");
    expect(trip?.selected_stop_ids.at(-1)).toBe("ipoh-kl-intercity");
    expect(trip?.preferences?.journey_origin).toBe("Kuala Lumpur");
    expect(trip?.preferences?.journey_end).toBe("Kuala Lumpur");
    expect(trip?.preferences?.return_to_origin).toBe(true);
    expect(trip?.planning?.days).toHaveLength(3);
    expect(trip?.planning?.days.at(-1)?.stop_ids.at(-1)).toBe("ipoh-kl-intercity");
    expect(trip?.planning?.legs).toHaveLength(14);
    expect(trip?.planning?.handoffs.map((item) => item.provider)).toEqual(
      expect.arrayContaining(["KTM ETS", "EasyBook", "Optional Ipoh driver", "Gopeng rafting operator", "Agoda"]),
    );
    expect(trip?.planning?.critique?.verdict).toBe("check_needed");
    expect(trip?.route?.warnings).toHaveLength(4);
    expect(loadCachedBooking(slug)).not.toBeNull();
  });
});
