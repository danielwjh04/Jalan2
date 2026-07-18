<p align="center">
  <img src="app/assets/images/bobo.png" alt="Bobo, the Jalan2 mascot, waving hello" width="200" />
</p>

<h1 align="center">Jalan2</h1>
<p align="center"><i>Turn a travel video into a bookable, mapped trip guide confirmed by the local operator over WhatsApp.</i></p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6" alt="TypeScript strict" />
  <img src="https://img.shields.io/badge/Expo-SDK%2054-000020" alt="Expo SDK 54" />
  <img src="https://img.shields.io/badge/Node-Express-339933" alt="Node and Express" />
</p>

Jalan2 is a Malaysia-focused travel app built with Expo, React Native, Node, and Express. Paste or share Xiaohongshu and TikTok links to build an editable trip guide, or photograph a menu to turn it into a swipeable dish guide. Each trip brings together places, maps, transport hand-offs, practical details, and safety information. Booking requests go to local operators through WhatsApp, so they can confirm without learning a new dashboard. Bobo, Jalan2's Malayan tapir guide, helps travelers through both flows.

## The problem

Social posts make Malaysian experiences easy to discover but hard to verify, plan, and book. At the same time, independent guides, hawkers, homestays, and boat operators should not need travel software to receive genuine demand. Jalan2 turns scattered social evidence into a usable guide and keeps the operator conversation in WhatsApp.

## Features

### Trip guides from social posts

Combine up to eight Xiaohongshu or TikTok links into one deduplicated, editable guide. Jalan2 extracts the useful details, grounds the places on a live map, and adds opening hours plus driving, transit, Grab, KTMB, EasyBook, flight, and lodging hand-offs where relevant. Travelers can also plan from scratch using an origin, destination, trip length, group size, budget, pace, and interests. Safety briefs are available in English, Bahasa Melayu, and Chinese and use only the facts gathered for the trip.

### Kopitiam Swipe

Photograph a mixed Chinese, Malay, English, or handwritten menu board and Jalan2 turns its dishes into swipeable cards. Each card keeps the source row visible and explains the dish, price, taste, heat, allergens, and ordering phrase. "Say my order" plays the phrase in Bahasa Melayu, Cantonese, or Mandarin. Dish photos come from licensed Openverse, Wikimedia Commons, and Unsplash sources.

### Booking over WhatsApp

A traveler can send a booking request to the operator through WhatsApp. Jalan2 tracks the request as pending and accepts confirmation only from the operator address that received it. Demand appears in the directory when a request is sent, while the operator is marked as opted in only after a confirmation reply.

### Guides people can trust

Jalan2 shows an operator web-presence signal using Exa and keeps booking-linked reviews separate from open community reports. The signal is a due-diligence aid, not a license or safety certification.

## How it works

The Expo app sends a source link, menu image, or planning request to the Node and Express API. The server extracts and validates evidence, builds a schema-checked trip or dish guide, plans routes, and returns it to the app. A selected messaging adapter then sends the booking request to the operator.

External services sit behind adapters selected through environment variables. Fixture extraction, cached content, mock messaging, and offline route and place fallbacks let the core flows run without provider keys. Live providers can be enabled individually without changing application code.

For the stage build, the two headline interactions are deliberately deterministic. Selecting or photographing a menu shows a short analysis state and then loads the validated 22-dish kopitiam cache. Pasting or sharing `http://xhslink.com/o/8GLTfuGOS5T` opens a verified cache produced from a live Docker extraction of the real 15-image XHS post: a three-day, mainly self-drive Ipoh/Gopeng plan with 13 grounded stops, the Lost World parking shuttle, the rafting operator's uphill lorry, a short walk from Ming Yue to Big Tree Foot, and clearly labelled Grab/Agoda planner hand-offs. It does not attribute KTM or EasyBook to the creator because the post never mentions them.

On iOS, the share extension opens an internal `jalan2://dataUrl=...` hand-off. Expo Router rewrites that internal URL to the home route while `expo-share-intent` reads the shared XHS/TikTok URL from the app group, preventing the hand-off key from appearing as an unmatched screen.

