# Unified Jalan2 visual system

## Goal

Make Jalan2 feel like one bright, Malaysian, image-led product while preserving the existing video ingestion, menu reading, trip editing, route optimization, transit hand-off, safety brief, operator directory, and WhatsApp booking loop.

The approved direction is the unified system shown in visual option 2. It uses the reference trip timeline and booking celebration as the foundation for every screen, not as isolated mockups.

## Product boundaries

This change does not add authentication, payments, a production database, memberships, or speculative travel-platform features. Booking JSON remains the locked downstream contract. Itinerary history remains limited to the running server session.

## Navigation

The charcoal glass navigation has four real tabs:

- Home: video ingestion, menu scanning, Bobo welcome, and recent discovery previews.
- Discover: Malaysian journey cards and the local operator directory.
- Trips: demo journeys and current-session itineraries grouped by Draft, Waiting, and Confirmed.
- You: locally stored travel defaults and safety preferences without an account.

Detail screens remain available at their current public URLs:

```text
/trip/:id
/itinerary/:id
/menu/:id
/experience/:id
```

Detail routes live under the tab route group so the navigation remains visible. Trip and itinerary details highlight Trips, experience details highlight Discover, and menu details highlight Home. The tab bar filters hidden detail routes and renders only Home, Discover, Trips, and You.

The existing `/directory` entry point redirects to the operator section of Discover.

## Visual language

The existing Rainforest Kopitiam palette remains the source of truth:

- Rainforest ivory canvas.
- White elevated cards.
- Sage markers, status accents, and active navigation.
- Kaya yellow primary actions.
- Charcoal translucent navigation with blur where supported.
- DM Sans for interface text.
- Fraunces for journey names, Bobo moments, and booking celebrations.

Bobo always appears on a light sage halo with enough contrast for the dark mascot. Licensed place and food photography stays image-led, and attribution remains visible through the existing attribution component.

## Shared components

The refresh is built from reusable components:

- `ScreenHeader`: compact back, title, and optional action layout.
- `SurfaceCard`: standard white elevated surface with consistent padding and radius.
- `PhotoCard`: image-led discovery and trip card with attribution support.
- `TimelineRail`: connected numbered trip markers.
- `TripStopCard`: timeline stop content and compact metadata.
- `BookingProgress`: non-interactive Draft, Waiting, Confirmed progress indicator.
- `BookingDetailsCard`: consistent date, guests, meeting point, status, and operator rows.
- `BookingHero`: state-specific Bobo treatment.
- `BoboTip`: compact mascot suggestion bubble.
- `GlassNavBar`: four-item navigation that also maps hidden detail routes to the correct active tab.
- `EmptyStateCard` and `ErrorStateCard`: consistent recovery states with Bobo guidance.

Components remain under 200 lines and functions remain under 50 lines. Screen files compose these components instead of duplicating state-specific layouts.

## Trip plan

The trip screen starts with a compact summary card containing the trip name, stop count, distance, duration, known spend, warnings, and a kaya Optimize action.

Selected stops appear in a connected timeline. Each stop includes:

- A large licensed photo.
- Stop number, name, address, and activity suggestion.
- Duration, estimated cost, and source chips.
- A compact overflow action that preserves View source, Remove, EasyBook, and Delete.

Available stops remain addable. Destination search becomes a dashed add-stop row that expands into the existing search results. Trip preferences remain available in a compact expandable surface. Bobo displays one useful route note based on existing warnings, opening windows, or source information. No route fact is invented.

## Booking states

All booking states share one shell and progress indicator.

### Draft

Draft shows a compact Bobo booking hero, operator and activity summary, date choices, guest stepper, meeting point, and the existing WhatsApp action. The copy continues to state that nothing is sent or paid until the user taps the action.

### Waiting

Waiting shows Bobo in a calm waiting state, the sent request details, operator name, selected date, guest count, current status, and message history. It retains links to the related trip and experience record.

### Confirmed

Confirmed uses the large Bobo halo and `Confirmed lah!` celebration. It shows the final booking details, WhatsApp operator contact, View my trip, safety brief, and experience record actions.

### Failed or expired

Failed states use the same shell with a clear cause and recovery action. If a server restart removes an in-memory itinerary, the screen explains that the demo session expired and directs the user to create a fresh itinerary.

## Home and Discover

Home retains ingestion and menu scanning as its primary actions. It shows a compact preview of Malaysian discoveries rather than carrying the entire catalogue.

Discover owns the full photo gallery and operator directory. A simple segmented control switches between Places and Operators. Operator cards retain demand count, opt-in status, activity, meeting point, and navigation to the live experience record.

## Trips

Trips combines fixture journeys with safe summaries of current-session itineraries. A new read-only `GET /itineraries` endpoint returns only fields needed by the list:

```text
id
tripId
experienceId
coverUrl
status
stage
activity
operatorName
meetingPointName
createdAt
updatedAt
```

The endpoint does not return operator addresses, WhatsApp numbers, raw messages, or raw evidence. Current itineraries are sorted by most recently updated. Empty and network-error states remain distinct and include Retry where appropriate.

## You

You stores a small local preference record using AsyncStorage:

```text
budgetMyr
dayStartMinute
travelPace: relaxed | balanced | packed
safetyLanguage: en | ms
```

Trip preferences expose an explicit Use my defaults action. Budget and starting time map directly to the existing trip preferences. Travel pace chooses an initial stop-count preset only when the user applies the defaults: three for relaxed, four for balanced, and all available stops for packed, with a minimum of two. The user can still edit the selection afterwards. Safety language becomes the initial language in safety-brief components.

This keeps the preferences functional without silently changing existing trips or expanding the backend contract.

## Data flow

```text
Home ingest -> existing ingest API -> itinerary and optional trip
Discover -> fixtures API plus directory API
Trips -> fixtures API plus safe itinerary-summary API
You -> local AsyncStorage preferences
Trip detail -> existing trip APIs plus optional local defaults
Booking detail -> existing itinerary polling and booking API
WhatsApp reply -> existing webhook -> itinerary status update
```

The app does not create duplicate client-side booking state. Server itinerary status remains authoritative.

## Error handling

- Image failures use the existing polished fallback surface.
- Network failures show a clear message and Retry action instead of silently appearing empty.
- Empty Discover, Trips, and Operators sections use specific Bobo guidance.
- Invalid or expired itinerary IDs show the demo-session explanation.
- Draft, Waiting, Confirmed, and Failed visuals are selected from real itinerary status.
- Existing external-link failures continue to use explicit alerts.

## Verification

Focused tests cover:

- Shared itinerary-summary and local-preference types.
- Server itinerary-summary output, sorting, and privacy boundaries.
- Tab visibility and active-tab mapping for detail routes.
- Trip grouping and user-default application helpers.
- Trip timeline content and preserved actions.
- Draft, Waiting, Confirmed, Failed, and expired booking views.
- Discover and Trips empty, error, retry, and populated states.
- Safety-language defaults.

The release gate is:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
```

The running Expo web app is visually checked at mobile width for Home, Discover, Trips, You, trip planning, booking Draft, booking Waiting, booking Confirmed, menus, operators, and experience records. Console errors must remain at zero.

## Completion criteria

The change is complete when all four tabs are functional, detail screens retain their public URLs and glass navigation, the timeline and all booking states match the approved visual direction, older screens use the shared system, all existing behavior is preserved, and the full verification gate passes.
