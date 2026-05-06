import { askOpenAI } from "./aiClients";
import { detectBrandRank } from "./rankAnalyzer";
import { PromptRankingReport } from "./types";

export async function runPromptRanking(
  prompt: string,
  brand: string
): Promise<PromptRankingReport> {

  const response = await askOpenAI(prompt);

  const analysis = detectBrandRank(response, brand);

  const results = [
    {
      model: "ChatGPT",
      response,
      ...analysis,
    },
  ];

  const visibilityScore =
    analysis.found ? Math.max(0, 100 - (analysis.rank ?? 10) * 10) : 0;

  return {
    prompt,
    results,
    visibilityScore,
  };
}
