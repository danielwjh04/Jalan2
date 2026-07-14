const BASE_URL = 'https://www.easybook.com/en-my/bus/booking';

type RouteFetch = (url: string, init: RequestInit) => Promise<Response>;

export async function findEasybookRoute(
  origin: string,
  destination: string,
  fetcher: RouteFetch = fetch,
): Promise<string | null> {
  if (!validCity(origin) || !validCity(destination)) return null;
  const url = `${BASE_URL}/${slug(origin)}-to-${slug(destination)}`;
  try {
    const response = await fetcher(url, {
      headers: { 'user-agent': 'Jalan2 route availability check' },
      redirect: 'manual',
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;
    const body = (await response.text()).toLowerCase();
    return routePageMatches(body, origin, destination) ? url : null;
  } catch {
    return null;
  }
}

export function routePageMatches(body: string, origin: string, destination: string): boolean {
  const text = body.toLowerCase().replace(/\s+/g, ' ');
  return includesCity(text, origin) && includesCity(text, destination);
}

function includesCity(body: string, city: string): boolean {
  return body.includes(city.toLowerCase());
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function validCity(value: string): boolean {
  return value.trim().length >= 2 && value.trim().length <= 60;
}
