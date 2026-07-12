# Jalan2

Jalan2 is a discovery and transaction bridge for Malaysia's offline tourism
economy. It helps an international tourist turn an unstructured TikTok,
Xiaohongshu post, local flyer, voice request, or menu into a usable itinerary,
while letting an informal operator receive and manage a booking through the
channel they already use: WhatsApp.

The two users are:

- **The international tourist:** wants authentic Malaysian experiences for
  Visit Malaysia 2026, but cannot reliably discover, understand, verify, reach,
  or book the small operator behind a social post.
- **The offline MSME:** a hawker, guide, homestay, boat operator, or other
  micro-business that works through WhatsApp and Facebook and should not need
  to learn a travel SaaS dashboard before receiving demand.

The current proof of concept focuses on one narrow loop:

```
paste/share URL -> extract -> transcribe + read frames -> Booking JSON
-> itinerary + map + transit link -> WhatsApp send -> YES -> CONFIRMED
```

The intended product adds a consent-gated vendor link after the booking
request. That link opens a zero-login, mobile-first booking console where the
operator can accept or decline, see pax and dietary notes, and update the trip.
This is called the **Stealth ERP** in the pitch. It is not implemented yet.

## Honest project status

This repository is a strong hackathon scaffold, not yet the complete product
described above. The tourist-side cached demo works; several live integrations
and the entire vendor-side experience remain to be built.

| Capability | Status | Reality today |
|---|---|---|
| Expo tourist app | Working scaffold | Paste/share entry, fixture cards, itinerary, map, transit links, booking sheet, directory |
| Video extraction | Partial | TikHub and yt-dlp paths exist; curated manifest fixtures are the reliable path; non-fixture XHS needs paid extraction access |
| Multimodal fusion | Partial | OpenAI frame reading and structured Booking JSON exist; quality has not been benchmarked on a representative dataset |
| Speech input | Partial | OpenAI transcription exists; `STT_PROVIDER=elevenlabs` deliberately throws because the adapter is missing |
| WhatsApp booking | Demo-grade | Twilio send/webhook adapters exist, but the recommended demo opens a `wa.me` draft and uses mock auto-confirmation |
| Demand directory | Demo-grade | In-memory only; it is lost on restart and is not an operator registry |
| Vendor magic link | Not built | No signed token, expiry, redemption, or vendor route |
| Stealth ERP | Not built | No operator booking view, accept/decline action, constraints view, or update workflow |
| Firebase | Not used | Current state is held in process memory despite Firebase being named in the product pitch |
| Voice and menu flows | Not built | No TTS, voice search, menu capture, dish cards, or multilingual playback |
| Trust and safety | Not built | No source-backed operator verification, moderation, emergency copy, or risk policy |
| Production controls | Not built | No auth, persistence, rate limiting, webhook signature validation, job queue, audit log, observability, or retention controls |

Cached output is visibly labeled `cached` in the app. It must never be presented
as a live extraction during a demo.

## Target closed loop

1. A tourist pastes or shares a post, photographs a flyer or menu, or speaks a
   request.
2. The backend captures source evidence, extracts candidate facts, and produces
   a schema-valid listing with field-level provenance and confidence.
3. The tourist corrects uncertain facts, chooses date and pax, adds dietary or
   accessibility notes, and explicitly taps Request booking.
4. Jalan2 creates a durable booking request and sends an approved WhatsApp
   message to a controlled or consented operator number.
5. The message contains a short-lived, single-purpose vendor link. Opening it
   shows only that booking, without requiring an account.
6. The operator accepts, declines, asks a question, or edits operational details.
   The tourist app receives the same state change in real time.
7. Only after explicit operator consent may the business become a durable
   directory listing. Source evidence, consent, and later edits remain auditable.

## Recommended architecture

Keep the system deterministic even if several model calls are involved. The
current extraction flow is a four-stage pipeline, not a reason to introduce a
general multi-agent framework.

```text
Expo app
  -> Node API
     -> ingestion job: extract -> transcribe -> vision -> validate/fuse
     -> durable Listing + Evidence records
     -> Booking state machine
     -> WhatsApp adapter
     -> signed vendor-link service
  -> Firebase Auth/Firestore/Storage (or one equivalent persistence stack)
     -> real-time tourist and vendor booking views
```

Use model outputs as proposals, never as the database itself. Store the raw
source, normalized fields, provenance for each material field, confidence,
human corrections, consent events, and booking transitions separately.

