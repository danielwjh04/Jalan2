import { Linking } from "react-native";

export type UrlOpener = (url: string) => Promise<unknown>;

export async function tryOpenExternalUrl(
  url: string,
  open: UrlOpener = (target) => Linking.openURL(target),
): Promise<boolean> {
  try {
    await open(url);
    return true;
  } catch {
    return false;
  }
}
