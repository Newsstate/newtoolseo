import type { CheerioAPI } from 'cheerio';
import type {
  IntelligenceSEO,
  EntitySEO,
  IntentSEO,
  EEATSEO,
  InternalLinkQualitySEO,
  SERPPreviewSEO,
} from './types';

export type TruncationRisk = 'low' | 'medium' | 'high';

function clamp(n: number) { return Math.max(0, Math.min(100, Math.round(n))); }

function normSpace(s: string) { return s.replace(/\s+/g, ' ').trim(); }

function approxPixelWidth(text: string) {
  let w = 0;
  for (const ch of text) {
    if (/[A-Z0-9]/.test(ch)) w += 9;
    else if (/[mwMW]/.test(ch)) w += 10;
    else if (/[ilI\|]/.test(ch)) w += 4;
    else if (/[\s]/.test(ch)) w += 3;
    else w += 7;
  }
  return w;
}

function truncationRiskByPixels(px: number): TruncationRisk {
  if (px <= 520) return 'low';
  if (px <= 600) return 'medium';
  return 'high';
}

function truncationRiskByChars(n: number, goodMin: number, goodMax: number): TruncationRisk {
  if (n >= goodMin && n <= goodMax) return 'low';
  if (n < goodMin) return 'medium';
  return 'high';
}

function extractEntitiesFromText(text: string) {
  const cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
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
    .slice(0, 30)
    .map(([text, count]) => ({
      text,
      count,
      prominence: Math.min(100, Math.round((count / Math.max(1, entriesMax(freq))) * 100)),
    }));

  const unique = Object.keys(freq).length;
  const totalMentions = Object.values(freq).reduce((a, b) => a + b, 0);

  return { entries, unique, totalMentions };
}

function entriesMax(freq: Record<string, number>) {
  let m = 0;
  for (const v of Object.values(freq)) if (v > m) m = v;
  return m;
}

function detectEntityType(text: string, brandHints: string[]) {
  const t = text.toLowerCase();
  const hints = brandHints.map(b => b.toLowerCase()).filter(Boolean);
  if (hints.some(h => h && t.includes(h))) return 'brand' as const;

  if (/(inc|ltd|llc|gmbh|s\.a\.|sa|pvt|private|limited|corp|company)$/i.test(text)) return 'organization' as const;
  if (/\b(india|usa|uk|u\.s\.|united states|europe|asia|africa|australia|canada)\b/i.test(text)) return 'place' as const;
  if (/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(text)) return 'time' as const;
  if (/\b(\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})\b/.test(text)) return 'time' as const;
  if (/\b(guide|how|best|top|vs|comparison|review|price|pricing)\b/i.test(text)) return 'concept' as const;
  return 'other' as const;
}

function analyzeIntent($: CheerioAPI, url: string): IntentSEO {
  const issues: string[] = [];

  const title = normSpace($('title').first().text() || '');
  const h1 = normSpace($('h1').first().text() || '');
  const cta = $('a,button').toArray().map(el => normSpace($(el).text())).filter(Boolean).slice(0, 60).join(' | ');
  const path = (() => { try { return new URL(url).pathname.toLowerCase(); } catch { return ''; } })();

  const intentSignals = {
    informational: 0,
    transactional: 0,
    navigational: 0,
  };

  const text = `${title} ${h1} ${cta} ${path}`.toLowerCase();

  const infoWords = ['what is', 'how to', 'guide', 'tutorial', 'explained', 'learn', 'definition', 'examples', 'benefits'];
  const txnWords = ['buy', 'price', 'pricing', 'order', 'subscribe', 'book', 'deal', 'discount', 'offer', 'checkout', 'cart'];
  const navWords = ['login', 'sign in', 'dashboard', 'account', 'contact', 'about', 'support'];

  for (const w of infoWords) if (text.includes(w)) intentSignals.informational += 1;
  for (const w of txnWords) if (text.includes(w)) intentSignals.transactional += 1;
  for (const w of navWords) if (text.includes(w)) intentSignals.navigational += 1;

  const total = intentSignals.informational + intentSignals.transactional + intentSignals.navigational;
  let primary = 'informational' as const;
  if (intentSignals.transactional >= Math.max(intentSignals.informational, intentSignals.navigational)) primary = 'transactional';
  if (intentSignals.navigational > Math.max(intentSignals.informational, intentSignals.transactional)) primary = 'navigational';

  const mismatchRisk: 'low' | 'medium' | 'high' =
    total === 0 ? 'high'
      : (Math.max(intentSignals.informational, intentSignals.transactional, intentSignals.navigational) / total) >= 0.6 ? 'low'
        : (Math.max(intentSignals.informational, intentSignals.transactional, intentSignals.navigational) / total) >= 0.45 ? 'medium'
          : 'high';

  if (total === 0) issues.push('No clear intent signals detected. Clarify purpose via headings and CTAs.');
  if (mismatchRisk === 'high') issues.push('Mixed intent signals. Consider separating informational content from conversion CTAs or using clearer page structure.');

  let score = 100;
  if (total === 0) score -= 35;
  if (mismatchRisk === 'medium') score -= 12;
  if (mismatchRisk === 'high') score -= 24;
  score = clamp(score);

  return {
    score,
    primaryIntent: primary,
    intentSignals,
    mismatchRisk,
    issues,
  };
}

