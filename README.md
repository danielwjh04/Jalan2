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
create itinerary -> paste one or more XHS/TikTok URLs -> extract each source
-> choose grounded places -> de-duplicate + optimize -> drag/reorder + re-check
-> itinerary + map + transport handoffs -> optional booking requests
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
| Multi-post itinerary builder | Working demo | A traveler can add up to eight mixed XHS/TikTok links, inspect extraction status per source, choose whole posts or individual places, keep failures visible, and merge the selection into one de-duplicated trip |
| Editable trip planner | Working demo | Extracted and saved discovery journeys become image-led timelines; tourists can drag/reorder selected stops on web (arrow controls on native), remove, restore, or delete stops, run Optimize + check, switch walking/transit/driving/Grab between adjacent places, and explicitly send separate reservation requests |
| Route constraints | Demo-grade | Google Routes is preferred on ordinary roads, with an offline fallback; Tioman bypasses Google DRIVE and uses village-corridor, walkway, 4WD and water-taxi rules instead |
| EasyBook handoff | Limited | A link appears only when Jalan2 validates an official EasyBook route page for the selected city pair; there is no inventory, fare, seat, payment, or booking API integration |
| KTMB handoff | Limited | Rail-served journey boundaries map to published KTMB stations and open the official KITS timetable/ticket search; there is no live inventory, fare, seat, payment, or booking API integration |
| Speech and voice | Demo-grade | OpenAI and ElevenLabs STT adapters exist; ElevenLabs TTS handles Malay and Mandarin while Cantonese routes only to Google Cloud TTS `yue-HK`. A dedicated permitted `GOOGLE_CLOUD_TTS_API_KEY` is still required for live Cantonese audio |
| WhatsApp booking | Demo-grade | Twilio send/webhook adapters exist, but the recommended demo opens a `wa.me` draft and uses mock auto-confirmation |
| Demand directory | Demo-grade | Prepared fixture operators are shown with zero demand alongside session demand records; opt-in and live demand state are lost on restart and this is not an operator registry |
| Jalan2 Live reviews | Demo-grade | Live experience page, structured ratings, community reports, booking-linked reviews, source evidence, and five-second refresh work; state is in-memory and there is no account or moderation system |
| Vendor magic link | Not built | No signed token, expiry, redemption, or vendor route |
| Stealth ERP | Not built | No operator booking view, accept/decline action, constraints view, or update workflow |
| Firebase | Not used | Trips use a local JSON demo store while bookings, reviews, and other records still use process memory |
| Local travel defaults | Working demo | Budget, start time, pace, and safety language are stored on-device and only change a trip after the tourist taps Use my defaults |
| Menu flow | Demo-grade | Camera/library ingestion segments wide menu boards into enlarged column panels, asks OpenAI for every visible row, grounds Malaysian regional dish identities, and accepts attributed Openverse/Wikimedia/Unsplash candidates only after a conservative multimodal match check; broader benchmarking is still required |
| Trust and safety | Partial | Exa public-web evidence, explicit disclaimers, safety briefs, and separated review labels exist; official-record matching, moderation, incident handling, and a risk policy do not |
| Production controls | Not built | No auth, transactional persistence, rate limiting, webhook signature validation, job queue, audit log, observability, or retention controls |

Cached output is visibly labeled `cached` in the app. It must never be presented
as a live extraction during a demo.

## Recommended live demo routes

Home now leads with three source-backed routes that each prove a different part
of the product. They open the real trip planner, not a separate presentation
screen:

The landing hierarchy now makes the two product wedges explicit before those
examples: **1) paste an XHS/TikTok post and receive a grounded end-to-end
itinerary; 2) scan a kopitiam menu and receive a swipeable dish guide.** The
manual smart planner is deliberately secondary and labeled as the path for a
traveler who does not already have a social post.

