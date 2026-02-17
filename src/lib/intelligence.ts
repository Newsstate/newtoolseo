import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import type {
  IntelligenceReport,
  IntentReport,
  EntityReport,
  EEATReport,
  LinkQualityReport,
  SerpPreviewReport,
} from './types';

type Risk = 'low' | 'medium' | 'high';

function clamp(n: number) { return Math.max(0, Math.min(100, Math.round(n))); }
function normSpace(s: string) { return s.replace(/\s+/g, ' ').trim(); }

function approxPixelWidth(text: string) {
  let w = 0;
  for (const ch of text) {
    if (/[A-Z0-9]/.test(ch)) w += 9;
    else if (/[mwMW]/.test(ch)) w += 10;
    else if (/[ilI\|]/.test(ch)) w += 4;
    else if (/\s/.test(ch)) w += 3;
    else w += 7;
  }
  return w;
}

function riskByPixels(px: number, max: number): Risk {
  const ratio = max === 0 ? 1 : px / max;
  if (ratio <= 0.9) return 'low';
  if (ratio <= 1.05) return 'medium';
  return 'high';
}

function toRisk(v: any): Risk {
  if (v === 'low' || v === 'medium' || v === 'high') return v;
  return 'medium';
}

function getTitleAndDescription($: CheerioAPI) {
  const title = normSpace($('title').first().text() || '');
  const metaDescription = normSpace($('meta[name="description"]').attr('content') || '');
  return {
    title: title || '',
    metaDescription: metaDescription || '',
  };
}

function analyzeIntent($: CheerioAPI, url: string): IntentReport {
  const title = normSpace($('title').first().text() || '');
  const h1 = normSpace($('h1').first().text() || '');
  const path = (() => { try { return new URL(url).pathname.toLowerCase(); } catch { return ''; } })();

  const ctaText = $('a,button,input[type="submit"],input[type="button"]')
    .toArray()
    .map(el => normSpace($(el).text() || ($(el).attr('value') || '')))
    .filter(Boolean)
    .slice(0, 80)
    .join(' | ');

  const text = `${title} ${h1} ${ctaText} ${path}`.toLowerCase();

  const scores = {
    informational: 0,
    commercial: 0,
    transactional: 0,
    navigational: 0,
  };

  const info = ['what is', 'how to', 'guide', 'tutorial', 'explained', 'learn', 'definition', 'examples', 'benefits', 'meaning'];
  const commercial = ['best', 'top', 'review', 'vs', 'comparison', 'compare', 'alternatives', 'pricing plan', 'features', 'pros', 'cons'];
  const txn = ['buy', 'price', 'pricing', 'order', 'subscribe', 'book', 'deal', 'discount', 'offer', 'checkout', 'cart', 'get started', 'start trial'];
  const nav = ['login', 'sign in', 'dashboard', 'account', 'contact', 'about', 'support', 'help center'];

  for (const w of info) if (text.includes(w)) scores.informational += 1;
  for (const w of commercial) if (text.includes(w)) scores.commercial += 1;
  for (const w of txn) if (text.includes(w)) scores.transactional += 1;
  for (const w of nav) if (text.includes(w)) scores.navigational += 1;

  const total = scores.informational + scores.commercial + scores.transactional + scores.navigational;

  const entries = Object.entries(scores) as Array<[keyof typeof scores, number]>;
  entries.sort((a, b) => b[1] - a[1]);

  let intent: IntentReport['intent'] = 'mixed';
  if (total === 0) intent = 'mixed';
  else if (entries[0][1] === 0) intent = 'mixed';
  else {
    const top = entries[0];
    const second = entries[1];
    const dominance = top[1] / total;
    const closeSecond = second[1] > 0 && (top[1] - second[1]) <= 1 && dominance < 0.55;

    if (closeSecond) intent = 'mixed';
    else {
      if (top[0] === 'commercial') intent = 'commercial';
      if (top[0] === 'informational') intent = 'informational';
      if (top[0] === 'transactional') intent = 'transactional';
      if (top[0] === 'navigational') intent = 'navigational';
    }
  }

  let mismatchRisk: Risk = 'low';
  if (total === 0) mismatchRisk = 'high';
  else {
    const topVal = entries[0][1];
    const dominance = topVal / total;
    mismatchRisk = dominance >= 0.6 ? 'low' : dominance >= 0.45 ? 'medium' : 'high';
  }

  return { intent, scores, mismatchRisk };
}

