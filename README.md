# Jalan2

Turn a TikTok or Xiaohongshu adventure video into a booked, mapped Malaysian
trip. Paste (or share) the video link; Jalan2 extracts the operator, activity,
price, and meeting point into a bookable itinerary, pins it on a map with a
transit hand-off, and closes the booking over WhatsApp with the operator
confirming by replying YES.

## How it works

```
paste/share URL -> extract media -> transcribe audio -> read frames ->
fuse into Booking JSON -> itinerary card + map + transit link ->
"Book" sends WhatsApp -> operator replies YES -> CONFIRMED + directory opt-in
```

- `app/` Expo (React Native) client. Paste bar and iOS share extension feed
  the same ingest handler.
- `server/` Node/Express backend. Owns all API keys, runs the extraction
  pipeline, sends/receives operator messages via webhook.
- `shared/` The Booking JSON zod schema and pure logic used by both sides.
- `docs/` Provider setup, iOS share-extension build, demo runbook.

Every external service sits behind an adapter selected by env var: video
extractor (`fixture` | `tikhub`), speech-to-text (`openai` | `elevenlabs`),
messaging (`mock` | `twilio` | `telegram`). Switching is a config change.
`PIPELINE_MODE=auto` falls back to per-fixture cached bookings so the demo
survives offline.

## Quickstart

Server (works with zero keys in cached mode):

```
cd server
npm install
copy .env.example .env
npm run dev
```

App (Expo Go on a phone, same Wi-Fi as the server):

```
cd app
npm install
npm start        # syncs shared/ then starts Metro; scan the QR in Expo Go
```

The home screen lists the curated demo videos served by `GET /fixtures`.
Booking with `MESSAGING_PROVIDER=mock` logs the operator message server-side;
confirm it with:

```
curl -X POST http://localhost:3001/webhooks/mock -H "Content-Type: application/json" -d "{\"from\":\"mock:operator\",\"text\":\"YES\"}"
```

## Development

- `npm run typecheck && npm run lint && npm test` at the repo root covers all
  three packages.
- After editing `shared/`, run `npm run sync-shared` in `app/` (start and
  typecheck do it automatically).
- The iOS share extension needs a dev build on a Mac; see
  [docs/mac-share-build.md](docs/mac-share-build.md). Everything else runs in
  Expo Go, including on Windows.
- Live pipeline setup and messaging providers: see
  [docs/provider-setup.md](docs/provider-setup.md).
