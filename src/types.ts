export interface DocChunk {
  url: string;
  content: string;
  embedding: number[];
}

export interface SearchResult {
  content: string;
  score: number;
}

export interface DocumentStats {
  url: string;
  count: number;
}

export interface TotalCount {
  total: number;
}
