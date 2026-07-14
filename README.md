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
-> living experience record -> booking-linked review
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
| Expo tourist app | Working scaffold | Four-tab Home, Discover, Trips, and You shell with charcoal glass navigation, Bobo guide cards, image-led trip timelines, map and transit handoffs, booking states, and menu flow |
| Social media extraction | Working demo | The self-hosted XHS sidecar handles XHS posts; TikHub handles supported TikTok videos and photo carousels, including source media and metadata |
| Multimodal fusion | Partial | OpenAI frame reading and structured Booking JSON exist; quality has not been benchmarked on a representative dataset |
| Editable trip planner | Working demo | Extracted places become an image-led persisted timeline; tourists can search Google Places, add or delete destinations, fix start and end stops, apply saved defaults, and re-optimize |
| Route constraints | Demo-grade | Google Routes is preferred, with an offline matrix fallback; ordering considers travel time, visit duration, opening windows, fixed endpoints, and known stop costs |
| EasyBook handoff | Limited | A link appears only when Jalan2 validates an official EasyBook route page for the selected city pair; there is no inventory, fare, seat, payment, or booking API integration |
| Speech and voice | Demo-grade | OpenAI and ElevenLabs STT adapters exist; cached and ElevenLabs TTS serve multilingual safety briefs and local phrases |
| WhatsApp booking | Demo-grade | Twilio send/webhook adapters exist, but the recommended demo opens a `wa.me` draft and uses mock auto-confirmation |
| Demand directory | Demo-grade | Prepared fixture operators are shown with zero demand alongside session demand records; opt-in and live demand state are lost on restart and this is not an operator registry |
| Jalan2 Live reviews | Demo-grade | Live experience page, structured ratings, community reports, booking-linked reviews, source evidence, and five-second refresh work; state is in-memory and there is no account or moderation system |
| Vendor magic link | Not built | No signed token, expiry, redemption, or vendor route |
| Stealth ERP | Not built | No operator booking view, accept/decline action, constraints view, or update workflow |
| Firebase | Not used | Trips use a local JSON demo store while bookings, reviews, and other records still use process memory |
| Local travel defaults | Working demo | Budget, start time, pace, and safety language are stored on-device and only change a trip after the tourist taps Use my defaults |
| Menu flow | Demo-grade | Menu photo ingestion, dish cards, swipe selection, order phrases, and cached fallback work; extraction quality is not benchmarked |
| Trust and safety | Partial | Exa public-web evidence, explicit disclaimers, safety briefs, and separated review labels exist; official-record matching, moderation, incident handling, and a risk policy do not |
| Production controls | Not built | No auth, transactional persistence, rate limiting, webhook signature validation, job queue, audit log, observability, or retention controls |

Cached output is visibly labeled `cached` in the app. It must never be presented
as a live extraction during a demo.

## Bobo, the Jalan2 guide

Bobo is Jalan2's baby Malayan tapir travel companion. His songkok, batik
neckerchief, and acid-yellow pouch detail connect the character to Malaysia and
the product's visual system without turning him into a trust or safety badge.
He guides the tourist through discovery, extraction progress, the operator
directory, and local menu phrases.

The transparent production asset lives at
`app/assets/images/bobo.png`. `BoboCard` is the reusable React Native component;
screen copy is passed in as props so Bobo can explain the current task without
duplicating layouts. Keep his role informational and friendly. He must never
claim that an operator is licensed, accredited, guaranteed, or safe.

The current source-media flow downloads every XHS carousel image through the
self-hosted XHS-Downloader sidecar. A low-detail vision pass samples up to ten
source images and chooses the strongest listing hero. It prefers sharp scenes
and rejects text-heavy title cards, collages, app UI, and heavy watermarks. The
selected file is not edited or regenerated. The downloaded candidates remain
in the server's per-source working directory for pipeline evidence.

