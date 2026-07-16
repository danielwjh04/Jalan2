import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const directory = dirname(fileURLToPath(import.meta.url));
const read = (path: string): string => readFileSync(resolve(directory, `../src/${path}`), "utf8");

describe("refreshed screens", () => {
  it("keeps Home focused without repeating the Discover route catalog", () => {
    const source = read("app/(tabs)/index.tsx");
    expect(source).toContain("CoreProductFlows");
    expect(source).toContain("DemoFlowShowcase");
    expect(source).not.toContain("HomeDiscoveryPreview");
  });

  it("uses the shared header and recovery system on menu", () => {
    const source = read("app/(tabs)/menu/[id].tsx");
    expect(source).toContain("ScreenHeader");
    expect(source).toContain("StateCard");
    expect(source).toContain("SwipeDeck");
  });

  it("uses the shared header and recovery system on experience records", () => {
    const source = read("app/(tabs)/experience/[id].tsx");
    expect(source).toContain("ScreenHeader");
    expect(source).toContain("StateCard");
    expect(source).toContain("ReviewForm");
  });
});
