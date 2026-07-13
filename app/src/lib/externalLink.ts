export type UrlOpener = (url: string) => Promise<unknown>;

export async function tryOpenExternalUrl(
  url: string,
  open: UrlOpener,
): Promise<boolean> {
  try {
    await open(url);
    return true;
  } catch {
    return false;
  }
}