Covers are copied to `server/data/source-covers/`, keyed by the normalized
submitted URL, and served through `GET /source-covers/:key`. Video posts apply
the same ranking to six evenly spaced keyframes. Photo carousels rank the
original images. If every usable video frame contains baked-in text, Jalan2
selects the least obstructed scene without pretending that a clean source
frame exists. Curated fixture covers remain the offline fallback.

This is not universal TikTok access. TikHub supports the ordinary public video
and photo-post shapes exercised by the adapter, but private, deleted,
login-gated, age-gated, region-blocked, live, unsupported, or extractor-blocked
posts can still fail. Source imagery also needs creator permission, object
storage, and a retention policy before production use.

## Editable trip planner

Each successful live ingestion now builds a real `TripPlan` from the place
names found in the post and resolves them through Google Places. The itinerary
stores Google place IDs, coordinates, addresses, Maps links, and available
opening-hours data. A tourist can then:

- Search for any destination in Malaysia and add a live Google Places result.
- Add, remove, or reselect destinations and keep those edits across a server
  restart through the demo JSON store.
- Set a trip start time, an optional known-spend budget, and fixed start and end
  stops.
- Optimize with Google Routes when possible and fall back visibly to the
  deterministic offline router when Google cannot calculate the route.
- See estimated travel plus visit time, known spend, and opening-hours or
  budget warnings.
- See licensed Google Place photos when a photo reference is available, with
  provider attribution kept beside the image.

Budget optimization is intentionally conservative. It only reasons about
costs Jalan2 actually knows, removes optional high-cost stops when necessary,
and never describes missing prices as free. Opening hours from Places are a
planning signal, not a guarantee that a venue will admit a traveler.

Trip persistence is local JSON under `server/data/trips/`. It is appropriate
for the demo and tests, not concurrent production traffic. Move it to Firestore
or another transactional database before a multi-user pilot.

### Four-tab client and session history

The client has four real top-level destinations: Home, Discover, Trips, and
You. Discover separates prepared Malaysian journeys from local operators.
Trips combines persisted prepared journeys with safe itinerary summaries from
`GET /itineraries`. The summary endpoint returns only the itinerary ID, status,
display title, cover URL, trip ID, timestamps, and failure reason. It does not
expose operator contact details or message bodies.

Booking drafts and confirmations still live in process memory, so the Trips
session list clears when the backend restarts. Persisted `TripPlan` JSON and
on-device travel defaults have separate lifecycles and remain available.

### EasyBook boundary

Jalan2 does not claim a completed EasyBook integration. The server constructs
an official EasyBook city-pair URL, fetches it without following redirects,
and only shows the handoff when the returned page identifies both endpoints.
Generic redirects and unsupported routes are rejected. This gives the tourist
a truthful transport search handoff, not live schedules, inventory, fares,
seats, payment, or confirmation.

EasyBook's public affiliate and widget offering is the realistic next
integration step. A production inventory flow requires a commercial partner
API or another licensed transport provider. Do not scrape a booking result and
present it as reserved inventory.

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
8. After the trip, the tourist adds a structured review to a living experience
   record. Booking history, community reports, and public web evidence remain
   visibly separate.

## Jalan2 Live: the living experience record

Jalan2 Live turns temporary social attention into a reusable record for the
next traveler. The current Expo mobile and web app implements:

- A stable experience URL derived from operator and activity identity.
- A public record with operator, activity, meeting point, original discovery
  source, last Jalan2 operator-confirmation time, and attributed web evidence.
- Structured review dimensions for accuracy, communication, and value. There
  is deliberately no combined safety or accreditation score.
- Two explicit review labels: `booking_linked` requires a matching confirmed
  Jalan2 booking, while `community_report` is open and unverified.
- One booking-linked review per booking, server-side input validation, instant
  publishing, pull-to-refresh, and five-second polling for updates.