## What needs to be done

### P0: make the existing demo truthful and repeatable

- Replace the generic fixtures with one real, permission-safe end-to-end
  operator case and keep a clearly labeled offline replay.
- Run the extraction pipeline over a small golden set and score operator name,
  price, contact, activity, and meeting point independently. Block booking when
  critical fields are unsupported or below threshold.
- Separate "booking request sent" from "operator confirmed." The current mock
  timer cannot be narrated as a real reply.
- Correlate inbound replies by provider message ID or booking token. The current
  fallback to the newest pending itinerary can confirm the wrong booking.
- Validate Twilio signatures, reject replayed webhooks, rate-limit ingestion and
  booking routes, and cap source/media size.
- Exercise `cached`, `auto`, and `live` modes from a clean checkout; rehearse the
  failure ladder in `docs/demo-runbook.md`.

**Done when:** one curated link completes the loop twice in a row, a failure is
visibly identified as fallback, and an unrelated WhatsApp reply cannot confirm
the booking.

### P1: build the smallest credible Stealth ERP

- Add durable `Listing`, `Booking`, `VendorLink`, `ConsentEvent`, and
  `BookingEvent` records. Firestore is a pragmatic fit for the Expo real-time
  demo, but use the Admin SDK only on the server and define security rules
  before exposing vendor pages.
- Create an opaque, hashed, single-use vendor token with a short expiry,
  booking-scoped permissions, revocation, and redemption audit. Never place
  booking details or phone numbers inside the token itself.
- Add a mobile web route that shows date, pax, meeting point, dietary and
  accessibility notes, price assumptions, and tourist contact policy.
- Support accept, decline, propose a change, and ask a question. Every action
  must be idempotent and must update the tourist view.
- Make operator directory opt-in a separate explicit choice. Accepting one
  booking is not blanket consent to marketing or permanent listing.

**Done when:** a second phone opens the WhatsApp link without logging in,
accepts the exact booking, and the tourist phone changes to `CONFIRMED`, while
an expired or reused link is rejected.

### P2: make discovery genuinely multimodal

- Implement the ElevenLabs Scribe adapter or remove the configuration switch.
- Add flyer and menu photo ingestion through the same evidence and validation
  layer, but use distinct schemas instead of forcing every input into
  `BookingJson`.
- Add voice request input and TTS for short Malay/Manglish operator phrases and
  safety summaries. Use stock synthetic voices and label generated audio.
- Add a review screen for uncertain extraction before anything is sent to an
  operator.
- Build source connectors behind policy-aware adapters. Prefer official APIs,
  user-provided shares, or licensed extractors; do not make mass scraping the
  product dependency.

**Done when:** a video and a photographed flyer both produce editable,
source-backed listings, and unsupported facts remain null rather than guessed.

### P3: move from demo to pilot

- Add cancellation, expiry, duplicate-request handling, timezone rules,
  capacity, price changes, and a clear payment boundary.
- Add multilingual templates, operator support, data export/deletion, retention
  limits, and consent withdrawal.
- Add structured logs, tracing, alerting, cost budgets, prompt/model versioning,
  extraction quality dashboards, and dead-letter handling for failed jobs.
- Establish operator verification and escalation policies for high-risk
  activities. A model-generated trust score must never look like a licence or
  safety certification.
- Pilot one category in one geography before claiming a national marketplace.
  Good candidates are low-risk food or culture experiences where booking
  availability can be verified manually.

**Done when:** a small set of real operators can receive, manage, and close
bookings for several weeks with measured response time, conversion, correction
rate, and support burden.

## Critique of the plan

The core insight is good: do not force informal MSMEs to adopt software before
they receive value. The weak point is that the pitch currently promises too
many difficult systems in one live beat.

- **"Multi-agent execution engine" is ahead of the implementation.** The code
  is a deterministic pipeline plus a booking state machine. That is an
  advantage: it is easier to test, observe, and explain. Call the components
  agents only when they have distinct goals, tools, state, and recovery logic.
- **"AI-generated ERP" is the wrong technical promise.** Generating dashboard
  code or a unique interface at runtime creates security and consistency risk.
  Generate the listing data and helpful copy; render a fixed, tested vendor UI
  from schemas and permissions.
