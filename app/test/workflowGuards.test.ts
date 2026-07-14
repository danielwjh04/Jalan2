import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const directory = dirname(fileURLToPath(import.meta.url));
const read = (path: string): string => readFileSync(
  resolve(directory, `../src/${path}`),
  "utf8",
);

describe("trip planner workflow guards", () => {
  it("keeps search results visible when adding a destination fails", () => {
    const source = read("lib/useTripPlanner.ts");

    expect(source).toContain("Promise<boolean>");
    expect(source).toContain("const added = await run");
    expect(source).toContain("if (added) context.setSearchResults([])");
  });

  it("disables search and add actions while a request is active", () => {
    const source = read("components/DestinationSearch.tsx");

    expect(source).toContain("if (!disabled) void props.onSearch(props.query)");
    expect(source).toContain("busy={busy}");
    expect(source).toContain("disabled={busy}");
  });
});
