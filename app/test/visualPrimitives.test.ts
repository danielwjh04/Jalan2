import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const directory = dirname(fileURLToPath(import.meta.url));
const read = (name: string): string => readFileSync(
  resolve(directory, `../src/components/${name}.tsx`),
  "utf8",
);

describe("visual primitives", () => {
  it("uses accessible navigation and recovery controls", () => {
    expect(read("ScreenHeader")).toContain('accessibilityLabel="Go back"');
    expect(read("SegmentedControl")).toContain('accessibilityRole="tab"');
    expect(read("StateCard")).toContain("actionLabel");
  });

  it("keeps elevated surfaces on the shared token system", () => {
    const source = read("SurfaceCard");
    expect(source).toContain("colors.card");
    expect(source).toContain("cardShadow");
    expect(source).toContain("radius.card");
  });
});
