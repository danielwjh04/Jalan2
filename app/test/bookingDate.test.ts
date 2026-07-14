import { describe, expect, it } from "vitest";
import { formatBookingDate } from "../src/lib/bookingDate";

describe("formatBookingDate", () => {
  it("formats both date-only and full ISO booking values", () => {
    expect(formatBookingDate("2026-07-17", "en-GB")).toBe("Fri, 17 Jul 2026");
    expect(formatBookingDate("2026-07-17T09:00:00.000Z", "en-GB")).toBe("Fri, 17 Jul 2026");
  });

  it("does not expose Invalid Date for malformed input", () => {
    expect(formatBookingDate("not-a-date", "en-GB")).toBe("Date unavailable");
  });
});
