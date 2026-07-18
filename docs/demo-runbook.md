# Demo runbook: the deterministic stage loop

The headline menu and social-trip flows use validated caches in the stage
build. They preserve the real capture, share, navigation, route and hand-off
interactions without depending on a social scraper or model call in front of
the judges.

## Stage inputs

- **Menu:** photograph or choose the prepared kopitiam board. The picker uses
  the real photo interaction, displays a short analysis state, then loads the
  cached 22-dish result with bounding boxes, dish photos, taste, price,
  allergens, and Malay/Cantonese/Mandarin ordering audio.
- **Social trip:** share or paste
  `http://xhslink.com/o/8GLTfuGOS5T`. That exact normalized URL displays the
  planning state, then opens `xhs-ipoh-gopeng-demo-04` from cache.
- **Trip story:** the cache is a verified copy of the creator's real 3D2N,
  mainly self-drive post: 13 grounded stops across Ipoh and Gopeng. It keeps
  the source-specific Lost World parking shuttle, rafting lorry and Ming
  Yue-to-Big Tree Foot walk. The Airbnb and rafting operator are visibly
  marked unnamed. Grab, Google Maps and Agoda are planner hand-offs rather
  than claims made by the creator. KTM and EasyBook are not attached to this
  post because its source does not mention a KL arrival or return.

## Pre-demo checklist (morning of)

- [ ] Rebuild the iOS dev build on the Mac (free-ID signing expires in 7 days).
- [ ] App env: `EXPO_PUBLIC_DEMO_WHATSAPP_NUMBER=+65...` for the operator
      demo phone.
- [ ] `server/.env`: `PIPELINE_MODE=auto`, `MESSAGING_PROVIDER=mock`,
      `MOCK_AUTO_CONFIRM_MS=4000`.
- [ ] Start server, run one full loop end-to-end as rehearsal.
- [ ] Verify meeting-point pins on the map look right.
- [ ] The app points to `https://api-mnl7fuwnga-as.a.run.app`; Wi-Fi and
      hotspot both work because the backend is public HTTPS.
- [ ] Screen-recording of a successful WhatsApp round-trip saved on BOTH
      phones (final insurance).

## The loop (tourist phone + operator phone on stage)

1. Share (or paste) `http://xhslink.com/o/8GLTfuGOS5T` into Jalan2.
2. Narrate the extraction and grounding state. The verified 3D2N guide opens
   with all 13 source places and their original-post images.
3. Inspect the map and itinerary. Open the between-stop directions, the
   creator-specified local transfer notes, and the consolidated trip hand-offs.
4. Point out the evidence boundary: private car comes from the post; Grab and
   Agoda are optional Jalan2 planning aids; unnamed details remain unverified.
5. Open the original XHS source and one Google Maps/Grab/Agoda hand-off to
   prove that the guide stays actionable without pretending to book inventory.

## Fallback ladder

| Failure | Action |
|---|---|
| Share extension broken | Paste the URL. Same handler, lose only the animation. |
| Extractor or OpenAI flaky | Use the verified cache; it was generated from a successful Docker extraction of the same post. |
| Venue Wi-Fi dead | Restart server with `PIPELINE_MODE=cached`; loop runs fully offline. |
| WhatsApp app does not open | Copy the visible outbound message and send it manually to the demo operator number. |
| Mock auto-confirm does not fire | POST `{"from":"mock:operator","text":"YES"}` to `/webhooks/mock`. |
| Want a real inbound channel | Restart server with Twilio or Telegram from `docs/provider-setup.md`. |
| Everything on fire | Play the screen recording. |

## Testing the live pipeline before real clips exist

### Real XHS post through the self-hosted sidecar

1. Run `docker compose -f compose.xhs.yml up -d` at the repository root.
2. Set `PIPELINE_MODE=live`, `EXTRACTOR=auto`, and
   `XHS_DOWNLOADER_URL=http://127.0.0.1:5556` in `server/.env`.
3. Start the server and POST the source with an explicit live override:

   ```sh
   curl -X POST http://localhost:3001/ingest \
     -H 'content-type: application/json' \
     -d '{"url":"http://xhslink.com/o/8GLTfuGOS5T","mode":"live"}'
   ```

4. A live request returns `kind: "booking"`; the deterministic cache returns
   `kind: "trip"`. The current verified post has 15 images and 13 grounded
   itinerary stops. Firebase cannot call a sidecar on localhost, so this check
   is intentionally local.

### Synthetic TikTok fixture

`server/fixtures/kuching-dive-01/` ships with a synthetic 12s vertical video
(staged on-screen text: operator, price, phone, meeting point) so the live
pipeline is exercisable end-to-end with only the OpenAI key:

1. Set `OPENAI_API_KEY` in `server/.env`, `PIPELINE_MODE=live`.
2. Ingest `https://vm.tiktok.com/ZSjKuDive1` from the app or curl.
3. Watch stages advance and compare the fused Booking JSON against
   `booking.cached.json`. The audio track is a tone, so the transcript is
   empty; caption + vision still carry the fusion.

Replace the synthetic clip and placeholder URLs with the real curated Kuching
clips per `server/fixtures/README.md`, then re-run and save the verified
output as the new `booking.cached.json` (that is the demo insurance).
