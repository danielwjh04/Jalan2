# Discovery trip reservations implementation plan

**Goal:** Let users copy any Home or Discover journey into an editable trip and reserve all eligible stops through separate, correlated WhatsApp requests.

**Architecture:** Curated journeys remain immutable templates. A server copy endpoint creates an in-memory `saved_discovery` trip with a unique ID, and a safe list endpoint supplies Trips, Home, and Discover. A separate reservation-batch model previews eligibility, sends one request per bookable stop, and correlates replies by sender plus short reference without changing Booking JSON.

**Tech stack:** TypeScript, Zod, Express, React Native, Expo Router, Vitest, existing messaging adapters.

## Global constraints

- Keep Booking JSON and the existing single-itinerary `/book` flow unchanged.
- Never send to phone numbers extracted from videos or Google Places.
- Require an explicit user tap before any message is sent.
- Keep functions at or below 50 lines and components at or below 200 lines.
- Use tests first and observe the expected failure before production edits.
- Keep curated templates immutable and omit private messaging destinations from API responses.
- Work directly on `main` because the user explicitly requested localhost updates and a direct push to `main`.

---

### Task 1: Shared trip and reservation contracts

**Files:**

- Modify: `shared/src/trip.ts`
- Modify: `shared/src/api.ts`
- Modify: `shared/src/index.ts`
- Create: `shared/src/reservation.ts`
- Modify: `shared/test/trip.test.ts`
- Create: `shared/test/reservation.test.ts`
- Modify: `server/src/adapters/places/google.ts`
- Modify: `server/src/pipeline/trip.ts`
- Modify: `server/discoveries/trips.json`
- Test: `server/test/places.test.ts`

**Interfaces:**

- `TripPlan.origin`: `"video" | "curated" | "saved_discovery"`
- `TripPlan.source_discovery_id`: `string | null`
- `TripStop.primary_type`: `string | null`
- `TripStop.reservation_hint`: `"bookable" | "walk_in" | null`
- `SavedTripSummary`: public list data with no contact fields
- `ReservationPreview`, `TripReservationBatch`, `TripStopReservation`, and `CreateTripReservationRequest`

- [ ] Write failing schema tests for saved discoveries, place types, reservation hints, valid batch states, invalid dates, invalid times, and duplicate stop IDs.
- [ ] Run `npm.cmd test -- shared/test/trip.test.ts shared/test/reservation.test.ts server/test/places.test.ts` and confirm failures are caused by missing contracts.
- [ ] Add the strict Zod schemas, exports, Google primary-type mapping, pipeline copying, and curated reservation hints.
- [ ] Rerun the focused tests and confirm they pass.

### Task 2: Immutable discovery copying and saved-trip listing

**Files:**

- Modify: `server/src/store/trips.ts`
- Modify: `server/src/routes/discoveries.ts`
- Modify: `server/src/routes/trips.ts`
- Modify: `server/test/discoveries.test.ts`
- Modify: `server/test/tripRoute.test.ts`
- Create: `server/test/savedTrips.test.ts`
- Modify: `app/src/lib/api.ts`
- Create: `app/src/lib/useSavedDiscoveryTrips.ts`
- Modify: `app/src/components/DiscoveryCard.tsx`
- Create: `app/src/components/SavedTripCard.tsx`
- Modify: `app/src/components/HomeSections.tsx`
- Modify: `app/src/app/(tabs)/index.tsx`
- Modify: `app/src/app/(tabs)/discover.tsx`
- Modify: `app/src/app/(tabs)/trips.tsx`
- Modify: `app/src/components/TripPlanner.tsx`
- Modify: `app/src/lib/useTripPlanner.ts`
- Modify: `app/test/socialDiscoveries.test.ts`
- Create: `app/test/savedDiscoveryTrips.test.ts`

**Interfaces:**

- `POST /discoveries/:id/trips` accepts `{ clientRequestId }` and returns the copied `TripPlan`.
- `GET /trips` returns `SavedTripSummary[]` newest first.
- `copyDiscoveryTrip(id, clientRequestId)` is idempotent per request ID.
- Curated mutation attempts return `409`; saved copies remain editable.

- [ ] Write failing server tests for deep-copy immutability, idempotency, safe summaries, ordering, and curated mutation rejection.
- [ ] Run `npm.cmd test -- server/test/discoveries.test.ts server/test/tripRoute.test.ts server/test/savedTrips.test.ts` and confirm the new expectations fail.
- [ ] Implement copy metadata, list summaries, route validation, and mutation guards.
- [ ] Rerun the server tests and confirm they pass.
- [ ] Write failing app tests for `Plan this trip`, `Open my trip`, the saved Trips section, and read-only curated previews.
- [ ] Run `npm.cmd test -- app/test/socialDiscoveries.test.ts app/test/savedDiscoveryTrips.test.ts` and confirm the new expectations fail.
- [ ] Implement the shared discovery planning hook, card action, saved-trip card, screen loading, navigation, and curated preview controls.
- [ ] Rerun the app tests and confirm they pass.