function analyzeEEAT($: CheerioAPI): EEATSEO {
  const issues: string[] = [];

  const hasAuthor = !!$('meta[name="author"]').attr('content') || $('*[class*="author"], *[rel="author"]').length > 0;
  const hasAbout = $('a[href*="about"]').length > 0;
  const hasContact = $('a[href*="contact"]').length > 0;
  const hasPolicy = $('a[href*="privacy"], a[href*="terms"]').length > 0;

  const schemaTypes: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text();
    try {
      const obj = JSON.parse(raw);
      const t = Array.isArray(obj) ? obj : [obj];
      for (const item of t) {
        const tp = item?.['@type'];
        if (!tp) continue;
        if (Array.isArray(tp)) schemaTypes.push(...tp.map(String));
        else schemaTypes.push(String(tp));
      }
    } catch {}
  });

  const hasArticleSchema = schemaTypes.some(t => /Article|NewsArticle|BlogPosting/i.test(t));
  const hasOrgSchema = schemaTypes.some(t => /Organization|LocalBusiness/i.test(t));
  const hasPersonSchema = schemaTypes.some(t => /Person/i.test(t));

  const citations = $('a[href^="http"]').toArray().filter(el => {
    const href = ($(el).attr('href') || '').toLowerCase();
    return href.includes('wikipedia.org') || href.includes('nih.gov') || href.includes('who.int') || href.includes('gov') || href.includes('edu') || href.includes('research') || href.includes('journal');
  }).length;

  if (!hasAuthor) issues.push('No author signal detected. Add author name/bio and Person schema where relevant.');
  if (!hasAbout) issues.push('No About link detected. Add About/Company page for trust.');
  if (!hasContact) issues.push('No Contact link detected. Add Contact page (email/address) for credibility.');
  if (!hasPolicy) issues.push('No Privacy/Terms links detected. Add policy links in footer.');
  if (!hasOrgSchema) issues.push('No Organization schema detected. Add Organization schema for publisher identity.');
  if (citations === 0) issues.push('No authoritative citations detected. Link to credible sources for factual claims.');

  let score = 100;
  if (!hasAuthor) score -= 16;
  if (!hasAbout) score -= 10;
  if (!hasContact) score -= 10;
  if (!hasPolicy) score -= 10;
  if (!hasOrgSchema) score -= 12;
  if (citations === 0) score -= 10;
  if (hasArticleSchema) score += 4;
  if (hasPersonSchema) score += 4;
  score = clamp(score);

  return {
    score,
    hasAuthor,
    hasAbout,
    hasContact,
    hasPolicy,
    schemaTypes: Array.from(new Set(schemaTypes)).slice(0, 25),
    citations,
    issues,
  };
}

function analyzeInternalLinkQuality($: CheerioAPI, url: string): InternalLinkQualitySEO {
  const issues: string[] = [];
  let origin = '';
  try { origin = new URL(url).origin; } catch {}

  const links = $('a[href]').toArray().map(el => {
    const href = ($(el).attr('href') || '').trim();
    const text = normSpace($(el).text());
    return { href, text };
  }).filter(l => l.href);

  const internal = links.filter(l => {
    if (l.href.startsWith('#')) return false;
    if (l.href.startsWith('/')) return true;
    if (!origin) return false;
    return l.href.startsWith(origin);
  });

  const internalTotal = internal.length;
  const generic = new Set(['click here', 'learn more', 'read more', 'more', 'here', 'this', 'link']);
  const genericCount = internal.filter(l => generic.has(l.text.toLowerCase())).length;

  const contextual = internal.filter(l => l.text.length >= 4 && !generic.has(l.text.toLowerCase())).length;

  const anchorFreq: Record<string, number> = {};
  for (const l of internal) {
    const t = l.text.toLowerCase();
    if (!t) continue;
    anchorFreq[t] = (anchorFreq[t] || 0) + 1;
  }
  const uniqueAnchors = Object.keys(anchorFreq).length;

  const topAnchors = Object.entries(anchorFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([anchor, count]) => ({ anchor, count }));

  const genericRatio = internalTotal > 0 ? genericCount / internalTotal : 0;

  if (internalTotal < 5) issues.push('Very few internal links. Add contextual links to related pages to improve crawl flow.');
  if (contextual / Math.max(1, internalTotal) < 0.35 && internalTotal >= 8) issues.push('Most internal links are non-contextual (nav/footer). Add more in-body contextual links.');
  if (genericRatio > 0.18) issues.push('High generic anchor usage ("click here", "learn more"). Use descriptive anchors.');
  if (uniqueAnchors / Math.max(1, internalTotal) < 0.35 && internalTotal >= 10) issues.push('Anchor text repetition is high. Increase anchor diversity.');

  let score = 100;
  if (internalTotal < 5) score -= 30;
  if (contextual / Math.max(1, internalTotal) < 0.35) score -= 20;
  if (genericRatio > 0.18) score -= 18;
  if (uniqueAnchors / Math.max(1, internalTotal) < 0.35) score -= 12;
  score = clamp(score);

  return {
    score,
    internalLinksTotal: internalTotal,
    contextualInternalLinks: contextual,
    uniqueAnchors,
    genericAnchorRatio: parseFloat((genericRatio * 100).toFixed(1)),
    topAnchors,
    issues,
  };
}

