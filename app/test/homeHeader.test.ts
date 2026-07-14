import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(
  resolve(testDirectory, "../src/components/HomeHeader.tsx"),
  "utf8",
);

describe("HomeHeader", () => {
  it("does not render a decorative signal in the top-right corner", () => {
    expect(source).not.toContain("styles.signal");
    expect(source).not.toContain("signalDot");
  });
});