### Task 3: Reservation preview, batch sending, and reply correlation

**Files:**

- Create: `server/src/services/reservationEligibility.ts`
- Create: `server/src/store/tripReservations.ts`
- Create: `server/src/services/tripReservations.ts`
- Create: `server/src/routes/tripReservations.ts`
- Modify: `server/src/routes/webhooks.ts`
- Modify: `server/src/adapters/messaging/mock.ts`
- Modify: `server/src/app.ts`
- Create: `server/test/reservationEligibility.test.ts`
- Create: `server/test/tripReservations.test.ts`
- Modify: `server/test/webhookParse.test.ts`

**Interfaces:**

- `POST /trip-reservations/preview` returns selected stops in trip order with eligibility and suggested `HH:mm` values and performs no send.
- `POST /trip-reservations` creates one idempotent batch and sends one request per `BOOKABLE` stop.
- `GET /trip-reservations/:id` returns a public batch.
- `GET /trip-reservations/current?tripId=:tripId` restores the latest batch.
- Operators reply `YES J2-XXXX` or `NO J2-XXXX`; both reference and sender must match.

- [ ] Write failing eligibility tests for explicit hints, Google primary types, unknown stops, and missing approved contact configuration.
- [ ] Write failing service and route tests for preview side-effect freedom, selected-stop snapshots, partial failure, idempotency, safe responses, mixed walk-in states, and curated rejection.
- [ ] Write failing webhook tests for confirmation, decline, unknown reference, sender mismatch, terminal repeats, and regression of the original unreferenced `YES` flow.
- [ ] Run `npm.cmd test -- server/test/reservationEligibility.test.ts server/test/tripReservations.test.ts server/test/webhookParse.test.ts` and confirm failures are caused by the missing feature.
- [ ] Implement eligibility, private storage, public projection, sending, unique references, webhook dispatch, and mock auto-confirm reference extraction.
- [ ] Rerun the focused server tests and confirm they pass.

### Task 4: Trip reservation review and progress interface

**Files:**

- Modify: `app/src/lib/api.ts`
- Create: `app/src/lib/reservationPresentation.ts`
- Create: `app/src/lib/useTripReservations.ts`
- Create: `app/src/components/TripReservationSection.tsx`
- Create: `app/src/components/ReservationStopRow.tsx`
- Modify: `app/src/components/TripPlanner.tsx`
- Modify: `app/src/components/TripStopCard.tsx`
- Create: `app/test/reservationPresentation.test.ts`
- Create: `app/test/tripReservationUi.test.ts`

**Interfaces:**

- `useTripReservations(trip)` owns preview, submit, idempotency key, polling, terminal detection, and cleanup.
- `TripReservationSection` shows `Reserve my trip`, review controls, aggregate progress, and per-stop state.
- Curated templates show only `Add to my trips`; video and saved-discovery trips show reservation controls.

- [ ] Write failing presentation tests for Malaysia date defaults, aggregate labels, terminal detection, editable time validation, and every stop label.
- [ ] Write failing UI source tests for the primary action, preview call, explicit send copy, polling cleanup, and integration in `TripPlanner`.
- [ ] Run `npm.cmd test -- app/test/reservationPresentation.test.ts app/test/tripReservationUi.test.ts` and confirm the feature is absent.
- [ ] Implement the API calls, hook, review card, stop rows, progress card, and trip integration using the existing visual tokens and licensed stop photos.
- [ ] Rerun the focused app tests and confirm they pass.

### Task 5: Documentation, full verification, live browser test, and publish

**Files:**

- Modify: `README.md`
- Modify: `docs/demo-runbook.md`
- Keep: `docs/specs/2026-07-15-trip-reservation-batch-design.md`
- Keep: `docs/plans/2026-07-15-discovery-trip-reservations.md`

- [ ] Update the README and demo runbook to describe discovery copying, batch reservations, reference replies, in-memory limits, and exact test steps.
- [ ] Run `npm.cmd run typecheck`, `npm.cmd run lint`, and `npm.cmd test` with zero failures.
- [ ] Start or refresh the server and Expo web app, then test Home, Discover, copied Trips, reservation preview, send, and mixed progress at mobile width on port 8091 with zero console errors.
- [ ] Run repository hygiene checks against `origin/main`, inspect `git diff --check`, and confirm `.superpowers/` is not staged.
- [ ] Stage only the feature files, commit once with `feat: add discovery trip reservations`, and push `main` to `origin/main`.

## Self-review

- Every requirement in the approved specification maps to one task.
- The plan includes an authoritative preview boundary before sending.
- Shared and server types use the same field names.
- Existing single-booking behavior has an explicit regression test.
- Curated templates are protected at both UI and server mutation boundaries.
- Duplicate trip copies and duplicate sends have independent idempotency tests.
- Private contact destinations are excluded from every public contract.
- No placeholder steps or assistant-tooling metadata are included.