For local evidence checks, `PIPELINE_MODE=live` plus `EXTRACTOR=auto` bypasses the known-URL cache and sends XHS links to the self-hosted sidecar. Known demo URLs still resolve through checked-in fixtures in `auto` mode. Arbitrary posts discard weak place matches instead of creating duplicate fallback pins, choose walking or Grab for plausible local legs, use Google Transit when a real train/bus chain is returned, expose EasyBook and KTMB as ticket-search hand-offs, and run deterministic plus AI feasibility checks. Date-specific Google Places hours are retained when a traveler supplies a date; without a date the plan asks for one rather than claiming the venue will be open.

Menu photos use a conservative retrieval ladder. When OCR finds a specific stall name, Jalan2 grounds that venue with Google Places and visually checks its food photos against each exact Malaysian dish. Otherwise it searches licensed Openverse, Wikimedia Commons, and Unsplash candidates and applies the same verifier. Wrong regional variants are rejected; a blank image is preferred to a misleading one.

Bookings move from draft to pending confirmation, then to confirmed or failed. Inbound replies are considered only for pending requests sent to the replying operator address.

## Tech stack

- **App:** Expo SDK 54, React Native 0.81, Expo Router, React Native Maps, Leaflet on web, share intents, Gesture Handler, and Reanimated
- **Server:** Node.js, Express, TypeScript ESM through `tsx`, Zod, Sharp, and FFmpeg
- **Providers:** OpenAI, ElevenLabs, Google Cloud TTS, Exa, Openverse, Wikimedia Commons, Unsplash, Google Maps services, TikHub, a self-hosted XHS sidecar, Twilio, and Telegram
- **Shared contracts:** Zod schemas in `shared/`, synchronized into the app by a small script

## Project structure

```text
app/      Expo and React Native client
server/   Express API, pipelines, adapters, and local data
shared/   Zod schemas and shared TypeScript contracts
docs/     Provider setup, build notes, and demo operations
```

## Getting started

### Server

Copy `server/.env.example` to `server/.env`, then run:

```sh
cd server
npm install
npm run dev
```

The default configuration starts with fixture, cached, mock, and offline fallbacks, so provider keys are optional for the included flows.

To exercise real Xiaohongshu extraction locally:

```sh
docker compose -f compose.xhs.yml up -d
# server/.env: PIPELINE_MODE=live, EXTRACTOR=auto,
# XHS_DOWNLOADER_URL=http://127.0.0.1:5556
curl -X POST http://localhost:3001/ingest \
  -H 'content-type: application/json' \
  -d '{"url":"http://xhslink.com/o/8GLTfuGOS5T","mode":"live"}'
```

### App

In a second terminal:

```sh
cd app
npm install
npm start
```

Open the project in Expo Go on the same network. For phone testing against a server on your computer, set `EXPO_PUBLIC_API_URL` to that computer's LAN address.

### Firebase backend

The Express API is deployed as a second-generation Node.js 22 Firebase Function in Singapore. The checked-in Firebase configuration targets `ghostgram-e32ca`; deployment keeps local `npm start` behavior unchanged.

```sh
firebase deploy --only functions:api --project ghostgram-e32ca --force
```

The deployed API base URL is:

```text
https://api-mnl7fuwnga-as.a.run.app
```

Set the app's `EXPO_PUBLIC_API_URL` to this HTTPS URL for physical-device builds. Firebase loads server runtime variables from `server/.env` during deployment; do not commit that file. Production credentials should be migrated to Firebase Secret Manager before opening the API beyond a controlled demo.

The XHS Docker service should not be embedded inside the Firebase Function. For arbitrary production XHS links, deploy the container as a separate private Cloud Run service in the same Google Cloud project, grant the Function service account `roles/run.invoker`, and set:

```text
EXTRACTOR=auto
XHS_DOWNLOADER_URL=https://<xhs-service>-<region>.a.run.app
XHS_DOWNLOADER_AUDIENCE=https://<xhs-service>-<region>.a.run.app
```

The API sends a Google-signed ID token when `XHS_DOWNLOADER_AUDIENCE` is present. Local Docker leaves that value blank and uses `http://127.0.0.1:5556`. TikHub remains the managed fallback when the XHS service is unavailable. Expired or private posts remain unsupported input rather than a reason to invent an itinerary.

Live provider keys belong in `server/.env`. See:

- [Provider setup](docs/provider-setup.md)
- [Demo runbook](docs/demo-runbook.md)
- [macOS share build](docs/mac-share-build.md)

## Development

From the repository root, run the full verification suite:

```sh
npm run typecheck
npm run lint
npm test
```

Starting the app automatically synchronizes changes from `shared/` into the app copy.