- **A magic link removes login friction, not identity risk.** WhatsApp messages
  can be forwarded, phones are shared, and links appear in backups and preview
  crawlers. Scope the token narrowly, expire it, hash it at rest, support
  revocation, and require step-up verification for sensitive changes.
- **Scraping cannot be the only supply strategy.** Social platforms change
  frequently, extraction may violate platform rules, and a public post does not
  prove permission to contact or list a business. User-initiated single-post
  extraction is a safer demo and consented operator referrals are a better
  long-term acquisition loop.
- **Extraction is not inventory.** A video can reveal an operator and a price,
  but not current capacity, blackout dates, cancellation terms, or whether the
  offer still exists. The product should say "request to book" until the
  operator confirms.
- **The booking semantics are currently misleading.** Opening WhatsApp and
  starting a four-second mock timer demonstrates UI orchestration, not a closed
  WhatsApp round-trip. Keep the mock as stage insurance and show it honestly.
- **The current inbound matching is unsafe.** If the sender does not match, the
  server assigns the reply to the newest pending itinerary. That is acceptable
  only in a one-booking mock and must not survive a pilot.
- **Marketplace cold start is not solved by extraction.** A directory of
  inferred operators is not supply. Jalan2 needs a consent, response, and
  fulfilment loop, plus a reason for operators to keep details current.
- **The plan mixes two product wedges.** Adventure booking and kopitiam menu
  translation share vision infrastructure but have different users, risk,
  schemas, and success metrics. For the demo, lead with one closed booking loop;
  show the menu flow only if it is already reliable.
- **Trust badges are dangerous shorthand.** Search results and reviews can
  support due diligence, but they do not establish licensing or operational
  safety. Show evidence and unknowns, not a single authoritative-looking score.
- **Firebase is a decision, not an architecture.** If selected, specify what
  lives in Firestore, Storage, Auth, Functions, and the Node service, plus
  tenancy, rules, indexes, retention, and local emulator tests. Otherwise omit
  it from the pitch.
- **Payments are correctly absent for now.** Do not add them until cancellation,
  refunds, disputes, taxes, operator identity, and responsibility for fulfilment
  are explicit.

The best demo is not the one with the most integrations. It is the smallest
honest loop where a real tourist action becomes a real operator action and the
same booking state is visible on both phones.

## Data contracts still needed

`BookingJson` is a useful extraction output, but it currently mixes inferred
listing data with a tourist's booking defaults. Before adding the vendor flow,
split it into:

- `SourceEvidence`: source URL/hash, capture time, media ownership/permission
  context, transcript spans, frame timestamps, and model version.
- `ListingDraft`: operator, activity, indicative price, meeting point, contact,
  per-field provenance, confidence, and review status.
- `BookingRequest`: immutable listing snapshot, requested date/time, pax,
  constraints, currency, price basis, tourist consent, and expiry.
- `BookingEvent`: actor, action, prior state, next state, provider message ID,
  idempotency key, and timestamp.
- `VendorLink`: booking ID, hashed token, allowed actions, expiry, redemption,
  revocation, and delivery channel.
- `OperatorConsent`: purpose-specific opt-ins for this booking, directory
  listing, future contact, and data retention.

Do not let a later edit to an extracted listing silently rewrite an already
requested booking.

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

For the phone demo, start the backend in mock-confirm mode and point Expo at
your laptop's LAN IP. The app opens WhatsApp with a pre-filled booking draft,
then the mock backend flips the itinerary to CONFIRMED after four seconds.

Server:

```powershell
cd C:\Users\megaw\Downloads\Jalan2\server
$env:PIPELINE_MODE="auto"
$env:MESSAGING_PROVIDER="mock"
$env:MOCK_AUTO_CONFIRM_MS="4000"
npm.cmd run dev
```

App:

```powershell
cd C:\Users\megaw\Downloads\Jalan2\app
$env:EXPO_PUBLIC_API_URL="http://<laptop-lan-ip>:3001"
$env:EXPO_PUBLIC_DEMO_WHATSAPP_NUMBER="+65xxxxxxxx"
npm.cmd start -- --clear
```

Open `http://<laptop-lan-ip>:3001/fixtures` in the phone browser first. If it
does not load JSON, put the phone and laptop on the same reachable network or
allow Node through Windows Firewall.

Without `MOCK_AUTO_CONFIRM_MS`, tap a demo video on the home screen, book it,
then confirm as the operator:

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
