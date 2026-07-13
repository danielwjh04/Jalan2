import Constants from "expo-constants";
import type {
  BriefLang,
  DirectoryEntry,
  FixtureCard,
  IngestResponse,
  MenuResponse,
  PhraseClipResponse,
  VoiceBriefResponse,
} from "@shared/api";
import type { TripPlan } from "@shared/trip";
import type { BookingRequest, Itinerary } from "@shared/status";
import type { ExperienceRecord, ReviewSubmission } from "@shared/reviews";
import { resolveBaseUrl } from "./baseUrl";

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
      typeof data === "object" && data !== null && "error" in data
        ? String((data as { error: unknown }).error)
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return data as T;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function ingest(url: string): Promise<IngestResponse> {
  return post("/ingest", { url });
}

export function getTrip(id: string): Promise<TripPlan> {
  return request(`/trips/${id}`);
}

export function optimizeTrip(id: string, stopIds: string[]): Promise<TripPlan> {
  return post(`/trips/${id}/optimize`, { stopIds });
}

export function getItinerary(id: string): Promise<Itinerary> {
  return request(`/itinerary/${id}`);
}

export function book(
  id: string,
  requested: BookingRequest,
): Promise<Itinerary> {
  return post("/book", { id, ...requested });
}

export function getDirectory(): Promise<DirectoryEntry[]> {
  return request("/directory");
}

export function getExperience(id: string): Promise<ExperienceRecord> {
  return request(`/experiences/${encodeURIComponent(id)}`);
}

export function submitExperienceReview(
  id: string,
  review: ReviewSubmission,
): Promise<ExperienceRecord> {
  return post(`/experiences/${encodeURIComponent(id)}/reviews`, review);
}

export function getFixtures(): Promise<FixtureCard[]> {
  return request("/fixtures");
}

export function getVoiceBrief(
  id: string,
  lang: BriefLang,
): Promise<VoiceBriefResponse> {
  return request(`/voice/brief/${id}?lang=${lang}`);
}

export function getTripVoiceBrief(
  id: string,
  lang: BriefLang,
): Promise<VoiceBriefResponse> {
  return request(`/voice/trip/${id}?lang=${lang}`);
}

export function getPhrases(): Promise<PhraseClipResponse[]> {
  return request("/voice/phrases");
}

export function postMenu(payload: {
  imageBase64: string;
  mimeType: "image/jpeg" | "image/png";
}): Promise<MenuResponse> {
  return post("/menu", payload);
}

export function getMenu(id: string): Promise<MenuResponse> {
  return request(`/menu/${id}`);
}

export function serverUrl(path: string): string {
  return `${baseUrl()}${path}`;
}