1. **KL to Tioman:** hand off TBS to Mersing and Mersing to Tekek transport to
   EasyBook, then keep the default island day inside the Tekek–Berjaya–Paya
   corridor: a Tekek reef dive, Bunut Beach ATV and the short Berjaya–Paya
   rainforest walk. Asah Waterfall remains visible as a separate south-coast
   add-on, not a same-day default. EasyBook remains an external booking handoff.
2. **Kuching's Jurassic World:** turn Bengoh social discovery into a community
   guide meetup, reservoir longboat, Kampung Sting homestay, waterfall trek,
   and Fairy Cave finale. This is the clearest informal-operator story.
3. **KL to Gopeng:** hand off the intercity leg to EasyBook, then close the
   missing local transfer and operator layer for Gua Tempurung, Kampar River
   rafting, and an old-town meal.

The landing cards state the transport boundary and the planner shows a short
three-step product proof. On larger screens the cards form a three-column grid
and itinerary stops use a horizontal image layout; tablets use two columns and
phones collapse to one. Bobo has a dedicated larger landing treatment and
stacks above the greeting on narrow phones.

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
- Open the ellipsis menu on any stop to remove it from the itinerary, add it
  back from Available places, or delete it from the saved trip.
- Set a trip start time, an optional known-spend budget, and fixed start and end
  stops.
- Optimize with Google Routes when possible and fall back visibly to the
  deterministic offline router when Google cannot calculate the route.
- Change the compact travel connector between adjacent stops to walking,
  transit, driving, or Grab. Google Maps opens with both endpoints and the
  selected route mode. Grab copies the exact next-stop address before opening
  the official booking screen because Jalan2 does not claim a booked or
  destination-prefilled ride.
- See estimated travel plus visit time, known spend, and opening-hours or
  budget warnings.
- See licensed Google Place photos when a photo reference is available, with
  required provider or creator credit behind a compact image info control
  instead of a footer under every photo.
- Copy a prepared journey from Home or Discover into Trips without changing the
  original, then edit the saved copy.
- Review dates, guests, and per-stop times before sending separate WhatsApp
  availability requests for eligible selected stops. Stops removed from the
  itinerary are excluded, while walk-in stops remain in the plan.

### Multi-post social itinerary flow

Home's primary social action opens a collection builder instead of forcing each
link into an isolated trip. The traveler can paste one public link per line,
mix XHS and TikTok, and process up to eight sources. Two sources are processed
at a time so a large collection does not overwhelm the media and vision
pipeline. Each source card shows its current stage, its grounded place matches,
its photos, and a contained error if that source fails. The traveler can select
or deselect an entire post, then refine the choice place by place.

`POST /trips/merge` combines those selections into a persisted
`social_collection` trip. Google Place IDs de-duplicate the same venue across
creators while all original source URLs remain attached as evidence. The first
route is optimized, scheduled and sent through the end-to-end critic. Adjacent
local legs use Google Routes when available; mainland intercity legs check an
EasyBook route before falling back to an explicit unconfirmed multimodal
handoff; Peninsular Malaysia-to-Borneo combinations become flight-search
handoffs and are never drawn as a drive.

The trip screen exposes the order before the map. On web, rows are draggable;
native clients get accessible move-earlier/move-later controls. A manual reorder
immediately clears the stale route and old critic output. **Optimize + check**
then rebuilds the ordered route, day schedule, transport legs and final
reasonableness score. This avoids displaying a polished plan whose evidence no
longer matches the user's edits.

Budget optimization is intentionally conservative. It only reasons about
costs Jalan2 actually knows, removes optional high-cost stops when necessary,
and never describes missing prices as free. Opening hours from Places are a
planning signal, not a guarantee that a venue will admit a traveler.

Trip persistence is local JSON under `server/data/trips/`. It is appropriate
for the demo and tests, not concurrent production traffic. Move it to Firestore
or another transactional database before a multi-user pilot.

### A-to-Z planning agents

Home now includes an end-to-end planner for origin, destination, final endpoint,
return intent, duration, party size, start date, budget, interests and pace. It uses one typed orchestrator with seven
bounded agents instead of asking one model to invent a route:

1. Place grounding resolves Malaysian Google Place IDs and coordinates.
2. Mobility builds first-class legs and separates EasyBook, KTMB, operator pickup,
   Grab fallback, flights, Google routing and offline estimates.
3. Experience discovery ranks a varied set of requested interests and local
   food without treating every search result as a must-do stop.
4. The deterministic scheduler splits visits and transfers into realistic days.
5. Stay planning creates an Agoda external-search action when an overnight is
   required.
6. Booking planning separates directions, external searches and operator
   requests.
7. The end-to-end critic scores continuity, daily load, overnight placement and
   provider gaps. It uses structured OpenAI evaluation when configured and a
   deterministic validator otherwise. It is explicitly forbidden from
   inventing routes, fares, hours, availability, safety claims or operators.

`POST /smart-plan` returns and persists a normal `TripPlan` with additional
`planning` metadata: physical stops, connected legs, day plans, agent reports,
provider evidence, critic checks and handoffs. Transport is not passed to the
Google DRIVE matrix as a fake attraction. The KL to Gopeng path explicitly
grounds Terminal Amanjaya, checks the KL to Ipoh KTMB and EasyBook handoffs, and creates
a separate operator-pickup request with Grab as an availability fallback.

New live XHS and TikTok plans with at least two grounded recommendations now go
through the same local planning and critic path. The source post supplies the
candidate places, Google Places grounds them, routing orders them, the scheduler
splits them into days, and each stop exposes directions, a Grab handoff and the
specific questions to ask locally. A single-place post remains a grounded stop
rather than fabricating a route. The planner preserves the submitted post as
evidence and reports any name that could not be matched to a place record.
The vision reader uses high-detail frames and explicitly handles mixed Chinese,
Malay and English captions, including Latin venue names embedded in Chinese
sentences. Its structured per-frame evidence is saved with the run so missed or
incorrect place extraction can be audited.
An explicit multilingual context rule carries visible food categories such as
`冰淇淋`, `雪糕` or `ice cream` into venue grounding, preventing an ambiguous
name such as Sunny Hill from resolving to the nearby school instead of the
ice-cream shop.

The current planner does not claim live fares, seats, hotel rooms, Grab rides or
operator availability. Google Routes failures are visibly downgraded to offline
estimates. Opening hours are still represented by a simplified first window and
need date-aware weekly periods before production. Future versions should add
locked bookings, per-day dates, actual incremental detour routing and a repair
loop that proposes faster, cheaper and more relaxed alternatives.

The interaction model borrows the useful planning mechanics documented by
Wanderlog: itinerary and map in one view, day-level route ordering, explicit
start/end points, integrated suggestions and reservation handoffs. Jalan2 adds
the part a generic planner does not solve: preserving the XHS/TikTok evidence,
surfacing informal local operators and making uncertain last-mile transfers
visible. The critic follows an evaluator-optimizer shape, but the demo does not
add LangChain or LangGraph as a dependency. The current graph is fixed and typed,
so a small structured evaluator plus deterministic rules is easier to audit and
less likely to hide a fabricated path.

### Swipeable food guide

Home exposes a direct `Test the 22-dish menu demo` path alongside camera and
library ingestion. The repeatable demo uses the committed `星级茶餐室` board. Its deterministic
fixture represents all 22 visible food rows, including Chinese and handwritten
Malay names. Wide photos are split into three enlarged vertical panels before
vision extraction so small middle and right-hand columns are not lost. The
reader removes duplicate translations and retains lower-confidence readings
with a visible warning instead of silently dropping them.

Each swipe card includes the printed price, a typical taste and texture guide,
an advisory heat level, likely allergens, and a short local ordering phrase.
Before the food photo, it also shows the original menu board with that dish's
exact printed row highlighted so a tourist can point to it at a noisy stall.
The same pointing panel remains in the saved ordering shortlist.

