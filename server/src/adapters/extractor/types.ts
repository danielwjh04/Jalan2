export interface ExtractedMedia {
  fixtureSlug: string | null;
  videoPath: string | null;
  audioPath: string | null;
  coverPath: string | null;
  coverCandidates: string[];
  caption: string | null;
}

export interface Extractor {
  readonly name: 'fixture' | 'tikhub' | 'xhs-downloader' | 'auto';
  extract(normalizedUrl: string): Promise<ExtractedMedia>;
}
