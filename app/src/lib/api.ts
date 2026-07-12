import Constants from 'expo-constants';
import type {
  BriefLang,
  DirectoryEntry,
  FixtureCard,
  PhraseClipResponse,
  VoiceBriefResponse,
} from '@shared/api';
import type { BookingRequest, Itinerary } from '@shared/status';
import { resolveBaseUrl } from './baseUrl';

function baseUrl(): string {
  return resolveBaseUrl({
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    hostUri: Constants.expoConfig?.hostUri,
  });
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

export function getFixtures(): Promise<FixtureCard[]> {
  return request('/fixtures');
}

export function getVoiceBrief(id: string, lang: BriefLang): Promise<VoiceBriefResponse> {
  return request(`/voice/brief/${id}?lang=${lang}`);
}

export function getPhrases(): Promise<PhraseClipResponse[]> {
  return request('/voice/phrases');
}

export function serverUrl(path: string): string {
  return `${baseUrl()}${path}`;
}
