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

### App

In a second terminal:

```sh
cd app
npm install
npm start
```

Open the project in Expo Go on the same network. For phone testing against a server on your computer, set `EXPO_PUBLIC_API_URL` to that computer's LAN address.

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

## Current limitations

- The directory, itineraries, and reviews are held in memory and reset with the server. Saved trips use local JSON files.
- EasyBook, KTMB, Grab, flight, and lodging actions are search or deep-link hand-offs, not live inventory or booking integrations.
- Cantonese ordering audio requires a Google Cloud TTS key because the configured ElevenLabs voice path does not provide verified Cantonese output.
- The operator web-presence signal is a heuristic, not a license, identity, or safety certification.
- Accounts and community-review moderation are not implemented yet.

## Roadmap

Planned work focuses on:

- Persistent storage for operators, bookings, reviews, and trip guides
- Deeper transport-booking partnerships beyond external hand-offs
- Accounts and moderation for community contributions
- Broader language and regional coverage for menu and video extraction