The shortlist now pairs that pointing panel with **Say my order** buttons for
Bahasa Melayu, Cantonese, and Mandarin. `POST /menu/:id/order-audio` builds a
short phrase around the exact printed dish name, synthesizes it only when the
tourist taps a language, caches the MP3, and returns a
visibly labelled synthetic-audio result. On-demand generation prevents a
22-dish scan from spending quota on 66 unheard clips. Set
`TTS_PROVIDER=elevenlabs` and `ELEVENLABS_API_KEY` for Malay and Mandarin.
Cantonese deliberately does not fall back to ElevenLabs: its current model
metadata exposes Mandarin Chinese, not a verified Cantonese voice. Enable Google
Cloud Text-to-Speech and configure `GOOGLE_CLOUD_TTS_API_KEY` for the explicit
`yue-HK` voice. Do not use an OAuth client ID, browser-referrer Maps key, or
silent ElevenLabs fallback. The backend requires a dedicated server-side API
key permitted to call `texttospeech.googleapis.com`; otherwise the Cantonese
button fails clearly. Malaysian Cantonese wording and pronunciation should
still be human-checked before a pilot.

Menu understanding and text geometry are separate stages. `OPENAI_MENU_MODEL`
reads and explains the dishes. `OPENAI_MENU_LOCALIZATION_MODEL` defaults to
`gpt-5.6` and reruns each enlarged menu column at original image detail, returning
strict 0..999 bounding boxes that are mapped back onto the uploaded board. This
keeps crop coordinates aligned with the original photo and avoids confusing the
shop title, ordinary yee mee, and wet-style yee mee rows.

Dish photos use a region-aware Malaysian identity to retrieve several candidates
from Openverse, Wikimedia Commons, and optional Unsplash. A second multimodal
check compares the visible noodle form, soup/dry/gravy preparation, colour,
toppings, and regional style before an image is accepted. It explicitly keeps
KL dark Hokkien mee, Penang Hokkien prawn mee, Singapore Hokkien mee, yee mee,
and handmade ban mian-style noodles separate. Only an exact high-confidence
match is shown; every accepted image retains source and licence attribution.
A rejected or missing match becomes a designed placeholder rather than a
plausible-looking but incorrect dish photo.

Do not build a new dependency on Google Custom Search for dish photos. Google
has closed that API to new customers and scheduled its discontinuation for
January 2027. Google Places photos remain appropriate for a specific venue,
not for identifying a dish. An optional Unsplash fallback is wired in through
`UNSPLASH_ACCESS_KEY` for additional candidate coverage after Openverse and
Commons. It uses the required hotlinked image URL and visible attribution, but
its broad food search is never trusted without the same dish-identity check.

Tourists can drag left or right or use accessible skip and save buttons. Saved
dishes appear in the ordering shortlist; skipped dishes do not. The scanned
board remains visible above the cards so the result stays tied to its source.
Taste, heat, and allergens are explicitly presented as typical-recipe guidance,
not a claim about the stall's exact preparation. Production should benchmark
menu extraction across layouts and languages, retain uploaded photos in
managed storage with deletion controls, cache image lookups, and let the diner
correct uncertain readings before relying on them.

### Tioman island mobility

Tioman is not sent to the normal Google `DRIVE` optimizer. Straight-line
distance is particularly misleading on an island whose villages sit on
different coasts without a continuous public road. Jalan2 classifies grounded
stops into mobility zones: the Tekek–Berjaya–Paya/Air Batang corridor, Juara,
Salang, Genting, Nipah, and Mukut–Asah. It groups activities within one zone
before allowing a zone change.

Within the Tekek corridor, legs are described as walkways, trails, resort
shuttles or operator pickup. Tekek–Juara becomes an explicit locally arranged
4WD leg. Other zone changes become a **water-taxi** leg with `needs_confirmation`
evidence and a blocking critic check. Jalan2 deliberately leaves price unknown:
the traveler must confirm fare, weather, departure point, seats and the return
boat with a local operator. The UI removes the misleading Drive/Grab selector
for these fixed island transfers and opens the Tioman Development Authority's
transport guidance instead.

