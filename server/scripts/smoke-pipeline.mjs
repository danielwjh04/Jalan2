/* global process, fetch, setTimeout */
const baseUrl = process.env.JALAN2_API_URL ?? "http://localhost:3001";
const sourceUrl = process.env.JALAN2_SMOKE_SOURCE ?? "https://vt.tiktok.com/ZSXM9APNJ/";

const created = await jsonRequest("/ingest", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ url: sourceUrl }),
});
if (created.kind !== "booking") throw new Error("Smoke source unexpectedly used a prepared fixture");

const started = Date.now();
let itinerary;
while (Date.now() - started < 150_000) {
  await delay(2_000);
  itinerary = await jsonRequest(`/itinerary/${created.id}`);
  if (itinerary.stage === "READY" || itinerary.stage === "ERROR") break;
}

if (!itinerary || itinerary.stage !== "READY" || !itinerary.booking) {
  throw new Error(`Live pipeline failed at ${itinerary?.stage ?? "timeout"}: ${itinerary?.error ?? "no result"}`);
}

console.info(JSON.stringify({
  ok: true,
  durationMs: Date.now() - started,
  stage: itinerary.stage,
  servedFrom: itinerary.servedFrom,
  tripCreated: Boolean(itinerary.tripId),
  coverCreated: Boolean(itinerary.coverUrl),
  operatorExtracted: Boolean(itinerary.booking.operator_name),
  activityExtracted: Boolean(itinerary.booking.activity),
  meetingPointAnchored: Number.isFinite(itinerary.booking.meeting_point?.lat),
  trustEvidenceCount: itinerary.booking.trust?.evidence?.length ?? 0,
}, null, 2));

async function jsonRequest(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const body = await response.json();
  if (!response.ok) throw new Error(`${path} failed (${response.status}): ${JSON.stringify(body)}`);
  return body;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