The implementation is demo-grade. A booking-linked review proves possession of
a matching confirmed booking ID; it does not yet prove that the traveler
attended or completed the activity. Reviews and experience records are held in
memory and disappear on server restart. There is no user authentication,
operator reply, abuse reporting, moderation queue, appeal process, fraud
detection, or retention workflow. These are launch blockers for a public pilot.

The server endpoints are:

```text
GET  /experiences/:id
POST /experiences/:id/reviews
```

### Trust vocabulary and product rules

Jalan2 surfaces evidence; it does not grant accreditation or certify safety.
The product must keep these categories separate:

1. **Official records:** an exact, attributed match to an applicable registry
   or licence, including identifier, category, validity, source, and check time.
2. **Community footprint:** public posts, comments, account longevity, and
   independent community reports. Popularity is not proof of compliance or
   operational safety.
3. **Jalan2 booking history:** confirmed bookings and, once completion can be
   established, completed-visit reviews. This is platform history, not a
   government credential.

Search discovery alone must never produce an "SSM verified", "MOTAC licensed",
"accredited", or "safe" badge. "No match found" means Jalan2 did not establish
a match; it does not prove that an operator is unlicensed. For a regulated
activity, booking should remain disabled until the applicable licence is
matched or the transaction is routed through a licensed partner.

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
- Preserve user-submitted post imagery as the listing cover, with a generated
  video frame and curated fixture image as explicit fallbacks. This now works
  in the live self-hosted XHS pipeline; production still needs object storage,
  creator permission rules, and a source-media retention policy.

**Done when:** a video and a photographed flyer both produce editable,
source-backed listings, and unsupported facts remain null rather than guessed.

### P3: move from demo to pilot

- Persist experience records and reviews, authenticate reviewers, distinguish
  a confirmed booking from a completed visit, and add duplicate-account and
  coordinated-manipulation controls.
- Add operator replies, review reporting, evidence preservation, moderation,
  appeals, removal requests, and an incident escalation policy before opening
  community submissions publicly.
- Match official records through attributable sources. Public web search may
  discover candidates but must not claim registry verification by itself.
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
- **Inbound matching remains demo-grade.** Unknown senders are rejected, but
  multiple pending requests to the same controlled operator are resolved
  newest-first. Production needs a booking token or provider message ID.
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
- `Review`: reviewer identity, experience snapshot, booking/completion link,
  visit date, structured ratings, text, evidence, moderation state, edits, and
  operator response.

Do not let a later edit to an extracted listing silently rewrite an already
requested booking.

## Layout

- `app/` Expo (React Native) client
- `server/` Node/Express backend; owns all API keys and the pipeline
- `shared/` Booking JSON schema and logic used by both
- `docs/` provider setup, iOS share-extension build, demo runbook

External services are swappable by env var (`server/.env`): extractor,
speech-to-text, places, routing, and messaging (Twilio WhatsApp, Telegram, or a
mock).
`PIPELINE_MODE=cached` runs the whole demo offline from cached bookings.

## Run it

Server (no keys needed in cached mode):

```
cd server
npm install
copy .env.example .env
npm run dev
```

For live XHS extraction, start the self-hosted sidecar and select it in
`server/.env`:

```
docker compose -f compose.xhs.yml up -d
```

```env
EXTRACTOR=xhs-downloader
XHS_DOWNLOADER_URL=http://127.0.0.1:5556
PIPELINE_MODE=live
PLACES_PROVIDER=auto
ROUTING_PROVIDER=auto
GOOGLE_MAPS_API_KEY=your_server_side_key
```

The sidecar exposes `POST /xhs/detail` on port 5556. It is GPL-3.0 software;
review its license obligations before distributing a combined deployment. Keep
any optional XHS Cookie in the sidecar's private volume, never in Git or client
configuration.

For a live TikTok post, set `EXTRACTOR=tikhub` and provide
`TIKHUB_API_KEY`. Keep all provider keys in `server/.env`; the Expo client must
never receive them. In `auto` mode, Places and Routes use Google when the
server key is configured and fall back to deterministic local providers when
it is not.

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
