import { describe, expect, it } from "vitest";
import type { TripStop } from "@shared/trip";
import { reservationEligibility } from "../src/services/reservationEligibility";

const stop = {
  id: "stop-1",
  name: "Local place",
  summary: "Spend time here.",
  location: { lat: 3.1, lng: 101.7 },
  image_url: null,
  place_photo_available: false,
  place_photo_attributions: [],
  image_attributions: [],
  estimated_spend_myr: null,
  duration_minutes: 60,
  sources: [{ title: "Source", url: "https://example.com" }],
  primary_type: null,
  reservation_hint: null,
} satisfies TripStop;

describe("reservationEligibility", () => {
  it("uses explicit curated hints before place types", () => {
    expect(
      reservationEligibility(
        { ...stop, reservation_hint: "walk_in", primary_type: "restaurant" },
        true,
      ),
    ).toBe("WALK_IN");
    expect(
      reservationEligibility({ ...stop, reservation_hint: "bookable" }, true),
    ).toBe("BOOKABLE");
  });

  it("recognizes bookable and walk-in Google place types", () => {
    expect(
      reservationEligibility({ ...stop, primary_type: "restaurant" }, true),
    ).toBe("BOOKABLE");
    expect(
      reservationEligibility({ ...stop, primary_type: "shopping_mall" }, true),
    ).toBe("WALK_IN");
  });

  it("does not expose a bookable stop without an approved contact", () => {
    expect(
      reservationEligibility({ ...stop, reservation_hint: "bookable" }, false),
    ).toBe("CONTACT_UNAVAILABLE");
    expect(reservationEligibility(stop, true)).toBe("WALK_IN");
  });
});