“Suggested on the way” results also inherit the selected Tioman zone. A Tekek
day will not quietly recommend an attractive Asah or Juara stop that introduces
an undocumented boat or 4WD transfer. If the tourist explicitly adds another
zone, the planner keeps the zones together, exposes the transfer, and will not
mark the plan actionable until that handoff is confirmed.

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

Saved discovery copies also live in server memory for this demo and clear on a
backend restart. Trip reservation batches use unique `J2-` references so each
operator reply updates only the matching stop. The app polls pending batches
and shows confirmed, waiting, declined, failed, and walk-in states separately.

### Whole-journey boundaries, EasyBook and KTMB

Every editable journey now carries three explicit boundary decisions: where the
traveler starts, whether they return there, and where the trip ends when it is
one-way. The planner does not assume that the final attraction is the end of
the journey. A round trip adds a real return leg to the origin; a one-way plan
requires a named endpoint. Both outbound and final intercity boundaries are
passed through the same provider-selection and end-to-end critic pipeline.

When both boundary cities map to stations on KTMB's published ETS, Intercity or
Komuter network, Jalan2 adds the official KTMB KITS timetable/ticketing handoff.
The UI states the mapped stations and still requires the traveler to confirm
the live train, departure, fare and seats. It does not claim a KTMB inventory,
fare or booking API. Rail-ineligible destinations such as Tioman and Kuching do
not receive a misleading KTMB option.

Jalan2 does not claim a completed EasyBook integration. The server constructs
an official EasyBook city-pair URL, fetches it without following redirects,
and only shows the handoff when the returned page identifies both endpoints.
Generic redirects and unsupported routes are rejected. This gives the tourist
a truthful transport search handoff, not live schedules, inventory, fares,
seats, payment, or confirmation.

In the itinerary UI, EasyBook is rendered as a transport transition from the
previous place to the next destination, not as an attraction or an operator
that Jalan2 can reserve. The card shows the route, estimated journey time,
transport mode, the next Jalan2 stop, and a prominent external EasyBook action.
External EasyBook legs are excluded from Jalan2's WhatsApp reservation workflow.

When rail and coach are both plausible, the plan shows KTMB and EasyBook as
separate ticket-search choices rather than silently picking one and hiding the
other. Transport selection is not delegated to an AI guess. AI extracts the source
places, Google Places grounds their coordinates, and Google Routes provides
distance for a city-level destination. Jalan2 only checks EasyBook for an
intercity leg above 80 km, then shows the handoff only when the official route
page contains both endpoints. Attraction names are never treated as bus cities.

The KL to Gopeng demo adds a separate Ipoh Amanjaya to Gopeng transfer. The
recommended path is operator pickup because the activity provider controls the
meeting time and equipment transfer. Grab is a fallback link whose coverage and
fare must still be checked in the Grab app. Jalan2 does not claim a Grab booking
API integration.

EasyBook's public affiliate and widget offering is the realistic next
integration step. A production inventory flow requires a commercial partner
API or another licensed transport provider. Do not scrape a booking result and
present it as reserved inventory.

### Route feasibility, stops on the way and hotels

The map now appears directly below the trip summary. Native builds use the map
SDK. Web requests a numbered Google Maps Static preview through Jalan2's server,
so the Google key is never included in the Expo web bundle. If Maps Static is
not enabled, quota is exhausted or Google returns an error, the same panel
switches to interactive OpenStreetMap tiles instead of becoming blank. The
Directions action always opens the full Google Maps route. Long-haul demos default to the
destination area so a Kuala Lumpur origin does not compress all island or rural
stops into one unreadable cluster; the traveler can still switch to the whole
trip. The on-the-way card is also available on
curated demos. It samples short routes once and longer routes at the start,
midpoint and end, asks Google Places for popular nearby places, then rejects
candidates more than 5 km from the route before ranking rating, popularity,
variety and detour.

