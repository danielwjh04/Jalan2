import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  Linking: { openURL: vi.fn() },
}));

import { tryOpenExternalUrl } from "../src/lib/externalLink";

describe("tryOpenExternalUrl", () => {
  it("returns true when the platform opens the URL", async () => {
    expect(
      await tryOpenExternalUrl("https://example.com", async () => {}),
    ).toBe(true);
  });

  it("returns false instead of leaking a rejected promise", async () => {
    expect(
      await tryOpenExternalUrl("https://example.com", async () => {
        throw new Error("Unable to open URL");
      }),
    ).toBe(false);
  });
});
