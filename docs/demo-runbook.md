# Demo runbook: the 90-second loop

Rehearse until boring. Every live dependency has a rehearsed fallback one env
var away.

## Pre-demo checklist (morning of)

- [ ] Rebuild the iOS dev build on the Mac (free-ID signing expires in 7 days).
- [ ] App env: `EXPO_PUBLIC_DEMO_WHATSAPP_NUMBER=+65...` for the operator
      demo phone.
- [ ] `server/.env`: `PIPELINE_MODE=auto`, `MESSAGING_PROVIDER=mock`,
      `MOCK_AUTO_CONFIRM_MS=4000`.
- [ ] Start server, run one full loop end-to-end as rehearsal.
- [ ] Verify meeting-point pins on the map look right.
- [ ] Phone and laptop on the same Wi-Fi; hotspot as backup network.
- [ ] Screen-recording of a successful WhatsApp round-trip saved on BOTH
      phones (final insurance).

## The loop (tourist phone + operator phone on stage)

1. Share (or paste) the curated Kuching dive video into Jalan2.
2. Narrate the stage progress: extracting, transcribing, reading frames,
   fusing. Itinerary card appears: operator, activity, RM price, jetty.
3. Tap the map pin. Tap "Get there": EasyBook/Google Maps opens pre-filled.
4. Tap Book (Saturday, 2 pax). WhatsApp opens on the tourist phone with the
   booking draft addressed to the demo operator number. Send it and hold it up.
5. The mock operator auto-confirms after four seconds. Card flips to
   CONFIRMED. Directory shows the operator opted in.

## Fallback ladder

| Failure | Action |
|---|---|
| Share extension broken | Paste the URL. Same handler, lose only the animation. |
| Extractor or OpenAI flaky | Nothing to do: `auto` mode already fell back to the cached booking (identical card). |
| Venue Wi-Fi dead | Restart server with `PIPELINE_MODE=cached`; loop runs fully offline. |
| WhatsApp app does not open | Copy the visible outbound message and send it manually to the demo operator number. |
| Mock auto-confirm does not fire | POST `{"from":"mock:operator","text":"YES"}` to `/webhooks/mock`. |
| Want a real inbound channel | Restart server with Twilio or Telegram from `docs/provider-setup.md`. |
| Everything on fire | Play the screen recording. |

## Testing the live pipeline before real clips exist

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