function extractEntitiesFromText(text: string) {
  const cleaned = text
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const candidates = cleaned.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b/g) || [];
  const stop = new Set([
    'The','This','That','These','Those','And','Or','But','With','Without','For','From','About','Into','Over','Under',
    'A','An','In','On','At','To','As','By','Of','Is','Are','Was','Were','Be','Been','Being','It','Its','You','Your',
    'We','Our','Us','I','My','Me','He','She','They','Them','Their','There','Here','How','What','When','Where','Why',
  ]);

  const freq: Record<string, number> = {};
  for (const raw of candidates) {
    const t = normSpace(raw);
    if (t.length < 3) continue;
    const parts = t.split(' ');
    if (parts.every(p => stop.has(p))) continue;
    if (stop.has(t)) continue;
    freq[t] = (freq[t] || 0) + 1;
  }

  const entries = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([name, count]) => ({ name, count }));

  return { entries, unique: Object.keys(freq).length };
}

function analyzeEntities($: CheerioAPI): EntityReport {
  const bodyText = normSpace($('body').text()).slice(0, 220000);
  const { entries, unique } = extractEntitiesFromText(bodyText);

  const hints: string[] = [];
  if (unique < 8) hints.push('Add more named entities (brands, places, products, people) to improve topical clarity.');
  if (entries.length > 0 && entries[0].count >= 12) hints.push('Top entity appears very frequently; ensure entity usage feels natural and not repetitive.');
  if (entries.length === 0) hints.push('No clear entities detected. Add concrete nouns and proper names where relevant.');

  const coverageScore = clamp(
    unique >= 25 ? 95 :
    unique >= 15 ? 85 :
    unique >= 10 ? 75 :
    unique >= 6 ? 60 :
    unique >= 3 ? 45 : 30
  );

  return {
    topEntities: entries,
    uniqueCount: unique,
    coverageScore,
    hints,
  };
}

function analyzeEEAT($: CheerioAPI): EEATReport {
  const hasAuthorMeta = !!$('meta[name="author"]').attr('content');
  const hasAbout = $('a[href*="about"]').length > 0;
  const hasContact = $('a[href*="contact"]').length > 0;
  const hasPolicy = $('a[href*="privacy"], a[href*="terms"]').length > 0;

  let hasArticleSchema = false;
  let hasOrgSchema = false;

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text();
    try {
      const obj = JSON.parse(raw);
      const arr = Array.isArray(obj) ? obj : [obj];
      for (const item of arr) {
        const t = item?.['@type'];
        const types = Array.isArray(t) ? t.map(String) : t ? [String(t)] : [];
        if (types.some(x => /Article|NewsArticle|BlogPosting/i.test(x))) hasArticleSchema = true;
        if (types.some(x => /Organization|LocalBusiness/i.test(x))) hasOrgSchema = true;
      }
    } catch {}
  });

  const hasReviews = $('*[itemtype*="Review"], *[class*="review"], *[id*="review"]').length > 0;

  const citationsCount = $('a[href^="http"]').toArray().filter(el => {
    const href = ($(el).attr('href') || '').toLowerCase();
    return (
      href.includes('.gov') ||
      href.includes('.edu') ||
      href.includes('nih.gov') ||
      href.includes('who.int') ||
      href.includes('wikipedia.org') ||
      href.includes('journal')
    );
  }).length;

  const gaps: string[] = [];
  if (!hasAuthorMeta) gaps.push('Add author meta / author block for credibility.');
  if (!hasArticleSchema) gaps.push('Add Article/BlogPosting schema (especially for content pages).');
  if (!hasOrgSchema) gaps.push('Add Organization schema for publisher identity.');
  if (!hasAbout) gaps.push('Add About page link in header/footer.');
  if (!hasContact) gaps.push('Add Contact page link in header/footer.');
  if (!hasPolicy) gaps.push('Add Privacy Policy / Terms links in footer.');
  if (citationsCount === 0) gaps.push('Add a few authoritative citations (gov/edu/recognized sources) where facts are stated.');

  let score = 100;
  if (!hasAuthorMeta) score -= 12;
  if (!hasArticleSchema) score -= 14;
  if (!hasOrgSchema) score -= 14;
  if (!hasAbout) score -= 8;
  if (!hasContact) score -= 8;
  if (!hasPolicy) score -= 8;
  if (citationsCount === 0) score -= 10;
  if (hasReviews) score += 4;
  score = clamp(score);

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
      citationsCount,
    },
    gaps,
  };
}

