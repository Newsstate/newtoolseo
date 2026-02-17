export interface SEOReport {
  url: string;
  timestamp: string;
  overallScore: number;
  grade: string;

  onPage: OnPageSEO;
  technical: TechnicalSEO;
  performance: PerformanceSEO;
  crawl: CrawlSEO;
  security: SecuritySEO;
  social: SocialSEO;
  content: ContentSEO;
  backlinks: BacklinksSEO;
  rendering: RenderingSEO;
}

export interface OnPageSEO {
  score: number;
  title: { content: string | null; length: number; issues: string[]; score: number };
  metaDescription: { content: string | null; length: number; issues: string[]; score: number };
  headings: { h1: string[]; h2: string[]; h3: string[]; h4: string[]; issues: string[]; score: number };
  images: { total: number; withAlt: number; withoutAlt: number; largeImages: number; issues: string[]; score: number };
  keywords: { topKeywords: Keyword[]; density: Record<string, number>; score: number };
  links: { internal: number; external: number; nofollow: number; issues: string[] };
}

export interface Keyword {
  word: string;
  count: number;
  density: number;
}

export interface TechnicalSEO {
  score: number;
  canonical: string | null;
  robots: string | null;
  viewport: string | null;
  charset: string | null;
  lang: string | null;
  structuredData: { found: boolean; types: string[] };
  hreflang: string[];
  sitemapLinked: boolean;
  robotsTxt: { accessible: boolean; content: string | null };
  httpToHttps: boolean;
  www: boolean;
  issues: string[];
}

export interface PerformanceSEO {
  score: number;
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  fcp: string;
  lcp: string;
  tbt: string;
  cls: string;
  tti: string;
  speedIndex: string;
  resourceCount: number;
  totalSize: string;
  issues: string[];
  error?: string;
}

export interface CrawlSEO {
  score: number;
  indexable: boolean;
  robotsBlocked: boolean;
  nofollowPage: boolean;
  canonicalCorrect: boolean;
  internalLinks: CrawlLink[];
  brokenLinks: string[];
  redirectChains: string[];
  paginationTags: boolean;
  ampVersion: boolean;
  issues: string[];
}

export interface CrawlLink {
  href: string;
  text: string;
  rel: string;
  status?: number;
}

export interface SecuritySEO {
  score: number;
  https: boolean;
  hsts: boolean;
  mixedContent: boolean;
  csp: boolean;
  xFrameOptions: boolean;
  safeHeaders: Record<string, string | null>;
  issues: string[];
}

export interface SocialSEO {
  score: number;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogType: string | null;
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  issues: string[];
}

export interface ContentSEO {
  score: number;
  wordCount: number;
  paragraphCount: number;
  readabilityScore: number;
  readabilityGrade: string;
  avgSentenceLength: number;
  contentToCodeRatio: number;
  duplicateContent: boolean;
  issues: string[];
}

export interface BacklinksSEO {
  score: number;
  externalLinksOut: number;
  nofollowRatio: number;
  sponsoredLinks: number;
  ugcLinks: number;
  note: string;
}

export interface RenderingSEO {
  score: number;
  lazyLoadImages: boolean;
  jsRenderRequired: boolean;
  iframes: number;
  flashContent: boolean;
  cssBlocking: number;
  jsBlocking: number;
  inlineStyles: number;
  issues: string[];
}
