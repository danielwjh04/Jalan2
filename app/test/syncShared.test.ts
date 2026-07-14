import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const directory = dirname(fileURLToPath(import.meta.url));

describe("shared source sync", () => {
  it("keeps the target directory mounted while Metro is running", () => {
    const source = readFileSync(resolve(directory, "../scripts/sync-shared.js"), "utf8");

    expect(source).toContain("removeStaleEntries");
    expect(source).not.toContain("rmSync(target,");
  });
});
