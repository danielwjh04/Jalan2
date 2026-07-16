import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const heroPath = resolve(testDirectory, "../src/components/HomeHero.tsx");
const source = existsSync(heroPath) ? readFileSync(heroPath, "utf8") : "";

describe("HomeHero", () => {
  it("places the waving Bobo in front of the Jalan2 promise", () => {
    expect(source).toContain("bobo.png");
    expect(source).toContain("Turn travel finds into guides you can actually use.");
    expect(source).toContain("zIndex: 2");
    expect(source).toContain("position: \"absolute\"");
    expect(source).not.toContain("wordmarkDot");
    expect(source).not.toContain("Discovering now");
  });
});
