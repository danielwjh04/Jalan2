export interface ExtractedMedia {
  fixtureSlug: string | null;
  videoPath: string | null;
  audioPath: string | null;
  coverPath: string | null;
  caption: string | null;
}

export interface Extractor {
  readonly name: 'fixture' | 'tikhub';
  extract(normalizedUrl: string): Promise<ExtractedMedia>;
}
