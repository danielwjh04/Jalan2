export interface TtsRequest {
  text: string;
  voiceId: string;
  modelId: string;
  languageCode?: string;
  voiceName?: string;
}

export interface TextToSpeech {
  readonly name: 'elevenlabs' | 'google_cloud' | 'cached' | 'language_router';
  synthesize(request: TtsRequest): Promise<Buffer>;
}
