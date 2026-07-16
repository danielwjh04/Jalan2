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
  it("keeps the full route catalog in Discover instead of duplicating it on Home", () => {
    const home = read("app/(tabs)/index.tsx");
    const discover = read("app/(tabs)/discover.tsx");

    expect(home).not.toContain("HomeDiscoveryPreview");
    expect(home).not.toContain("filter(({ featured }) => !featured)");
    expect(discover).toContain("getDiscoveries");
    expect(discover).toContain("DiscoveryCard");
    expect(discover).not.toContain("getFixtures");
  });

  it("opens community guide cards as trips without submitting a video", () => {
    const showcase = read("components/DemoFlowShowcase.tsx");

    expect(showcase).toContain("onOpen(discovery.id)");
    expect(showcase).toContain("Guides other users created");
    expect(showcase).not.toMatch(/DEMO \{String\(index \+ 1\)/);
  });
});
