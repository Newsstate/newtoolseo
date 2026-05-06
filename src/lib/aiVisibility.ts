import { CheerioAPI } from "cheerio";

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function analyzeAIVisibility($: CheerioAPI, url: string) {
  const hints: string[] = [];

  // -----------------------
  // Answerability Score
  // -----------------------
  const paragraphs = $("p").length;
  const lists = $("ul,ol").length;
  const faqSchema = $(
    "script[type='application/ld+json']:contains('FAQ')"
  ).length;

  let answerability = paragraphs * 2 + lists * 5 + faqSchema * 20;

  if (paragraphs < 5)
    hints.push("Add more direct answer-style paragraphs.");

  answerability = clamp(answerability);

  // -----------------------
  // Entity Authority
  // -----------------------
  const headingsText = $("h1,h2,h3,strong").text();
  const entities = headingsText.split(" ").length;

  const entityAuthority = clamp(entities / 4);

  // -----------------------
  // Citation Readiness
  // -----------------------
  const authorityLinks = $(
    "a[href*='.gov'], a[href*='.edu'], a[href*='wikipedia']"
  ).length;

  let citationReadiness = clamp(authorityLinks * 15);

  if (authorityLinks === 0)
    hints.push("Add trusted outbound references for AI citation.");

  // -----------------------
  // LLM Accessibility
  // -----------------------
  const hasSchema =
    $("script[type='application/ld+json']").length > 0;

  const textLength = $("body").text().length;

  let llmAccessibility = 50;

  if (hasSchema) llmAccessibility += 25;
  if (textLength > 1500) llmAccessibility += 25;

  llmAccessibility = clamp(llmAccessibility);

  // -----------------------
  // FINAL SCORE
  // -----------------------
  const score = clamp(
    answerability * 0.3 +
      entityAuthority * 0.25 +
      citationReadiness * 0.25 +
      llmAccessibility * 0.2
  );

  return {
    score,
    answerability,
    entityAuthority,
    citationReadiness,
    llmAccessibility,
    hints,
  };
}