Day feasibility is deterministic. It totals the known activity and transport
durations, or uses the optimized Google route schedule when available, and
labels time that is still missing. Routes over nine hours recommend an
overnight. When the plan has a start date, the Agoda handoff carries destination,
check-in, check-out, travelers and room count. It remains an external search,
not live room inventory or a booking integration. Production Agoda rates and
booking require approved partner credentials and certification.

Every physical stop now has two immediate mobility actions. Directions opens a
universal Google Maps URL to the grounded Place ID and coordinates. Grab copies
the exact destination address and opens Grab's official booking screen. Grab
does not publish a supported destination-prefill deep link, so Jalan2 does not
invent one or claim the ride is booked. The stop also displays a localized
question prompt covering what to order or what to confirm with the guide.

Place search now retains a licensed Wikimedia fallback even when Google reports
that a Place photo exists. If the proxied Google image later fails because of a
quota, billing or stale-reference error, the client switches to that fallback
instead of rendering a blank tile. Route suggestions are ranked before image
enrichment, limiting Commons lookups to the five cards actually shown and
avoiding a burst of requests for discarded candidates.

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

For live extraction of both platforms at once, set `EXTRACTOR=auto`: XHS
links go to the self-hosted sidecar and TikTok links go to TikHub. Start the
sidecar and configure `server/.env`:

```
docker compose -f compose.xhs.yml up -d
```

```env
EXTRACTOR=auto
XHS_DOWNLOADER_URL=http://127.0.0.1:5556
TIKHUB_TOKEN=your_tikhub_token
PIPELINE_MODE=live
PLACES_PROVIDER=auto
ROUTING_PROVIDER=auto
GOOGLE_MAPS_API_KEY=your_server_side_key
GOOGLE_CLOUD_TTS_API_KEY=your_dedicated_tts_server_key
GOOGLE_CANTONESE_VOICE=yue-HK-Standard-A
```

Enable Places API (New), Routes API and Maps Static API for that server key.
The live map endpoint intentionally returns a failure and lets the web client
use its OpenStreetMap fallback when Maps Static is not enabled. Restrict the key
to the server and those APIs; do not copy it into an `EXPO_PUBLIC_` variable.

For Cantonese menu audio, enable Cloud Text-to-Speech and create a separate API
key restricted to that API. A Google OAuth web client ID cannot be used as the
key, and an HTTP-referrer-restricted Maps key will normally return
`API_KEY_SERVICE_BLOCKED` from the Node backend. Keep the TTS key only in
`server/.env`; the app requests audio through Jalan2's menu endpoint.

The sidecar exposes `POST /xhs/detail` on port 5556. It is GPL-3.0 software;
review its license obligations before distributing a combined deployment. Keep
any optional XHS Cookie in the sidecar's private volume, never in Git or client
configuration. `EXTRACTOR=xhs-downloader` or `EXTRACTOR=tikhub` still select a
single provider; the fixture URLs always serve their cached bundles either way.

For a live TikTok post, provide `TIKHUB_TOKEN`. The TikTok fallback path also
uses the optional `yt-dlp` binary when TikHub cannot parse a post; install it
with `winget install yt-dlp.yt-dlp`. Keep all provider keys in `server/.env`;
the Expo client must never receive them. In `auto` mode, Places and Routes use
Google when the server key is configured and fall back to deterministic local
providers when it is not.

Live smoke commands are explicit because they call paid or quota-limited
providers:

```bash
npm --prefix server run smoke:extractors  # supplied TikTok + XHS source media
npm --prefix server run smoke:providers   # Google Routes + Exa
npm --prefix server run smoke:live        # Places, suggestions, menu vision + images
npm --prefix server run smoke:pipeline    # complete TikTok-to-trip pipeline
```

Set `JALAN2_SMOKE_SOURCE` to run the full pipeline against another public post.
The scripts report provider, live/cache status, counts, timing, and safe boolean
outcomes without printing API keys, contact details, or raw evidence. They never
send WhatsApp messages. Google Routes can require billing even when the same
project key works with Google Places; the app falls back to the offline router
and should not label that result as live Google routing.

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
