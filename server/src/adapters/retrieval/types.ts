export interface RetrievalResult {
  title: string;
  url: string;
  snippet: string | null;
  imageUrl: string | null;
  text?: string | null;
}

export interface Retrieval {
  readonly name: 'exa' | 'fixture';
  search(
    query: string,
    limit: number,
    textCharacters?: number,
  ): Promise<RetrievalResult[]>;
}
