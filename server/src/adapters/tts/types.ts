export interface TtsRequest {
  text: string;
  voiceId: string;
  modelId: string;
}

export interface TextToSpeech {
  readonly name: 'elevenlabs' | 'cached';
  synthesize(request: TtsRequest): Promise<Buffer>;
}
