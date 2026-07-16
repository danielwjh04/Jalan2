import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const directory = dirname(fileURLToPath(import.meta.url));
const sourceRoot = resolve(directory, "../src");
const read = (name: string): string => readFileSync(
  resolve(sourceRoot, `components/${name}.tsx`),
  "utf8",
);
const readPath = (path: string): string => readFileSync(resolve(sourceRoot, path), "utf8");

describe("booking states", () => {
  it("shows the shared three-step progress", () => {
    const source = read("BookingProgress");
    for (const label of ["Draft", "Waiting", "Confirmed"]) expect(source).toContain(label);
  });

  it("gives every state specific Bobo guidance and recovery", () => {
    const source = read("BookingHero") + read("BookingPanel");
    for (const copy of [
      "Ready when you are",
      "Waiting for operator",
      "Confirmed lah!",
      "booking needs attention",
      "Start a fresh trip",
    ]) expect(source).toContain(copy);
  });

  it("keeps confirmation focused through the WhatsApp updates", () => {
    const source = read("BookingPanel");
    for (const name of ["BookSheet", "BookingMessages", "Back to my itinerary", "Chat on WhatsApp"]) {
      expect(source).toContain(name);
    }
    expect(source).not.toContain("SafetyBriefCard");
    expect(source).toContain('view !== "confirmed"');
  });

  it("reroutes a newly confirmed booking and returns without reopening it", () => {
    const section = read("TripBookingSection");
    const planner = read("TripPlanner");
    const tripRoute = readPath("app/(tabs)/trip/[id].tsx");
    const bookingRoute = readPath("app/(tabs)/itinerary/[id].tsx");
    expect(section).toContain('itinerary?.status === "CONFIRMED"');
    expect(section).toContain("router.replace(`/itinerary/${bookingId}`)");
    expect(section).toContain("if (confirmed) return null");
    expect(planner).toContain("confirmationSeen={props.confirmationSeen}");
    expect(tripRoute).toContain('confirmationSeen={confirmationSeen === "1"}');
    expect(bookingRoute).toContain('bookingViewFor(itinerary, null) === "confirmed"');
    expect(bookingRoute).toContain('confirmationSeen: "1"');
    expect(bookingRoute).toContain("!confirmed && itinerary.booking");
  });
});
