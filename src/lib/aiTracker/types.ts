export interface PromptRequest {
  prompt: string;
  brand: string;
}

export interface ModelResult {
  model: string;
  response: string;
  found: boolean;
  rank: number | null;
}

export interface PromptRankingReport {
  prompt: string;
  results: ModelResult[];
  visibilityScore: number;
}
