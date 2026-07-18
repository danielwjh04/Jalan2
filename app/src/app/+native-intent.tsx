// expo-share-intent launches the host app with an internal hand-off URL such
// as `jalan2://dataUrl=jalan2ShareKey#weburl`. The native share hook needs the
// original URL to read the app-group payload, but Expo Router must not try to
// render `dataUrl=jalan2ShareKey` as a screen.
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    if (isShareIntentHandoff(path)) return "/";
    return path;
  } catch {
    return "/";
  }
}

export function isShareIntentHandoff(path: string): boolean {
  const normalized = path.trim().toLowerCase();
  return normalized.startsWith("jalan2://dataurl=")
    || normalized.startsWith("dataurl=jalan2sharekey");
}
