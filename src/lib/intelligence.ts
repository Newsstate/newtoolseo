import * as cheerio from 'cheerio';
import type {
  IntelligenceReport,
  IntentReport,
  EntityReport,
  EEATReport,
  LinkQualityReport,
  SerpPreviewReport,
} from './types';

type IntentLabel = 'informational' | 'commercial' | 'transactional' | 'navigational' | 'mixed';

const genericAnchors = new Set([
  'click here',
  'here',
  'read more',
  'learn more',
  'more',
  'this',
  'link',
  'view',
  'see more',
  'details',
  'continue',
  'explore',
]);

function normalizeSpace(s: string) {
  return s.replace(/\s+/g, ' ').trim();
}

function textFromDoc($: cheerio.CheerioAPI) {
  const nodes = $('body')
    .clone()
    .find('script, style, noscript, svg, canvas, iframe')
    .remove()
    .end()
    .text();
  return normalizeSpace(nodes);
}

function getTitleMeta($: cheerio.CheerioAPI) {
  const title = normalizeSpace($('title').first().text() || '');
  const metaDescription = normalizeSpace($('meta[name="description"]').attr('content') || '');
  const h1 = normalizeSpace($('h1').first().text() || '');
  return { title, metaDescription, h1 };
}

function detectIntent($: cheerio.CheerioAPI, url: string): IntentReport {
  const { title, metaDescription, h1 } = getTitleMeta($);
  const all = `${title} ${metaDescription} ${h1} ${url}`.toLowerCase();

  const navSignals = [
    '/login',
    '/signin',
    '/sign-in',
    '/account',
    '/dashboard',
    '/cart',
    '/checkout',
    '/pricing',
    '/plans',
  ];
  const transactionalWords = [
    'buy',
    'purchase',
    'checkout',
    'order',
    'add to cart',
    'subscribe',
    'book',
    'get started',
    'start free trial',
    'free trial',
    'coupon',
    'discount',
    'offer',
    'price',
    'pricing',
    'plans',
  ];
  const commercialWords = [
    'best',
    'top',
    'vs',
    'compare',
    'comparison',
    'review',
    'reviews',
    'alternatives',
    'features',
    'pricing',
    'plans',
    'cheap',
  ];
  const informationalWords = [
    'what is',
    'how to',
    'guide',
    'tutorial',
    'learn',
    'explained',
    'meaning',
    'definition',
    'tips',
    'examples',
    'benefits',
  ];

  let navScore = 0;
  for (const s of navSignals) if (all.includes(s)) navScore += 2;

  let transactionalScore = 0;
  for (const w of transactionalWords) if (all.includes(w)) transactionalScore += 2;

  let commercialScore = 0;
  for (const w of commercialWords) if (all.includes(w)) commercialScore += 1;

  let informationalScore = 0;
  for (const w of informationalWords) if (all.includes(w)) informationalScore += 2;

  const hasForms = $('form').length > 0;
  const hasCartCtas =
    $('a,button').filter((_, el) => normalizeSpace($(el).text()).toLowerCase().includes('add to cart')).length > 0;

  if (hasForms) transactionalScore += 1;
  if (hasCartCtas) transactionalScore += 2;

  const scores = [
    { label: 'navigational' as const, score: navScore },
    { label: 'transactional' as const, score: transactionalScore },
    { label: 'commercial' as const, score: commercialScore },
    { label: 'informational' as const, score: informationalScore },
  ].sort((a, b) => b.score - a.score);

  const top = scores[0];
  const second = scores[1];

  let intent: IntentLabel = top.score === 0 ? 'mixed' : top.label;

  const close = top.score > 0 && second.score > 0 && top.score - second.score <= 1;
  if (close) intent = 'mixed';

  const mismatchRisk = intent === 'mixed' ? 'medium' : top.score <= 2 ? 'medium' : 'low';

  return {
    intent,
    scores: {
      informational: informationalScore,
      commercial: commercialScore,
      transactional: transactionalScore,
      navigational: navScore,
    },
    mismatchRisk,
  };
}

