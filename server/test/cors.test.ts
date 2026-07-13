import { describe, expect, it } from "vitest";
import { isAllowedDemoOrigin } from "../src/lib/cors";

describe("isAllowedDemoOrigin", () => {
  it("allows local Expo web origins", () => {
    expect(isAllowedDemoOrigin("http://127.0.0.1:8082")).toBe(true);
    expect(isAllowedDemoOrigin("http://localhost:8082")).toBe(true);
  });

  it("does not reflect arbitrary origins", () => {
    expect(isAllowedDemoOrigin("https://example.com")).toBe(false);
    expect(isAllowedDemoOrigin("http://localhost.example.com:8082")).toBe(
      false,
    );
  });
});