function analyzeSerpPreview(title: string | null, description: string | null, url: string): SERPPreviewSEO {
  const issues: string[] = [];
  const t = title ? normSpace(title) : null;
  const d = description ? normSpace(description) : null;
  const tLen = t?.length || 0;
  const dLen = d?.length || 0;
  const px = t ? approxPixelWidth(t) : 0;

  const tRisk: TruncationRisk = t ? truncationRiskByPixels(px) : 'high';
  const dRisk: TruncationRisk = d ? truncationRiskByChars(dLen, 120, 165) : 'high';

  if (!t) issues.push('No title for SERP preview.');
  if (!d) issues.push('No meta description for SERP preview.');
  if (t && tRisk !== 'low') issues.push(`Title truncation risk: ${tRisk}.`);
  if (d && dRisk !== 'low') issues.push(`Description truncation risk: ${dRisk}.`);

  let score = 100;
  if (!t) score -= 45;
  if (!d) score -= 35;
  if (tRisk === 'medium') score -= 8;
  if (tRisk === 'high') score -= 16;
  if (dRisk === 'medium') score -= 6;
  if (dRisk === 'high') score -= 12;
  score = clamp(score);

  let urlPath = '';
  try { urlPath = new URL(url).pathname; } catch {}

  return {
    score,
    title: { text: t, length: tLen, pixelWidthApprox: px, truncationRisk: tRisk },
    description: { text: d, length: dLen, truncationRisk: dRisk },
    urlPath,
    issues,
  };
}

export function analyzeIntelligence($: CheerioAPI, html: string, url: string, title: string | null, description: string | null): IntelligenceSEO {
  const issues: string[] = [];
  const recommendations: string[] = [];

  const brandHints: string[] = [];
  const orgName = $('meta[property="og:site_name"]').attr('content')?.trim();
  if (orgName) brandHints.push(orgName);
  const h1 = $('h1').first().text().trim();
  if (h1) brandHints.push(h1.split(' ').slice(0, 2).join(' '));

  const textForEntities = normSpace($('body').text()).slice(0, 200000);
  const rawEntities = extractEntitiesFromText(textForEntities);
  const typedEntities = rawEntities.entries.map(e => ({ ...e, type: detectEntityType(e.text, brandHints) }));

  const entIssues: string[] = [];
  let entScore = 100;
  if (typedEntities.length < 5) { entIssues.push('Low entity variety detected. Consider adding more concrete entities (brands, places, people, concepts) for topical clarity.'); entScore -= 22; }
  if (typedEntities.filter(e => e.type === 'brand').length === 0 && brandHints.length === 0) { entIssues.push('No clear brand/entity anchor detected. Consider adding brand mentions or organization details.'); entScore -= 14; }
  entScore = clamp(entScore);

  const entities: EntitySEO = {
    score: entScore,
    topEntities: typedEntities,
    topicCoverageHint: typedEntities.length ? 'Use missing entities as content sections (FAQs, comparisons, definitions, examples).' : 'Add more topic-specific entities to increase semantic coverage.',
    issues: entIssues,
  };

  const intent = analyzeIntent($, url);
  const eeat = analyzeEEAT($);
  const internalLinkQuality = analyzeInternalLinkQuality($, url);
  const serpPreview = analyzeSerpPreview(title, description, url);

  if (intent.mismatchRisk !== 'low') recommendations.push('Clarify page intent (informational vs transactional) by aligning headings, CTA and schema.');
  if (eeat.score < 70) recommendations.push('Strengthen EEAT: add author bio, publisher schema, about/contact/policy links, and credible citations.');
  if (internalLinkQuality.score < 75) recommendations.push('Improve internal linking: add more in-body contextual links with descriptive anchors.');
  if (serpPreview.title.truncationRisk !== 'low' || serpPreview.description.truncationRisk !== 'low') recommendations.push('Optimize SERP snippet length to reduce truncation risk and improve CTR.');
  if (entities.score < 80) recommendations.push('Expand semantic coverage by adding missing entities and related subtopics under H2/H3 sections.');

  issues.push(...entities.issues);
  issues.push(...intent.issues);
  issues.push(...eeat.issues);
  issues.push(...internalLinkQuality.issues);
  issues.push(...serpPreview.issues);

  const score = clamp((entities.score * 0.22 + intent.score * 0.18 + eeat.score * 0.26 + internalLinkQuality.score * 0.18 + serpPreview.score * 0.16));

  return {
    score,
    entities,
    intent,
    eeat,
    internalLinkQuality,
    serpPreview,
    issues: Array.from(new Set(issues)).slice(0, 30),
    recommendations: Array.from(new Set(recommendations)).slice(0, 12),
  };
}
