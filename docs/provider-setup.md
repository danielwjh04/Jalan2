# Provider setup

All keys live in `server/.env` (copy `server/.env.example`). The app never
holds a key. Switching any provider is an env var change followed by a server
restart; no code changes.

## Google Maps Platform

1. Enable Places API (New), Routes API and Maps Static API in the same Google
   Cloud project.
2. Put the server key in `GOOGLE_MAPS_API_KEY`. Never use an `EXPO_PUBLIC_`
   variable for this key.
3. Restrict the key to the Jalan2 server and only those three APIs.

Places grounds destinations and supplies ratings, Routes evaluates road legs,
and Maps Static renders the numbered web preview through `/trips/:id/map`.
When Maps Static is unavailable the client uses an OpenStreetMap fallback and
keeps the Google Maps Directions handoff working.

## OpenAI (live pipeline)

1. Put the key in `OPENAI_API_KEY`.
2. Models are overridable: `OPENAI_STT_MODEL` (default `whisper-1`, the only
   family that returns segment timestamps), `OPENAI_VISION_MODEL`,
   `OPENAI_FUSION_MODEL` (must support structured outputs).
3. `PIPELINE_MODE=auto` (default) runs live and falls back to the fixture's
   `booking.cached.json` on any stage error. `cached` skips OpenAI entirely
   for offline demos. `live` never falls back; use it while tuning fusion.

## ngrok (inbound webhooks)

Both Twilio and Telegram need a public URL for inbound replies.

1. Create a free ngrok account and claim the one free static domain
   (Dashboard > Domains). A static domain survives restarts, so the webhook
   URL never has to be reconfigured.
2. Run: `ngrok http 3001 --domain=<your-static-domain>.ngrok-free.app`

## Twilio WhatsApp sandbox (primary)

1. Twilio Console > Messaging > Try it out > Send a WhatsApp message.
2. From BOTH demo phones (tourist and operator), send `join <sandbox-code>`
   via WhatsApp to the sandbox number (+1 415 523 8886).
   Sandbox participation expires after 72 hours; re-join the morning of the
   demo.
3. In the sandbox settings, set "When a message comes in" to
   `https://<static-domain>.ngrok-free.app/webhooks/twilio` (method POST).
4. `server/.env`:
   ```
   MESSAGING_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   OPERATOR_WHATSAPP=whatsapp:+60xxxxxxxxx   # the second phone
   ```

Outbound messages only ever go to `OPERATOR_WHATSAPP`, never to numbers
extracted from videos. Consensual opt-in, no cold contact.

## Telegram bot (fallback)

If the Twilio sandbox misbehaves, flip to Telegram without touching code:

1. Message @BotFather, `/newbot`, save the token.
2. From the operator phone, open the bot and press Start, then send any
   message.
3. Get the chat id: `https://api.telegram.org/bot<TOKEN>/getUpdates` and read
   `message.chat.id` from the first update.
4. Point the webhook at the server:
   `https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<static-domain>.ngrok-free.app/webhooks/telegram`
5. `server/.env`:
   ```
   MESSAGING_PROVIDER=telegram
   TELEGRAM_BOT_TOKEN=...
   OPERATOR_TELEGRAM_CHAT_ID=...
   ```

## Mock (tests and stage insurance)

`MESSAGING_PROVIDER=mock` logs the outbound message server-side. Set
`MOCK_AUTO_CONFIRM_MS=4000` to have the "operator" reply YES automatically
four seconds after Book is tapped, or POST the reply yourself:

```
curl -X POST http://localhost:3001/webhooks/mock \
  -H "Content-Type: application/json" \
  -d '{"from":"mock:operator","text":"YES"}'
```

## WhatsApp deep link demo mode

For the live phone demo, keep the backend in mock mode and let the Expo app
open WhatsApp on the tourist phone after the user taps Book. This avoids the
Twilio sandbox during judging while still showing the actual WhatsApp draft.

Server env:

```
MESSAGING_PROVIDER=mock
MOCK_AUTO_CONFIRM_MS=4000
```

App env:

```
EXPO_PUBLIC_DEMO_WHATSAPP_NUMBER=+65xxxxxxxx
```

The app prefers a WhatsApp number that is already present in the fused Booking
JSON, then falls back to `EXPO_PUBLIC_DEMO_WHATSAPP_NUMBER`. Do not feed this
from scraped social profiles. Use an evidenced booking contact or your own demo
phone number.

## TikHub extractor

`EXTRACTOR=fixture` (default) serves the curated clips in `server/fixtures/`.
Set `EXTRACTOR=tikhub` and `TIKHUB_TOKEN` to enable live extraction for TikTok
posts. Manifest URLs still use the local fixtures first, so demos stay fast and
do not spend API credit.

The hybrid endpoint works on free credit for TikTok video and photo posts.
Photo posts are converted into a silent local slideshow before entering the
pipeline. XHS routes require a paid TikHub balance, so use manifest fixtures for
XHS demos unless the account has been topped up.
