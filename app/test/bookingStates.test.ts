import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const directory = dirname(fileURLToPath(import.meta.url));
const read = (name: string): string => readFileSync(
  resolve(directory, `../src/components/${name}.tsx`),
  "utf8",
);

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

  it("retains booking, messages, safety, trip, and WhatsApp actions", () => {
    const source = read("BookingPanel");
    for (const name of ["BookSheet", "BookingMessages", "SafetyBriefCard", "View my trip", "Chat on WhatsApp"]) {
      expect(source).toContain(name);
    }
  });
});
