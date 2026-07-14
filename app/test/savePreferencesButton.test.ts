import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const directory = dirname(fileURLToPath(import.meta.url));

describe("save preferences feedback", () => {
  it("animates between the save and saved labels", () => {
    const source = readFileSync(
      resolve(directory, "../src/components/SavePreferencesButton.tsx"),
      "utf8",
    );

    expect(source).toContain("Animated.parallel");
    expect(source).toContain('const USE_NATIVE_DRIVER = Platform.OS !== "web"');
    expect(source).toContain("useNativeDriver: USE_NATIVE_DRIVER");
    expect(source).toContain('saved ? "Saved" : "Save preferences"');
  });
});