function extractEntities(text: string): EntityReport {
  const tokens = text
    .split(/[\s,.;:!?()[\]{}"“”'’/\\|<>@#$%^&*_+=~`-]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const counts = new Map<string, number>();

  for (const t of tokens) {
    if (t.length < 3) continue;
    if (t.length > 40) continue;
    const hasUpper = /[A-Z]/.test(t);
    const hasLower = /[a-z]/.test(t);
    const isCapitalized = /^[A-Z][a-z]+$/.test(t);
    const isAllCaps = /^[A-Z]{2,}$/.test(t);
    const isMostlyWord = /^[A-Za-z]+$/.test(t);

    if (!isMostlyWord) continue;
    if (!(isCapitalized || isAllCaps)) continue;
    if (!hasUpper || !hasLower && !isAllCaps) continue;

    const key = t;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const topEntities = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([name, count]) => ({ name, count }));

  const uniqueCount = counts.size;
  const coverageScore = Math.min(100, Math.round((uniqueCount / 80) * 100));

  const hints: string[] = [];
  if (coverageScore < 35) hints.push('Low entity richness. Add named concepts (brands, places, people, products) naturally.');
  if (topEntities.length > 0 && topEntities[0].count >= 15) hints.push('One entity dominates. Add supporting subtopics to broaden coverage.');

  return { topEntities, uniqueCount, coverageScore, hints };
}

function detectEEAT($: cheerio.CheerioAPI): EEATReport {
  const hasAuthorMeta = $('meta[name="author"]').length > 0;
  const hasArticleSchema =
    $('script[type="application/ld+json"]')
      .toArray()
      .some((el) => {
        const raw = $(el).text();
        try {
          const data = JSON.parse(raw);
          const arr = Array.isArray(data) ? data : [data];
          return arr.some((x) => {
            const t = x?.['@type'];
            if (!t) return false;
            if (Array.isArray(t)) return t.includes('Article') || t.includes('NewsArticle') || t.includes('BlogPosting');
            return t === 'Article' || t === 'NewsArticle' || t === 'BlogPosting';
          });
        } catch {
          return false;
        }
      });

  const hasOrgSchema =
    $('script[type="application/ld+json"]')
      .toArray()
      .some((el) => {
        const raw = $(el).text();
        try {
          const data = JSON.parse(raw);
          const arr = Array.isArray(data) ? data : [data];
          return arr.some((x) => {
            const t = x?.['@type'];
            if (!t) return false;
            if (Array.isArray(t)) return t.includes('Organization');
            return t === 'Organization';
          });
        } catch {
          return false;
        }
      });

  const internalLinks = $('a[href]').toArray().map((a) => String($(a).attr('href') || ''));
  const hasAbout = internalLinks.some((h) => /about/i.test(h));
  const hasContact = internalLinks.some((h) => /contact/i.test(h));
  const hasPolicy = internalLinks.some((h) => /(privacy|terms|policy)/i.test(h));
  const hasReviews = internalLinks.some((h) => /reviews?/i.test(h)) || $('*[itemprop="review"]').length > 0;

  const citations = $('a[href^="http"]').toArray().filter((a) => {
    const txt = normalizeSpace($(a).text()).toLowerCase();
    return txt.includes('source') || txt.includes('study') || txt.includes('report') || txt.includes('research');
  }).length;

  let score = 0;
  if (hasAuthorMeta) score += 10;
  if (hasArticleSchema) score += 20;
  if (hasOrgSchema) score += 15;
  if (hasAbout) score += 10;
  if (hasContact) score += 10;
  if (hasPolicy) score += 10;
  if (hasReviews) score += 10;
  if (citations >= 2) score += 15;

  score = Math.min(100, score);

  const gaps: string[] = [];
  if (!hasAuthorMeta && !hasArticleSchema) gaps.push('Add author/expertise signals (author meta, Article schema with author).');
  if (!hasOrgSchema) gaps.push('Add Organization schema (publisher).');
  if (!hasAbout) gaps.push('Add an About page link.');
  if (!hasContact) gaps.push('Add a Contact page link.');
  if (!hasPolicy) gaps.push('Add Privacy/Terms links in footer.');
  if (citations < 2) gaps.push('Add citations to authoritative sources where relevant.');

  return {
    score,
    signals: {
      hasAuthorMeta,
      hasArticleSchema,
      hasOrgSchema,
      hasAbout,
      hasContact,
      hasPolicy,
      hasReviews,
      citationsCount: citations,
    },
    gaps,
  };
}

function analyzeLinkQuality($: cheerio.CheerioAPI, baseUrl: string): LinkQualityReport {
  const anchors = $('a[href]')
    .toArray()
    .map((a) => {
      const href = String($(a).attr('href') || '');
      const text = normalizeSpace($(a).text() || '');
      return { href, text };
    });

  const total = anchors.length;

  const navAnchors = $('nav a[href]')
    .toArray()
    .map((a) => normalizeSpace($(a).text() || '').toLowerCase())
    .filter(Boolean);

  const footerAnchors = $('footer a[href]')
    .toArray()
    .map((a) => normalizeSpace($(a).text() || '').toLowerCase())
    .filter(Boolean);

  const allAnchorTexts = anchors.map((x) => x.text.toLowerCase()).filter(Boolean);
  const uniqueAnchors = new Set(allAnchorTexts);

  let genericCount = 0;
  for (const t of allAnchorTexts) if (genericAnchors.has(t)) genericCount += 1;

  const topAnchors = Array.from(
    allAnchorTexts.reduce((m, t) => {
      m.set(t, (m.get(t) || 0) + 1);
      return m;
    }, new Map<string, number>())
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([text, count]) => ({ text, count }));

  const navFooterCount = navAnchors.length + footerAnchors.length;
  const contextualCount = Math.max(0, total - navFooterCount);

  const anchorDiversity = total === 0 ? 0 : Math.round((uniqueAnchors.size / total) * 100);
  const genericRatio = total === 0 ? 0 : Math.round((genericCount / total) * 100);

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (contextualCount >= 10 ? 40 : contextualCount * 4) +
          (anchorDiversity >= 60 ? 30 : (anchorDiversity / 60) * 30) +
          (genericRatio <= 10 ? 30 : Math.max(0, 30 - (genericRatio - 10) * 2))
      )
    )
  );

  const hints: string[] = [];
  if (contextualCount < 6) hints.push('Add more contextual internal links inside the content body.');
  if (anchorDiversity < 35) hints.push('Improve anchor text diversity to avoid repetition.');
  if (genericRatio > 15) hints.push('Replace generic anchors (e.g., “click here”) with descriptive anchors.');

  return {
    score,
    totals: { total, contextual: contextualCount, navFooter: navFooterCount },
    anchorDiversity,
    genericAnchorRatio: genericRatio,
    topAnchors,
    hints,
  };
}

