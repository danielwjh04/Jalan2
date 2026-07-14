import { describe, expect, it } from "vitest";
import {
  nextMalaysiaDates,
  reservationProgressLabel,
  reservationStatusLabel,
} from "../src/lib/reservationPresentation";

describe("reservation presentation", () => {
  it("offers three Malaysian calendar dates", () => {
    expect(nextMalaysiaDates(new Date("2026-07-15T18:00:00+08:00"))).toEqual([
      "2026-07-16",
      "2026-07-17",
      "2026-07-18",
    ]);
  });

  it("uses clear stop and batch labels", () => {
    expect(reservationStatusLabel("PENDING_CONFIRM")).toBe("Waiting for reply");
    expect(reservationStatusLabel("SKIPPED", "WALK_IN")).toBe("Walk in");
    expect(
      reservationProgressLabel({
        confirmed: 1,
        waiting: 2,
        declined: 0,
        failed: 0,
        walkIn: 1,
        contactUnavailable: 0,
      }),
    ).toBe("1 confirmed, 2 waiting");
  });
});
