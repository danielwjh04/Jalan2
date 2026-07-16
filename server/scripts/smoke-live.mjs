/* global process, fetch, URL */
import { readFile } from "node:fs/promises";

const baseUrl = process.env.JALAN2_API_URL ?? "http://localhost:3001";
const checks = [];

async function request(name, path, init) {
  const started = Date.now();
  const response = await fetch(`${baseUrl}${path}`, init);
  const body = await response.json();
  if (!response.ok) throw new Error(`${name} failed (${response.status}): ${JSON.stringify(body)}`);
  checks.push({ name, status: response.status, durationMs: Date.now() - started, result: summarize(name, body) });
  return body;
}

function summarize(name, body) {
  if (name === "route suggestions") return { count: body.length, items: body.slice(0, 3).map((item) => ({ name: item.name, rating: item.rating, detourMeters: item.route_distance_meters })) };
  if (name === "Gopeng route") return { stops: body.stops.length, transport: body.stops.filter((stop) => stop.transport_provider).map((stop) => ({ provider: stop.transport_provider, from: stop.transport_from, to: stop.transport_to })) };
  if (name.includes("menu")) return { servedFrom: body.servedFrom, dishes: body.menu.dishes.length, photographed: body.menu.dishes.filter((dish) => dish.image_url).length, names: body.menu.dishes.map((dish) => `${dish.name_local} | ${dish.name_english}`) };
  return body;
}

async function liveMenuPayload() {
  const image = await readFile(new URL("../fixtures/menu/kopitiam-01/images/menu-board.png", import.meta.url));
  return JSON.stringify({ imageBase64: image.toString("base64"), mimeType: "image/png" });
}

await request("health", "/health");
await request("Gopeng route", "/trips/kl-gopeng-cave-and-rapids");
await request("route suggestions", "/trips/kl-gopeng-cave-and-rapids/suggestions");
await request("cached menu", "/menu/demo", { method: "POST" });
await request("live menu", "/menu", { method: "POST", headers: { "content-type": "application/json" }, body: await liveMenuPayload() });

console.info(JSON.stringify({ ok: true, baseUrl, checks }, null, 2));
