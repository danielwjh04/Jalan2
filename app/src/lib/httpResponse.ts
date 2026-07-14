export async function parseApiResponse<T>(response: Response): Promise<T> {
  const data = await responseData(response);
  if (!response.ok) {
    const message = errorFrom(data) ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return data as T;
}

async function responseData(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const text = await response.text();
  if (text.length === 0) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    if (response.ok) throw new Error("Server returned an invalid response");
    return null;
  }
}

function errorFrom(data: unknown): string | null {
  if (typeof data !== "object" || data === null || !("error" in data)) return null;
  return String((data as { error: unknown }).error);
}
