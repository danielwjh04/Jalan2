# Trip reservation batch design

## Goal

Let a traveller turn either an imported TikTok or XHS video or a curated Jalan2 discovery into an editable personal trip, then use one `Reserve my trip` action to request reservations for every selected bookable stop through Jalan2's existing WhatsApp messaging provider.

The user sees each venue's result independently. Places that do not take reservations are skipped and labelled `Walk-in stop`.

## Scope

The reservation flow applies to editable trips with `origin: "video"` or `origin: "saved_discovery"`. Static catalogue trips keep `origin: "curated"` and act as immutable templates.

Home and Discover use the same discovery-card action. A user can preview a curated journey, copy its full three or four stop itinerary into Trips, edit the copy, and reserve its eligible stops. The existing single-operator `/book` flow keeps its current behavior.

The reservation batch must:

- Use the trip's current selected stops and order after the user finishes editing.
- Ask the user to confirm the trip date, guest count, and suggested arrival times before sending.
- Send one WhatsApp request per eligible stop after one explicit user tap.
- Track confirmation, rejection, and delivery failure per stop.
- Skip non-reservable places without treating them as failures.
- Avoid duplicate sends when the user taps twice or retries a timed-out request.
- Keep all messaging destinations server-side.
- Keep curated catalogue templates unchanged when a user edits a copied trip.
- Show copied discoveries in Trips so the user can return to them before reserving.

This change does not add payments, automatic purchasing, authentication, a production database, or cold messaging to phone numbers discovered through Google Places or video evidence.

## Approaches considered

### Separate reservation batch and stop records

Create one batch for the edited trip and one child record for each selected stop. Each WhatsApp message carries a unique reference that identifies its stop reservation.

This is the selected approach because venue replies and failures are independent. It also keeps the existing itinerary extraction and single-operator booking contracts intact.

### Clone an itinerary for every stop

This would reuse more of the current booking service, but it would make one imported trip appear as several unrelated Trips entries. It would also overload the locked Booking JSON contract with Google Places data that did not come from the video evidence.

### Send one combined WhatsApp message

This is smaller, but it fails when stops have different operators and cannot represent a restaurant confirming while an activity declines. It does not meet the required per-stop tracking behavior.

## Discovery-to-trip flow

1. Home shows a preview of the discovery catalogue and Discover shows the full catalogue.
2. Opening the card shows the curated itinerary as a read-only preview.
3. `Plan this trip` on the card or `Add to my trips` on the preview creates one editable copy of the complete itinerary.
4. The server assigns a new trip ID, records the source discovery ID, and leaves the catalogue template unchanged.
5. Jalan2 navigates to the copied trip, where the user can add, remove, reorder, or optimize stops.
6. The copy appears under `Saved discoveries` in Trips.
7. When Home or Discover loads again, a discovery with an existing saved copy shows `Open my trip` instead of silently creating another copy.

Creating a personal trip is explicit. Merely opening a discovery never creates or mutates a trip. Creating another copy of the same discovery is outside this change.

## Reservation flow

1. The user imports a TikTok or XHS link and waits for the generated trip.
2. Alternatively, the user copies a curated discovery into Trips.
3. The user adds, removes, reorders, or optimizes stops.
4. A `Reserve my trip` action appears on the editable video or saved-discovery trip.
5. A review sheet shows the trip date, guests, and selected stops in trip order.
6. Bookable stops show an editable suggested arrival time.
7. Non-reservable stops show `Walk-in stop` and are not messaged.
8. Stops that appear bookable but have no approved messaging destination show `Contact unavailable` and are not messaged.
9. The user taps `Send reservation requests` once.
10. Jalan2 creates the batch, sends separate WhatsApp requests, and returns the initial per-stop results.
11. The trip screen polls the batch while replies are outstanding and updates each stop independently.

The review sheet must state that Jalan2 is requesting availability, no payment is made, and a venue is not reserved until its status is `Confirmed`.

## Reservation eligibility

Google Places primary type can help classify a stop as potentially bookable or walk-in. The classification is advisory and must not supply a messaging destination.

Examples of potentially bookable stops include restaurants, cafes that accept reservations, ticketed attractions, guided activities, and accommodation. Parks, public viewpoints, markets, malls, and street-food areas default to walk-in.

The server is authoritative. It resolves each selected stop into one of three eligibility results:

- `BOOKABLE`: a reservation is appropriate and an approved server-side destination exists.
- `WALK_IN`: a reservation is not required or is not normally available.
- `CONTACT_UNAVAILABLE`: a reservation may be appropriate, but Jalan2 has no approved destination.

