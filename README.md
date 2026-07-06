# Jalan2

Turn a TikTok or Xiaohongshu adventure video into a booked Malaysian trip.
Paste (or share) the link; Jalan2 extracts the operator, activity, price, and
meeting point into an itinerary card with a map and transit hand-off, then
books it over WhatsApp. The operator confirms by replying YES.

```
paste/share URL -> extract -> transcribe + read frames -> Booking JSON
-> itinerary + map + transit link -> WhatsApp send -> YES -> CONFIRMED
```

## Layout

- `app/` Expo (React Native) client
- `server/` Node/Express backend; owns all API keys and the pipeline
- `shared/` Booking JSON schema and logic used by both
- `docs/` provider setup, iOS share-extension build, demo runbook

External services are swappable by env var (`server/.env`): extractor,
speech-to-text, and messaging (Twilio WhatsApp, Telegram, or a mock).
`PIPELINE_MODE=cached` runs the whole demo offline from cached bookings.

## Run it

Server (no keys needed in cached mode):

```
cd server
npm install
copy .env.example .env
npm run dev
```

App (Expo Go on a phone, same Wi-Fi):

```
cd app
npm install
npm start
```

Tap a demo video on the home screen, book it, then confirm as the operator:

```
curl -X POST http://localhost:3001/webhooks/mock -H "Content-Type: application/json" -d "{\"from\":\"mock:operator\",\"text\":\"YES\"}"
```

More detail: [docs/provider-setup.md](docs/provider-setup.md),
[docs/mac-share-build.md](docs/mac-share-build.md),
[docs/demo-runbook.md](docs/demo-runbook.md).

## Why Expo SDK 54

The app is intentionally pinned to Expo SDK 54, not the latest release. As of
mid 2026 the Expo Go app on the Apple App Store only runs SDK 54 projects;
newer SDKs require a custom Expo Go build through TestFlight (paid Apple
Developer account) or a full dev build (needs a Mac). Pinning to 54 keeps the
whole app testable on a stock iPhone with the free App Store Expo Go while
developing on Windows. SDK 54 has every feature this app uses (expo-router,
react-native-maps, clipboard, share intent, linear gradient). Dev builds for
the iOS share extension are unaffected; they build whatever SDK the repo pins.
Do not bump the SDK without checking what Expo Go on the App Store supports.

## Checks

`npm run typecheck && npm run lint && npm test` at the repo root covers all
three packages. After editing `shared/`, `npm start` in `app/` re-syncs it
automatically.
