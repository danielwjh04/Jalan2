export interface DirectoryEntry {
  operatorName: string;
  activity: string;
  meetingPointName: string;
  demandCount: number;
  optedIn: boolean;
  lastDemandAt: string;
}

export interface FixtureRef {
  slug: string;
  url: string;
}

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

export type BriefLang = 'en' | 'ms';

export type VoiceServedFrom = 'fixture' | 'cache' | 'live' | null;

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
  menu: import('./menu').MenuJson;
  servedFrom: 'live' | 'cache';
  dishAudio: (string | null)[];
}
