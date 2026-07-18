import { describe, expect, it } from "vitest";
import type { TripStop } from "../src/shared/trip";
import { grabBookingUrl } from "../src/lib/grabLink";

describe("Grab ride deep links", () => {
  it("passes the exact next-stop coordinates and address to Grab", () => {
    const stop = {
      id: "kellies-castle",
      name: "Kellie's Castle",
      address: "Batu Gajah, Perak",
      location: { lat: 4.4745, lng: 101.087 },
    } as TripStop;

    const link = new URL(grabBookingUrl(stop));
    expect(link.hostname).toBe("grab.onelink.me");
    expect(link.searchParams.get("af_force_deeplink")).toBe("true");

    const appLink = new URL(link.searchParams.get("af_dp")!);
    expect(appLink.protocol).toBe("grab:");
    expect(appLink.searchParams.get("screenType")).toBe("BOOKING");
    expect(appLink.searchParams.get("dropOffLatitude")).toBe("4.4745");
    expect(appLink.searchParams.get("dropOffLongitude")).toBe("101.087");
    expect(appLink.searchParams.get("dropOffAddress")).toBe("Batu Gajah, Perak");
  });
});
