import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../src");
const read = (path: string): string =>
  readFileSync(resolve(root, path), "utf8");

describe("trip reservation UI", () => {
  it("reviews before sending and restores progress", () => {
    const api = read("lib/api.ts");
    const hook = read("lib/useTripReservations.ts");

    expect(api).toContain("previewTripReservations");
    expect(api).toContain("createTripReservations");
    expect(api).toContain("getCurrentTripReservation");
    expect(hook).toContain("setInterval");
    expect(hook).toContain("clearInterval");
  });

  it("places one reservation section on editable trips", () => {
    const planner = read("components/TripPlanner.tsx");
    const section = read("components/TripReservationSection.tsx");
    const review = read("components/ReservationReviewCard.tsx");

    expect(planner).toContain("TripReservationSection");
    expect(section).toContain("Reserve my trip");
    expect(review).toContain("Send reservation requests");
    expect(section).toContain("Bobo is checking with each place separately");
  });
});
