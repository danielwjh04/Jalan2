import type { Server } from "node:http";
import express from "express";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createOfflinePlaces } from "../src/adapters/places/offline";
import { createOfflineRouting } from "../src/adapters/routing/offline";
import { tripsRouter } from "../src/routes/trips";
import {
  copyDiscoveryTrip,
  getTrip,
  listSavedTrips,
  resetTrips,
} from "../src/store/trips";

let server: Server | null = null;

beforeEach(() => resetTrips());
afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve) => server?.close(() => resolve()));
  server = null;
});

describe("saved discovery trips", () => {
  it("deep copies a curated journey and keeps retries idempotent", () => {
    const original = getTrip("melaka-river-and-heritage");
    if (!original) throw new Error("Missing discovery fixture");

    const first = copyDiscoveryTrip(original.id, "request-1");
    const retried = copyDiscoveryTrip(original.id, "request-1");

    expect(first.id).not.toBe(original.id);
    expect(first.origin).toBe("saved_discovery");
    expect(first.source_discovery_id).toBe(original.id);
    expect(first.stops).not.toBe(original.stops);
    expect(retried.id).toBe(first.id);
    expect(getTrip(original.id)?.origin).toBe("curated");
  });

  it("lists safe saved summaries newest first", () => {
    const first = copyDiscoveryTrip("melaka-river-and-heritage", "request-1");
    const second = copyDiscoveryTrip(
      "ipoh-old-town-and-white-coffee",
      "request-2",
    );

    const summaries = listSavedTrips();

    expect(summaries.map(({ id }) => id)).toEqual([second.id, first.id]);
    expect(summaries[0]).toEqual(
      expect.objectContaining({
        sourceDiscoveryId: "ipoh-old-town-and-white-coffee",
        stopCount: 4,
      }),
    );
    expect(JSON.stringify(summaries)).not.toMatch(
      /whatsapp|operatorAddress|messages/i,
    );
  });

  it("rejects curated mutations and allows saved-copy mutations", async () => {
    const saved = copyDiscoveryTrip("melaka-river-and-heritage", "request-1");
    const curatedResponse = await patchTrip("melaka-river-and-heritage");
    const savedResponse = await patchTrip(saved.id);

    expect(curatedResponse.status).toBe(409);
    expect(savedResponse.status).toBe(200);
  });
});

async function patchTrip(id: string): Promise<Response> {
  const trip = getTrip(id);
  if (!trip) throw new Error("Missing trip");
  if (!server) {
    const app = express();
    app.use(express.json());
    app.use(tripsRouter(createOfflineRouting(), createOfflinePlaces()));
    server = app.listen(0);
  }
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Missing test port");
  return fetch(`http://127.0.0.1:${address.port}/trips/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      stopIds: trip.selected_stop_ids,
      preferences: trip.preferences,
    }),
  });
}