In demo mode, bookable stops may route to the existing configured demo operator address. Every request still has a distinct reference. Outside demo mode, destinations must come from an explicitly configured or consented operator contact source. Extracted phone numbers and Google Places phone numbers are never messaged automatically.

## Data contracts

The locked `BookingJson` and existing `Itinerary` status machine remain unchanged.

`TripPlan.origin` gains `saved_discovery`. A copied trip stores `source_discovery_id`, while video trips and catalogue templates keep it null. Static discovery JSON remains `origin: "curated"`.

A safe Trips-list contract contains:

```text
SavedTripSummary
  id
  sourceDiscoveryId
  title
  region
  coverUrl
  stopCount
  updatedAt
```

The trip store maintains summary timestamps server-side. The client does not infer saved state from catalogue IDs.

A new shared reservation contract contains:

```text
TripReservationBatch
  id
  clientRequestId
  tripId
  tripDate
  pax
  stops: TripStopReservation[]
  createdAt
  updatedAt

TripStopReservation
  id
  batchId
  stopId
  reference
  stopName
  requestedStartISO
  eligibility: BOOKABLE | WALK_IN | CONTACT_UNAVAILABLE
  status: PENDING_CONFIRM | CONFIRMED | DECLINED | FAILED | SKIPPED
  failureReason
  messages
  updatedAt
```

`SKIPPED` is paired with `WALK_IN` or `CONTACT_UNAVAILABLE`. The user-facing label comes from eligibility, so a walk-in place is never displayed as a failed reservation.

The batch summary is derived from its stop records rather than stored as a second source of truth. It returns counts such as `2 confirmed, 1 waiting, 2 walk-in`.

The server stores the destination used for correlation, but API responses never expose phone numbers, WhatsApp addresses, raw provider identifiers, or private operator configuration.

## Suggested times

The default requested time uses the optimized route arrival for the stop. If the route has not been optimized, Jalan2 derives times from selected-stop order, the trip start preference, travel estimates, and stop durations.

The client sends the trip date as `YYYY-MM-DD` and each requested time as `HH:mm`. The server combines them in `Asia/Kuala_Lumpur` and stores an ISO timestamp with the `+08:00` offset. This avoids a device or JavaScript UTC conversion moving a reservation to another day.

The user can edit each bookable stop time in the review sheet. Invalid, missing, conflicting, or past times prevent sending and show a field-level error.

## API

### Copy a discovery into Trips

```text
POST /discoveries/:id/trips
```

The request contains a `clientRequestId`. The server reloads the immutable discovery template, deep-copies its stops and selection, assigns a new ID, sets `origin: "saved_discovery"`, and records `source_discovery_id`.

Repeating the same `clientRequestId` returns the same copy. It never creates two trips from a double tap or network retry. Mutation endpoints reject `origin: "curated"`, so a catalogue template cannot be edited through a direct API call.

### List saved discovery trips

```text
GET /trips
```

The response contains `SavedTripSummary[]`, newest first. Home and Discover use `sourceDiscoveryId` to show `Open my trip` for an existing copy. Trips renders the same summaries under `Saved discoveries`.

### Preview a batch

Before creating a batch, the app requests an authoritative preview:

```text
POST /trip-reservations/preview
```

The request contains `tripId`, `tripDate`, and `pax`. The response lists the current selected stops in trip order with their eligibility, licensed image, and suggested `HH:mm` time. It never returns a messaging destination. The preview performs no external send and creates no reservation state.

### Create a batch

```text
POST /trip-reservations
```

The request contains `tripId`, `tripDate`, `pax`, `clientRequestId`, and `HH:mm` requested times keyed by stop ID.

The server reloads the current trip instead of trusting stop names, destinations, eligibility, or phone numbers from the client. It accepts only `video` and `saved_discovery` origins and snapshots the current selected stops.

`clientRequestId` is an idempotency key. The server creates every stop record before the first provider call and records a send attempt immediately before calling the provider. Repeating the same request returns the existing batch and never calls the provider again for an attempted stop. A different key cannot create another active batch for the same trip while requests are pending.

This provides one send attempt per stop within the current in-memory server session. It cannot provide durable exactly-once delivery across a server crash because Jalan2 intentionally has no production database and the current messaging adapter has no provider idempotency key. After a restart, the app must describe the old session as expired instead of silently recreating or resending it.

### Read a batch

```text
GET /trip-reservations/:id
```

The response contains the public batch contract and derived counts. It omits all messaging destinations.

### Restore current progress

```text
GET /trip-reservations/current?tripId=:tripId
```

The endpoint returns the active or most recent batch for the trip, or `404` when none exists. This lets the app restore progress after navigation without changing the existing trip contract. The in-memory demo limitation remains: a server restart expires the trip and reservation batch together.

