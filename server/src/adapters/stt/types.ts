export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface Transcript {
  text: string;
  segments: TranscriptSegment[];
}

export interface SpeechToText {
  readonly name: 'openai' | 'elevenlabs';
  transcribe(audioPath: string): Promise<Transcript>;
}
