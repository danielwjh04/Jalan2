import Constants from "expo-constants";
import type {
  BriefLang,
  DiscoveryCard,
  DirectoryEntry,
  FixtureCard,
  IngestResponse,
  ItinerarySummary,
  SavedTripSummary,
  MenuResponse,
  PhraseClipResponse,
  VoiceBriefResponse,
} from "@shared/api";
import type { PlaceCandidate, TripPlan, TripPreferences } from "@shared/trip";
import type { BookingRequest, Itinerary } from "@shared/status";
import type { ExperienceRecord, ReviewSubmission } from "@shared/reviews";
import type {
  CreateTripReservationRequest,
  ReservationPreview,
  ReservationPreviewRequest,
  TripReservationBatch,
} from "@shared/reservation";
import { buildPlacePhotoUrl, resolveBaseUrl } from "./baseUrl";
import { parseApiResponse } from "./httpResponse";

function baseUrl(): string {
  return resolveBaseUrl({
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    hostUri: Constants.expoConfig?.hostUri,
  });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, init);
  return parseApiResponse<T>(response);
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

export function optimizeTrip(
  id: string,
  stopIds: string[],
  preferences: TripPreferences,
): Promise<TripPlan> {
  return post(`/trips/${id}/optimize`, { stopIds, preferences });
}

export function updateTrip(
  id: string,
  stopIds: string[],
  preferences: TripPreferences,
): Promise<TripPlan> {
  return request(`/trips/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ stopIds, preferences }),
  });
}

export function searchTripPlaces(id: string, query: string): Promise<PlaceCandidate[]> {
  return post(`/trips/${id}/search`, { query });
}

export function getTripSuggestions(id: string): Promise<PlaceCandidate[]> {
  return request(`/trips/${id}/suggestions`);
}

export function placePhotoUrl(placeId: string): string {
  return buildPlacePhotoUrl(baseUrl(), placeId);
}

export function addTripPlace(id: string, place: PlaceCandidate): Promise<TripPlan> {
  return post(`/trips/${id}/stops`, { place });
}

export function removeTripPlace(id: string, stopId: string): Promise<TripPlan> {
  return request(`/trips/${id}/stops/${encodeURIComponent(stopId)}`, { method: "DELETE" });
}

export function getItinerary(id: string): Promise<Itinerary> {
  return request(`/itinerary/${id}`);
}

export function getItineraries(): Promise<ItinerarySummary[]> {
  return request('/itineraries');
}

export function deleteItinerary(id: string): Promise<void> {
  return request(`/itinerary/${encodeURIComponent(id)}`, { method: "DELETE" });
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

export function getDiscoveries(): Promise<DiscoveryCard[]> {
  return request("/discoveries");
}

export function getSavedTrips(): Promise<SavedTripSummary[]> {
  return request("/trips");
}

export function copyDiscoveryTrip(id: string, clientRequestId: string): Promise<TripPlan> {
  return post(`/discoveries/${id}/trips`, { clientRequestId });
}

export function previewTripReservations(
  input: ReservationPreviewRequest,
): Promise<ReservationPreview> {
  return post("/trip-reservations/preview", input);
}

export function createTripReservations(
  input: CreateTripReservationRequest,
): Promise<TripReservationBatch> {
  return post("/trip-reservations", input);
}

export function getCurrentTripReservation(tripId: string): Promise<TripReservationBatch> {
  return request(`/trip-reservations/current?tripId=${encodeURIComponent(tripId)}`);
}

export function getTripReservation(id: string): Promise<TripReservationBatch> {
  return request(`/trip-reservations/${encodeURIComponent(id)}`);
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

export function mediaUrl(value: string | null): string | null {
  return value?.startsWith("/") ? serverUrl(value) : value;
}
