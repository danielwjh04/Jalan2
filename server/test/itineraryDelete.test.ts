import type { Server } from "node:http";
import express from "express";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { itineraryRouter } from "../src/routes/itinerary";
import {
  createItinerary,
  getItinerary,
  resetItineraries,
  setItineraryError,
} from "../src/store/itineraries";

let server: Server | null = null;

beforeEach(() => resetItineraries());
afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve) => server?.close(() => resolve()));
  server = null;
});

describe("failed itinerary deletion", () => {
  it("deletes a failed itinerary", async () => {
    const item = createItinerary("https://example.com/video");
    setItineraryError(item.id, "Extraction failed");

    const response = await requestDelete(item.id);

    expect(response.status).toBe(204);
    expect(getItinerary(item.id)).toBeUndefined();
  });

  it("does not delete an active itinerary", async () => {
    const item = createItinerary("https://example.com/video");

    const response = await requestDelete(item.id);

    expect(response.status).toBe(409);
    expect(getItinerary(item.id)).toBeDefined();
  });
});

async function requestDelete(id: string): Promise<Response> {
  const app = express();
  app.use(itineraryRouter());
  server = app.listen(0);
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing test port");
  return fetch(`http://127.0.0.1:${address.port}/itinerary/${id}`, {
    method: "DELETE",
  });
}
