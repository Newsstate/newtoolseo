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
  amp: AMPAnalysis;
  intelligence: IntelligenceReport;
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

// ─── AMP TYPES ────────────────────────────────────────────────────────────────

export interface AMPAnalysis {
  score: number;
  hasAmp: boolean;
  isAmpPage: boolean;
  ampUrl: string | null;
  ampHtmlTag: boolean;
  ampBoilerplate: boolean;
  ampCanonical: string | null;
  ampLinkedFromCanonical: boolean;

  validation: AMPValidation;
  technical: AMPTechnical;
  content: AMPContent;
  performance: AMPPerformance;
  comparison: AMPComparison | null;
  issues: string[];
  recommendations: string[];
}

export interface AMPValidation {
  score: number;
  hasAmpHtmlAttribute: boolean;
  hasCharsetUtf8: boolean;
  hasViewport: boolean;
  hasAmpBoilerplate: boolean;
  hasAmpRuntime: boolean;
  hasCanonicalLink: boolean;
  noCustomJs: boolean;
  noInlineStyles: boolean;
  noFormElements: boolean;
  usesAmpImg: boolean;
  usesAmpVideo: boolean;
  usesAmpIframe: boolean;
  forbiddenTagsFound: string[];
  customCssSize: number;
  customCssSizeLimit: number;
  issues: string[];
}

export interface AMPTechnical {
  score: number;
  ampRuntimeSrc: string | null;
  ampComponents: string[];
  ampExtensions: string[];
  structuredData: { found: boolean; types: string[] };
  canonicalPointsToNonAmp: boolean;
  canonicalUrl: string | null;
  selfCanonical: boolean;
  metaCharset: string | null;
  metaViewport: string | null;
  hreflang: string[];
  robotsMeta: string | null;
  isIndexable: boolean;
  issues: string[];
}

export interface AMPContent {
  score: number;
  wordCount: number;
  imgCount: number;
  ampImgCount: number;
  regularImgCount: number;
  videoCount: number;
  ampVideoCount: number;
  iframeCount: number;
  ampIframeCount: number;
  hasAd: boolean;
  hasSocialEmbed: boolean;
  socialEmbedComponents: string[];
  issues: string[];
}

export interface AMPPerformance {
  score: number;
  inlineStylesCount: number;
  customCssKb: number;
  scriptTagsCount: number;
  allowedScriptCount: number;
  externalScriptsBlocked: number;
  criticalPathOptimized: boolean;
  issues: string[];
}

export interface AMPComparison {
  canonical: AMPPageSnapshot;
  amp: AMPPageSnapshot;
  differences: AMPDiff[];
  contentParity: number;
  seoEquivalence: number;
}

export interface AMPPageSnapshot {
  url: string;
  title: string | null;
  metaDescription: string | null;
  wordCount: number;
  h1: string | null;
  canonical: string | null;
  structuredData: boolean;
  imgCount: number;
  internalLinks: number;
}

export interface AMPDiff {
  field: string;
  canonical: string | number | boolean | null;
  amp: string | number | boolean | null;
  severity: 'critical' | 'warning' | 'info';
  message: string;
}


export interface IntelligenceReport {
  score: number;
  intent: IntentReport;
  entities: EntityReport;
  eeat: EEATReport;
  linkQuality: LinkQualityReport;
  serp: SerpPreviewReport;
}

export interface IntentReport {
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational' | 'mixed';
  scores: {
    informational: number;
    commercial: number;
    transactional: number;
    navigational: number;
  };
  mismatchRisk: 'low' | 'medium' | 'high';
}

export interface EntityReport {
  topEntities: { name: string; count: number }[];
  uniqueCount: number;
  coverageScore: number;
  hints: string[];
}

export interface EEATReport {
  score: number;
  signals: {
    hasAuthorMeta: boolean;
    hasArticleSchema: boolean;
    hasOrgSchema: boolean;
    hasAbout: boolean;
    hasContact: boolean;
    hasPolicy: boolean;
    hasReviews: boolean;
    citationsCount: number;
  };
  gaps: string[];
}

export interface LinkQualityReport {
  score: number;
  totals: {
    total: number;
    contextual: number;
    navFooter: number;
    };
  anchorDiversity: number;
  genericAnchorRatio: number;
  topAnchors: { text: string; count: number }[];
  hints: string[];
}

export interface SerpPreviewReport {
  title: string;
  metaDescription: string;
  titlePixels: number;
  titleMaxPixels: number;
  titleTruncationRisk: 'low' | 'medium' | 'high';
  descriptionPixels: number;
  descriptionMaxPixels: number;
  descriptionTruncationRisk: 'low' | 'medium' | 'high';
}
