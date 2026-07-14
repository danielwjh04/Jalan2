import type { Server } from "node:http";
import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import { isAllowedDemoOrigin, localWebCors } from "../src/lib/cors";

let server: Server | null = null;

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve) => server?.close(() => resolve()));
  server = null;
});

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

  it("allows browser trip edits and destination deletion", async () => {
    const app = express();
    app.use(localWebCors);
    app.options("/trip", (_req, res) => res.sendStatus(204));
    server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing test port");

    const response = await fetch(`http://127.0.0.1:${address.port}/trip`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:8091",
        "Access-Control-Request-Method": "PATCH",
      },
    });
    const methods = response.headers.get("access-control-allow-methods") ?? "";

    expect(methods).toContain("PATCH");
    expect(methods).toContain("DELETE");
  });
});
