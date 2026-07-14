import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const directory = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(directory, "../src/app");
const read = (path: string): string => readFileSync(resolve(appRoot, path), "utf8");

describe("four-tab layout", () => {
  it("registers four visible destinations and five hidden routes", () => {
    const layout = read("(tabs)/_layout.tsx");
    expect(layout.match(/<Tabs.Screen/g)).toHaveLength(9);
    for (const name of ["index", "discover", "trips", "you"]) {
      expect(layout).toContain(`name="${name}"`);
    }
    for (const name of ["directory", "trip/[id]", "itinerary/[id]", "menu/[id]", "experience/[id]"]) {
      expect(layout).toContain(`name="${name}"`);
    }
    expect(layout.match(/href: null/g)).toHaveLength(5);
  });

  it("keeps detail URLs inside the tab group", () => {
    for (const path of ["trip/[id].tsx", "itinerary/[id].tsx", "menu/[id].tsx", "experience/[id].tsx"]) {
      expect(existsSync(resolve(appRoot, "(tabs)", path))).toBe(true);
      expect(existsSync(resolve(appRoot, path))).toBe(false);
    }
    expect(read("_layout.tsx")).not.toContain('name="trip/[id]"');
  });

  it("filters hidden routes and maps them to a primary active tab", () => {
    const tabBar = readFileSync(resolve(directory, "../src/components/GlassTabBar.tsx"), "utf8");
    expect(tabBar).toContain("PRIMARY_TABS");
    expect(tabBar).toContain("activeTabForRouteName");
  });
});