function estimateTitlePixels(title: string) {
  const len = title.length;
  const approx = Math.round(len * 8.8);
  const max = 580;
  const risk = approx > max ? 'high' : approx > max - 60 ? 'medium' : 'low';
  return { pixels: approx, maxPixels: max, risk };
}

function estimateDescPixels(desc: string) {
  const len = desc.length;
  const approx = Math.round(len * 5.6);
  const max = 920;
  const risk = approx > max ? 'high' : approx > max - 90 ? 'medium' : 'low';
  return { pixels: approx, maxPixels: max, risk };
}

function serpPreview($: cheerio.CheerioAPI): SerpPreviewReport {
  const { title, metaDescription } = getTitleMeta($);
  const titlePx = estimateTitlePixels(title);
  const descPx = estimateDescPixels(metaDescription);

  return {
    title,
    metaDescription,
    titlePixels: titlePx.pixels,
    titleMaxPixels: titlePx.maxPixels,
    titleTruncationRisk: titlePx.risk,
    descriptionPixels: descPx.pixels,
    descriptionMaxPixels: descPx.maxPixels,
    descriptionTruncationRisk: descPx.risk,
  };
}

export function analyzeIntelligence(html: string, url: string): IntelligenceReport {
  const $ = cheerio.load(html);
  const text = textFromDoc($);

  const intent = detectIntent($, url);
  const entities = extractEntities(text);
  const eeat = detectEEAT($);
  const linkQuality = analyzeLinkQuality($, url);
  const serp = serpPreview($);

  const score = Math.round(
    Math.min(
      100,
      0.28 * entities.coverageScore +
        0.28 * eeat.score +
        0.22 * linkQuality.score +
        0.22 * (intent.intent === 'mixed' ? 70 : intent.mismatchRisk === 'low' ? 85 : 70)
    )
  );

  return {
    score,
    intent,
    entities,
    eeat,
    linkQuality,
    serp,
  };
}