function analyzeLinkQuality($: CheerioAPI, url: string): LinkQualityReport {
  let origin = '';
  try { origin = new URL(url).origin; } catch {}

  const all = $('a[href]').toArray().map(el => {
    const href = ($(el).attr('href') || '').trim();
    const text = normSpace($(el).text());
    const inBody = $(el).parents('main,article,.content,.post,.entry').length > 0;
    return { href, text, inBody };
  }).filter(x => x.href);

  const internal = all.filter(l => {
    if (l.href.startsWith('#')) return false;
    if (l.href.startsWith('/')) return true;
    if (!origin) return false;
    return l.href.startsWith(origin);
  });

  const total = internal.length;

  const genericAnchors = new Set(['click here', 'learn more', 'read more', 'more', 'here', 'this', 'link']);
  const genericCount = internal.filter(l => genericAnchors.has(l.text.toLowerCase())).length;

  const contextual = internal.filter(l => l.inBody && l.text.length >= 4 && !genericAnchors.has(l.text.toLowerCase())).length;
  const navFooter = Math.max(0, total - contextual);

  const freq: Record<string, number> = {};
  for (const l of internal) {
    const t = l.text.toLowerCase();
    if (!t) continue;
    freq[t] = (freq[t] || 0) + 1;
  }

  const anchorDiversity = total === 0 ? 0 : Object.keys(freq).length / total;
  const genericAnchorRatio = total === 0 ? 0 : genericCount / total;

  const topAnchors = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([text, count]) => ({ text, count }));

  const hints: string[] = [];
  if (total < 5) hints.push('Add more internal links to strengthen crawl flow and topical clusters.');
  if (total >= 8 && contextual / total < 0.35) hints.push('Most internal links look like nav/footer. Add more in-content contextual links.');
  if (genericAnchorRatio > 0.18) hints.push('Reduce generic anchors like “click here”. Use descriptive anchor text.');
  if (total >= 10 && anchorDiversity < 0.35) hints.push('Anchor text repetition is high. Improve anchor variety.');

  let score = 100;
  if (total < 5) score -= 28;
  if (total >= 8 && contextual / Math.max(1, total) < 0.35) score -= 20;
  if (genericAnchorRatio > 0.18) score -= 18;
  if (total >= 10 && anchorDiversity < 0.35) score -= 12;
  score = clamp(score);

  return {
    score,
    totals: { total, contextual, navFooter },
    anchorDiversity: parseFloat(anchorDiversity.toFixed(2)),
    genericAnchorRatio: parseFloat((genericAnchorRatio * 100).toFixed(1)),
    topAnchors,
    hints,
  };
}

function analyzeSerp($: CheerioAPI, url: string, titleIn?: string | null, descIn?: string | null): SerpPreviewReport {
  const derived = getTitleAndDescription($);

  const title = normSpace(titleIn ?? derived.title ?? '');
  const metaDescription = normSpace(descIn ?? derived.metaDescription ?? '');

  const titleMaxPixels = 600;
  const descriptionMaxPixels = 920;

  const titlePixels = approxPixelWidth(title);
  const descriptionPixels = approxPixelWidth(metaDescription);

  const titleTruncationRisk = toRisk(riskByPixels(titlePixels, titleMaxPixels));
  const descriptionTruncationRisk = toRisk(riskByPixels(descriptionPixels, descriptionMaxPixels));

  return {
    title,
    metaDescription,
    titlePixels,
    titleMaxPixels,
    titleTruncationRisk,
    descriptionPixels,
    descriptionMaxPixels,
    descriptionTruncationRisk,
  };
}

/**
 * Works with:
 * - analyzeIntelligence(html, url)
 * - analyzeIntelligence(html, url, title, description)
 * - analyzeIntelligence(html, url, title, description, $)
 */
export function analyzeIntelligence(
  html: string,
  url: string,
  title?: string | null,
  description?: string | null,
  $maybe?: CheerioAPI
): IntelligenceReport {
  const $ = $maybe ?? cheerio.load(html);

  const intent = analyzeIntent($, url);
  const entities = analyzeEntities($);
  const eeat = analyzeEEAT($);
  const linkQuality = analyzeLinkQuality($, url);
  const serp = analyzeSerp($, url, title ?? null, description ?? null);

  const score = clamp(
    entities.coverageScore * 0.22 +
    eeat.score * 0.28 +
    linkQuality.score * 0.22 +
    (intent.mismatchRisk === 'low' ? 90 : intent.mismatchRisk === 'medium' ? 70 : 45) * 0.16 +
    (serp.titleTruncationRisk === 'low' ? 90 : serp.titleTruncationRisk === 'medium' ? 70 : 45) * 0.06 +
    (serp.descriptionTruncationRisk === 'low' ? 90 : serp.descriptionTruncationRisk === 'medium' ? 70 : 45) * 0.06
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
