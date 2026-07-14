interface BaseUrlInput {
  apiUrl: string | undefined;
  apiBaseUrl: string | undefined;
  hostUri: string | undefined;
}

export function resolveBaseUrl({ apiUrl, apiBaseUrl, hostUri }: BaseUrlInput): string {
  if (apiUrl) return apiUrl;
  if (apiBaseUrl) return apiBaseUrl;
  const host = hostUri?.split(':')[0];
  return host ? `http://${host}:3001` : 'http://localhost:3001';
}

export function buildPlacePhotoUrl(apiBaseUrl: string, placeId: string): string {
  return `${apiBaseUrl}/places/${encodeURIComponent(placeId)}/photo`;
}
