# iOS share extension build (M4 Mac)

The share extension is the only piece that cannot be built or tested on
Windows. Everything else runs in Expo Go. The shared URL and the pasted URL
feed the same handler (`app/lib/ingest.ts`), so this build only certifies the
last-mile hand-off. If it slips, clipboard paste demos the identical flow.

## One-time setup (do this on day 1, not day 6)

1. Install Xcode from the App Store and run it once to accept licenses.
2. Sign in with the free Apple ID: Xcode > Settings > Accounts.
3. Prove signing works before it matters: build any hello-world dev build to
   the demo iPhone (`npx create-expo-app tmp && cd tmp && npx expo run:ios --device`).

## Building Jalan2 with the share extension

```
cd app
npm install
npm run sync-shared
npx expo prebuild --platform ios
npx expo run:ios --device
```

- `expo-share-intent` is already in `package.json` and `app.json` plugins;
  prebuild generates the native share-extension target from it.
- Pick the demo iPhone when prompted. First run on a new device requires
  trusting the developer profile: Settings > General > VPN & Device
  Management.
- Point the app at the Windows machine: set `EXPO_PUBLIC_API_URL` in
  `app/.env` to `http://<windows-lan-ip>:3001` (same Wi-Fi) before building.

## Smoke test

1. Open TikTok or XHS, pick any curated demo video.
2. Share > Jalan2.
3. The app must open on the itinerary screen with the pipeline running; that
   proves the share intent feeds `ingestVideo()`.

## Signing expiry warning

Free-ID provisioning profiles expire after 7 days. Rebuild
(`npx expo run:ios --device`) the morning of the demo. Put it in the calendar.
