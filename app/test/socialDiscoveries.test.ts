import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const directory = dirname(fileURLToPath(import.meta.url));
const read = (path: string): string => readFileSync(
  resolve(directory, `../src/${path}`),
  "utf8",
);

describe("social discoveries", () => {
  it("loads a separate curated catalog on Home and Discover", () => {
    const home = read("app/(tabs)/index.tsx");
    const discover = read("app/(tabs)/discover.tsx");

    expect(home).toContain("discoveries.slice(0, 2)");
    expect(discover).toContain("getDiscoveries");
    expect(discover).toContain("DiscoveryCard");
    expect(discover).not.toContain("getFixtures");
  });

  it("opens curated cards as trips without submitting a video", () => {
    const sections = read("components/HomeSections.tsx");

    expect(sections).toContain("DiscoveryCard");
    expect(sections).toContain("onOpen(discovery.id)");
    expect(sections).not.toContain("onSubmit(discovery");
  });
});
