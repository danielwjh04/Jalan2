import { readdirSync, readFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { fonts, type } from "../src/lib/theme";

const SOURCE_ROOT = resolve(process.cwd(), "app/src");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return [".ts", ".tsx"].includes(extname(path)) ? [path] : [];
  });
}

describe("typography system", () => {
  test("uses the approved DM Sans and Fraunces families and scale", () => {
    expect(fonts).toEqual({
      regular: "DMSans_400Regular",
      medium: "DMSans_500Medium",
      semibold: "DMSans_600SemiBold",
      display: "Fraunces_600SemiBold",
    });
    expect(type).toEqual({
      display: {
        fontFamily: fonts.display,
        fontSize: 30,
        lineHeight: 36,
        letterSpacing: -0.4,
      },
      title: {
        fontFamily: fonts.semibold,
        fontSize: 20,
        lineHeight: 27,
        letterSpacing: -0.3,
      },
      heading: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 23 },
      body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
      label: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
      button: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
      caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
    });
  });

  test("does not bypass the approved font families", () => {
    const source = sourceFiles(SOURCE_ROOT)
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");

    expect(source).not.toMatch(/fontWeight\s*:/);
    expect(source).not.toMatch(/fonts\.bold/);
    expect(source).not.toMatch(/PlusJakartaSans|DMSans_700Bold/);
  });
});
