import { describe, expect, it } from "vitest";
import { PRIMARY_TABS, activeTabForRouteName } from "../src/lib/navigation";

describe("primary navigation", () => {
  it("contains exactly the four approved tabs", () => {
    expect(PRIMARY_TABS.map((tab) => tab.name)).toEqual([
      "index",
      "discover",
      "trips",
      "you",
    ]);
  });

  it.each([
    ["index", "index"],
    ["menu/[id]", "index"],
    ["discover", "discover"],
    ["directory", "discover"],
    ["experience/[id]", "discover"],
    ["trips", "trips"],
    ["trip/[id]", "trips"],
    ["itinerary/[id]", "trips"],
    ["you", "you"],
  ] as const)("maps %s to %s", (route, expected) => {
    expect(activeTabForRouteName(route)).toBe(expected);
  });
});
