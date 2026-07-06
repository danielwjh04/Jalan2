import Constants from 'expo-constants';
import type { DirectoryEntry, FixtureRef } from '@shared/api';
import type { BookingRequest, Itinerary } from '@shared/status';

// Resolution order: explicit env override, then the Expo dev-server host,
// which is the laptop's LAN IP when running in Expo Go on a real phone.
function baseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return host ? `http://${host}:3001` : 'http://localhost:3001';
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, init);
  const data: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'error' in data
        ? String((data as { error: unknown }).error)
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return data as T;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function ingest(url: string): Promise<{ id: string }> {
  return post('/ingest', { url });
}

export function getItinerary(id: string): Promise<Itinerary> {
  return request(`/itinerary/${id}`);
}

export function book(id: string, requested: BookingRequest): Promise<Itinerary> {
  return post('/book', { id, ...requested });
}

export function getDirectory(): Promise<DirectoryEntry[]> {
  return request('/directory');
}

export function getFixtures(): Promise<FixtureRef[]> {
  return request('/fixtures');
}
