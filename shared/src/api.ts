export interface DirectoryEntry {
  experienceId: string;
  operatorName: string;
  activity: string;
  meetingPointName: string;
  coverUrl: string | null;
  demandCount: number;
  optedIn: boolean;
  lastDemandAt: string | null;
  source: "session" | "fixture";
}

export interface ItinerarySummary {
  id: string;
  tripId: string | null;
  experienceId: string | null;
  coverUrl: string | null;
  status: import("./status").ItineraryStatus;
  stage: import("./status").PipelineStage;
  activity: string | null;
  operatorName: string | null;
  meetingPointName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DiscoveryCard {
  id: string;
  title: string;
  summary: string;
  region: string;
  curator: string;
  coverUrl: string | null;
  coverAttributions: import("./media").ImageAttribution[];
  stopCount: number;
  durationMinutes: number;
}

export interface FixtureRef {
  slug: string;
  url: string;
}

export type IngestResponse =
  | { id: string; kind: "trip"; bookingId: string }
  | { id: string; kind: "booking" };

// What GET /fixtures serves the home screen: one card per fixture, enriched
// from its cached booking and cover image when those exist.
export interface FixtureCard extends FixtureRef {
  coverUrl: string | null;
  activity: string | null;
  operatorName: string | null;
  priceMyr: number | null;
  meetingPointName: string | null;
  region: string | null;
}

export type BriefLang = "en" | "ms" | "zh";

export type VoiceServedFrom = "fixture" | "cache" | "live" | null;

// All voice audio is synthetic stock-voice TTS; synthetic is always true so
// clients cannot forget to label it.
export interface VoiceBriefResponse {
  itineraryId: string;
  lang: BriefLang;
  text: string;
  synthetic: true;
  audioUrl: string | null;
  servedFrom: VoiceServedFrom;
}

export interface PhraseClipResponse {
  id: string;
  textLocal: string;
  textEnglish: string;
  audioUrl: string | null;
  servedFrom: VoiceServedFrom;
}

// What POST /menu and GET /menu/:id serve. dishAudio is index-aligned with
// menu.dishes; entries are null when no synthetic clip is available yet.
export interface MenuResponse {
  id: string;
  menu: import("./menu").MenuJson;
  servedFrom: "live" | "cache";
  dishAudio: (string | null)[];
}
