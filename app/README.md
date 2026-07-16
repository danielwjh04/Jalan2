# Jalan2 app

Expo client for Jalan2. See the [repo README](../README.md) for the full
quickstart and [docs/mac-share-build.md](../docs/mac-share-build.md) for the
iOS share-extension dev build.

The client is organized around two primary flows:

1. combine one or more XHS/TikTok posts into a grounded, draggable itinerary
   with explicit origin, final endpoint or return journey, map, EasyBook/KTMB
   choices and locally confirmed last-mile transfers;
2. scan a kopitiam menu, point to the detected printed row, swipe through
   conservatively verified dish photos and speak the order in Malay, Cantonese
   or Mandarin.

Cantonese audio is returned by the backend through Google Cloud TTS `yue-HK`.
No Google, ElevenLabs or other provider key belongs in the Expo environment.
Use only `EXPO_PUBLIC_API_URL` to point the client at the Jalan2 server.

```
npm install
npm start   # syncs shared/ then starts Metro; scan the QR in Expo Go
```