## WhatsApp messages and reply correlation

Each bookable stop receives a separate message containing:

- The venue or operator name.
- Requested date, time, and guest count.
- The trip title for context.
- A unique short reference such as `J2-K4P7`.
- Explicit reply instructions: `YES J2-K4P7` to confirm or `NO J2-K4P7` to decline.

Inbound handling extracts the reference first, then verifies that the sender matches the stored destination for that stop reservation. A missing reference, unknown reference, or sender mismatch does not update any reservation.

The new reference-aware handler runs before the existing single-itinerary handler. Existing `YES` replies for the original `/book` flow continue to work unchanged.

## Failure and concurrency behavior

- Message sends are independent. One provider failure marks only that stop as `FAILED`.
- The batch is returned even when it contains a mix of waiting, failed, and skipped stops.
- The send button disables immediately and uses the same `clientRequestId` for a network retry.
- A duplicate request never sends duplicate WhatsApp messages.
- Late replies update the referenced pending stop only.
- A second confirmation or decline for a terminal stop is recorded as a message but does not change the terminal status.
- Polling stops when no reservation remains pending and is cleaned up when the screen unmounts.
- If in-memory state expires after a restart, the app explains that the demo reservation session expired. It warns that an earlier outbound request may already have been delivered before allowing the user to explicitly create a fresh batch from the restored trip.

## Interface

The trip detail keeps the approved bright Rainforest Kopitiam visual system.

- `Reserve my trip` uses the existing kaya primary-action treatment.
- The review sheet uses white surfaces, sage status chips, licensed stop photos, and the existing charcoal glass navigation.
- After sending, a reservation progress card displays the aggregate counts.
- Each trip stop displays its own reservation badge: `Waiting`, `Confirmed`, `Declined`, `Failed`, `Walk-in stop`, or `Contact unavailable`.
- Bobo appears on a light sage halo beside the progress summary and explains the next unresolved action without obscuring stop photos.

Curated previews show `Add to my trips` instead of editing or reservation controls. Saved copies and video trips show `Reserve my trip`. If every selected stop is walk-in or contact-unavailable, the sheet explains that there is nothing Jalan2 can message and does not create an empty batch.

`DiscoveryCard` keeps its image-led layout in both Home and Discover. Its footer action reads `Plan this trip` before copying and `Open my trip` when a saved copy exists. Both screens use the same component and handler so their behavior cannot drift.

## Security and privacy

- The client never submits or receives an operator phone number.
- Provider credentials and destinations stay server-side.
- Place and video phone numbers are display-only evidence unless an operator has separately supplied consent through an approved contact source.
- Webhook correlation requires both reference and sender match.
- Logs and API errors must not contain provider credentials or full operator addresses.
- No payment or binding purchase occurs in this flow.

## Verification

Focused tests must prove:

- Shared schemas accept every defined reservation state and reject invalid dates, counts, and duplicate stop IDs.
- Discovery copying deep-clones the full itinerary, assigns a unique ID, and never mutates the cached template.
- A repeated discovery `clientRequestId` returns the same personal trip without creating a duplicate.
- Curated mutation endpoints reject direct edits, while saved-discovery copies remain fully editable.
- The saved-trip list is newest first, contains no private booking data, and drives `Open my trip` on both Home and Discover.
- Trips displays saved discovery copies and opens their editable trip route.
- Eligibility classifies supported place types and keeps unknown or contactless venues from being messaged.
- Reservation preview returns authoritative eligibility and suggested times without sending or creating a batch.
- Batch creation snapshots the latest edited selection, accepts video and saved-discovery trips, and rejects curated templates.
- A repeated `clientRequestId` returns the same batch without another send.
- Partial send failure affects only the failed stop.
- Walk-in and contact-unavailable stops are skipped with the correct user-facing label.
- Correct `YES <reference>` and `NO <reference>` replies update only the matching stop.
- Missing references, unknown references, and sender mismatches update nothing.
- The existing single-itinerary `YES` flow still confirms normally.
- The review sheet validates date, guests, and per-stop times.
- Trip progress restores after navigation, stops polling at terminal state, and cleans up its timer.
- Double taps create only one batch.

The release gate is:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
```

The running Expo web app must also be checked at mobile width for a mixed trip containing at least one confirmed stop, one waiting stop, and one walk-in stop. Browser console errors must remain at zero.

## Completion criteria

The feature is complete when a user can copy any Home or Discover journey into Trips without changing the catalogue template, edit either that copy or an imported video trip, send one request per eligible stop through the configured WhatsApp provider with one explicit tap, and see every reply reflected on the correct stop without duplicate sends or exposure of operator contact details.
