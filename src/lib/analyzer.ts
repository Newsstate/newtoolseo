import * as cheerio from 'cheerio';
import type {
  SEOReport, OnPageSEO, TechnicalSEO, CrawlSEO,
  SecuritySEO, SocialSEO, ContentSEO, BacklinksSEO, RenderingSEO
} from './types';
import { analyzeAMP } from './ampAnalyzer';

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; DeepSEOBot/2.0; +https://deepseo.vercel.app)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

function grade(score: number) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

function clamp(n: number) { return Math.max(0, Math.min(100, Math.round(n))); }

export async function runFullAnalysis(rawUrl: string): Promise<SEOReport> {
  let url = rawUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
  const parsedUrl = new URL(url);

  // Fetch main HTML
  const res = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

  const html = await res.text();
  const responseHeaders: Record<string, string> = {};
  res.headers.forEach((val, key) => { responseHeaders[key] = val; });

  const $ = cheerio.load(html);
  const baseHostname = parsedUrl.hostname;

  // ────────────────── ON-PAGE ──────────────────
  const titleEl = $('title').first().text().trim();
  const titleLen = titleEl.length;
  const titleIssues: string[] = [];
  let titleScore = 100;
  if (!titleEl) { titleIssues.push('Missing <title> tag — critical SEO issue'); titleScore = 0; }
  else if (titleLen < 30) { titleIssues.push(`Title too short (${titleLen} chars). Aim for 50–60.`); titleScore -= 35; }
  else if (titleLen > 60) { titleIssues.push(`Title too long (${titleLen} chars). Google truncates past 60.`); titleScore -= 25; }

  const metaDescEl = $('meta[name="description"]').attr('content')?.trim() ?? null;
  const metaLen = metaDescEl?.length ?? 0;
  const metaIssues: string[] = [];
  let metaScore = 100;
  if (!metaDescEl) { metaIssues.push('Missing meta description — major ranking signal'); metaScore = 0; }
  else if (metaLen < 120) { metaIssues.push(`Meta too short (${metaLen} chars). Aim 150–160.`); metaScore -= 30; }
  else if (metaLen > 160) { metaIssues.push(`Meta too long (${metaLen} chars). Google truncates at 160.`); metaScore -= 15; }

  const h1s = $('h1').map((_, el) => $(el).text().trim()).get().filter(Boolean);
  const h2s = $('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean);
  const h3s = $('h3').map((_, el) => $(el).text().trim()).get().filter(Boolean);
  const h4s = $('h4').map((_, el) => $(el).text().trim()).get().filter(Boolean);
  const headingIssues: string[] = [];
  let headingScore = 100;
  if (!h1s.length) { headingIssues.push('No H1 tag — every page needs exactly one H1'); headingScore -= 40; }
  if (h1s.length > 1) { headingIssues.push(`Multiple H1s (${h1s.length}). Use only one for clear hierarchy.`); headingScore -= 20; }
  if (!h2s.length) { headingIssues.push('No H2 tags — add subheadings for structure & crawlability'); headingScore -= 15; }
  if (h2s.length < 2 && h2s.length > 0) headingIssues.push('Only 1 H2 — consider adding more subheadings');

  const imgs = $('img');
  const totalImgs = imgs.length;
  let withAlt = 0, withoutAlt = 0, largeImgs = 0;
  imgs.each((_, el) => {
    const alt = $(el).attr('alt');
    const src = $(el).attr('src') || '';
    if (alt !== undefined && alt.trim() !== '') withAlt++;
    else withoutAlt++;
    const w = parseInt($(el).attr('width') || '0');
    const h2i = parseInt($(el).attr('height') || '0');
    if (w > 1500 || h2i > 1500) largeImgs++;
  });
  const imgIssues: string[] = [];
  let imgScore = 100;
  if (withoutAlt > 0) { imgIssues.push(`${withoutAlt} image(s) missing alt text — hurts accessibility & SEO`); imgScore -= Math.min(60, withoutAlt * 8); }
  if (largeImgs > 0) { imgIssues.push(`${largeImgs} potentially oversized image(s) — resize & compress`); imgScore -= 10; }
  if (totalImgs === 0) imgIssues.push('No images found — visual content improves engagement');

  const bodyText = $('body').text().toLowerCase();
  const stopWords = new Set(['this','that','with','have','from','they','been','were','their','there','what','when','will','would','could','should','which','about','these','those','then','than','into','your','more','also','some','such','only','other','after','before','between','very','just','make','know','time','over','even','most','well','back','come','does','here','each','much','many','them','than','been','some','itself']);
  const words = (bodyText.match(/\b[a-z]{4,}\b/g) || []).filter(w => !stopWords.has(w));
  const freq: Record<string, number> = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  const totalWords = words.length;
  const topKeywords = Object.entries(freq).sort(([,a],[,b]) => b - a).slice(0, 20)
    .map(([word, count]) => ({ word, count, density: parseFloat(((count / totalWords) * 100).toFixed(2)) }));

  let internalLinks = 0, externalLinks = 0, nofollowLinks = 0;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const rel = $(el).attr('rel') || '';
    if (rel.includes('nofollow')) nofollowLinks++;
    try {
      const lu = new URL(href, url);
      if (lu.hostname === baseHostname) internalLinks++;
      else externalLinks++;
    } catch { /* skip */ }
  });

  const onPageScore = clamp((titleScore + metaScore + headingScore + imgScore) / 4);
  const onPage: OnPageSEO = {
    score: onPageScore,
    title: { content: titleEl || null, length: titleLen, issues: titleIssues, score: clamp(titleScore) },
    metaDescription: { content: metaDescEl, length: metaLen, issues: metaIssues, score: clamp(metaScore) },
    headings: { h1: h1s, h2: h2s, h3: h3s, h4: h4s, issues: headingIssues, score: clamp(headingScore) },
    images: { total: totalImgs, withAlt, withoutAlt, largeImages: largeImgs, issues: imgIssues, score: clamp(imgScore) },
    keywords: { topKeywords, density: {}, score: totalWords > 300 ? 100 : clamp((totalWords / 300) * 100) },
    links: { internal: internalLinks, external: externalLinks, nofollow: nofollowLinks, issues: [] },
  };

  // ────────────────── TECHNICAL ──────────────────
  const canonical = $('link[rel="canonical"]').attr('href') ?? null;
  const robots = $('meta[name="robots"]').attr('content') ?? null;
  const viewport = $('meta[name="viewport"]').attr('content') ?? null;
  const charset = $('meta[charset]').attr('charset') ?? $('meta[http-equiv="Content-Type"]').attr('content')?.match(/charset=([^\s;]+)/)?.[1] ?? null;
  const lang = $('html').attr('lang') ?? null;

  const sdScripts = $('script[type="application/ld+json"]');
  const sdTypes: string[] = [];
  sdScripts.each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || '{}');
      const t = json['@type'];
      if (t) sdTypes.push(Array.isArray(t) ? t.join(', ') : t);
    } catch { /* ignore */ }
  });

  const hreflang: string[] = [];
  $('link[rel="alternate"][hreflang]').each((_, el) => { hreflang.push($(el).attr('hreflang') || ''); });

  const sitemapLinked = $('link[rel="sitemap"]').length > 0;

  // Check robots.txt
  let robotsTxtContent: string | null = null;
  let robotsTxtOk = false;
  try {
    const rRes = await fetch(`${parsedUrl.protocol}//${parsedUrl.hostname}/robots.txt`, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(5000) });
    if (rRes.ok) { robotsTxtOk = true; robotsTxtContent = (await rRes.text()).slice(0, 2000); }
  } catch { /* skip */ }

  const httpToHttps = url.startsWith('https://');
  const techIssues: string[] = [];
  let techScore = 100;
  if (!canonical) { techIssues.push('No canonical URL — risk of duplicate content penalties'); techScore -= 15; }
  if (!viewport) { techIssues.push('Missing viewport meta — critical for mobile-first indexing'); techScore -= 20; }
  if (!lang) { techIssues.push('No lang attribute on <html> — affects multilingual SEO'); techScore -= 10; }
  if (!sdScripts.length) { techIssues.push('No structured data (JSON-LD) — missing rich snippet opportunities'); techScore -= 10; }
  if (!robotsTxtOk) { techIssues.push('robots.txt not found or inaccessible'); techScore -= 10; }
  if (!sitemapLinked) techIssues.push('Sitemap not linked in HTML (use <link rel="sitemap">)');
  if (!httpToHttps) { techIssues.push('Page served over HTTP — switch to HTTPS immediately'); techScore -= 25; }

  const technical: TechnicalSEO = {
    score: clamp(techScore),
    canonical, robots, viewport, charset, lang,
    structuredData: { found: sdScripts.length > 0, types: sdTypes },
    hreflang, sitemapLinked,
    robotsTxt: { accessible: robotsTxtOk, content: robotsTxtContent },
    httpToHttps, www: parsedUrl.hostname.startsWith('www.'),
    issues: techIssues,
  };

  // ────────────────── CRAWL ──────────────────
  const robotsMeta = $('meta[name="robots"]').attr('content') || '';
  const indexable = !robotsMeta.includes('noindex');
  const robotsBlocked = robotsMeta.includes('noindex');
  const nofollowPage = robotsMeta.includes('nofollow');
  const canonicalCorrect = !canonical || canonical === url || canonical === url.replace(/\/$/, '');
  const paginationTags = $('link[rel="next"], link[rel="prev"]').length > 0;
  const ampVersion = !!($('link[rel="amphtml"]').attr('href') || $('html[amp]').length);

  const crawlLinks: { href: string; text: string; rel: string }[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim().slice(0, 60);
    const rel = $(el).attr('rel') || '';
    try {
      const lu = new URL(href, url);
      if (lu.hostname === baseHostname) crawlLinks.push({ href: lu.href, text, rel });
    } catch { /* skip */ }
  });

  const crawlIssues: string[] = [];
  let crawlScore = 100;
  if (!indexable) { crawlIssues.push('Page has noindex — Google will NOT index this page'); crawlScore -= 50; }
  if (nofollowPage) { crawlIssues.push('nofollow on page — PageRank not passing through links'); crawlScore -= 20; }
  if (!canonicalCorrect) { crawlIssues.push('Canonical URL mismatch — may cause duplicate content'); crawlScore -= 20; }
  if (!paginationTags && internalLinks > 50) crawlIssues.push('No rel=next/prev for pagination — consider adding');
  if (internalLinks < 3) { crawlIssues.push('Very few internal links — add more for better crawlability'); crawlScore -= 15; }

  const crawl: CrawlSEO = {
    score: clamp(crawlScore),
    indexable, robotsBlocked, nofollowPage, canonicalCorrect,
    internalLinks: crawlLinks.slice(0, 30),
    brokenLinks: [],
    redirectChains: [],
    paginationTags, ampVersion,
    issues: crawlIssues,
  };

  // ────────────────── SECURITY ──────────────────
  const https = url.startsWith('https://');
  const hsts = !!(responseHeaders['strict-transport-security']);
  const csp = !!(responseHeaders['content-security-policy']);
  const xFrameOptions = !!(responseHeaders['x-frame-options']);
  const mixedContent = https && html.includes('http://') && (html.match(/src="http:\/\//g) || []).length > 0;

  const safeHeaders: Record<string, string | null> = {
    'Strict-Transport-Security': responseHeaders['strict-transport-security'] || null,
    'Content-Security-Policy': responseHeaders['content-security-policy'] || null,
    'X-Frame-Options': responseHeaders['x-frame-options'] || null,
    'X-Content-Type-Options': responseHeaders['x-content-type-options'] || null,
    'Referrer-Policy': responseHeaders['referrer-policy'] || null,
    'Permissions-Policy': responseHeaders['permissions-policy'] || null,
  };

  const secIssues: string[] = [];
  let secScore = 100;
  if (!https) { secIssues.push('Not using HTTPS — massive SEO and trust penalty'); secScore -= 40; }
  if (!hsts) { secIssues.push('Missing HSTS header — browsers may allow HTTP downgrade'); secScore -= 15; }
  if (!csp) { secIssues.push('No Content-Security-Policy — XSS vulnerability risk'); secScore -= 15; }
  if (!xFrameOptions) { secIssues.push('No X-Frame-Options header — clickjacking risk'); secScore -= 10; }
  if (mixedContent) { secIssues.push('Mixed content detected — HTTP resources on HTTPS page'); secScore -= 20; }

  const security: SecuritySEO = {
    score: clamp(secScore), https, hsts, mixedContent, csp, xFrameOptions, safeHeaders, issues: secIssues
  };

  // ────────────────── SOCIAL ──────────────────
  const ogTags: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => { ogTags[$(el).attr('property')!.replace('og:', '')] = $(el).attr('content') || ''; });
  const twTags: Record<string, string> = {};
  $('meta[name^="twitter:"]').each((_, el) => { twTags[$(el).attr('name')!.replace('twitter:', '')] = $(el).attr('content') || ''; });

  const socIssues: string[] = [];
  let socScore = 100;
  if (!ogTags['title']) { socIssues.push('Missing og:title — social shares will look broken'); socScore -= 25; }
  if (!ogTags['description']) { socIssues.push('Missing og:description — poor social preview'); socScore -= 20; }
  if (!ogTags['image']) { socIssues.push('Missing og:image — no image in social shares'); socScore -= 25; }
  if (!twTags['card']) { socIssues.push('No Twitter Card meta — tweets will show plain link'); socScore -= 15; }

  const social: SocialSEO = {
    score: clamp(socScore),
    ogTitle: ogTags['title'] || null, ogDescription: ogTags['description'] || null,
    ogImage: ogTags['image'] || null, ogType: ogTags['type'] || null,
    twitterCard: twTags['card'] || null, twitterTitle: twTags['title'] || null,
    twitterDescription: twTags['description'] || null, twitterImage: twTags['image'] || null,
    issues: socIssues,
  };

  // ────────────────── CONTENT ──────────────────
  const allText = $('body').text();
  const wordArr = allText.split(/\s+/).filter(Boolean);
  const totalWordCount = wordArr.length;
  const paragraphs = $('p').length;
  const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const avgSentLen = sentences.length > 0 ? totalWordCount / sentences.length : 0;
  const fleschScore = Math.max(0, Math.min(100, 206.835 - 1.015 * avgSentLen - 84.6 * 1.5));
  let readGrade = 'Difficult';
  if (fleschScore >= 70) readGrade = 'Easy';
  else if (fleschScore >= 60) readGrade = 'Standard';
  else if (fleschScore >= 50) readGrade = 'Fairly Difficult';

  const htmlLen = html.length;
  const codeRatio = htmlLen > 0 ? clamp((totalWordCount * 6 / htmlLen) * 100) : 0;

  const contIssues: string[] = [];
  let contScore = 100;
  if (totalWordCount < 300) { contIssues.push(`Low word count (${totalWordCount}). Aim for 600+ for better rankings`); contScore -= 40; }
  else if (totalWordCount < 600) { contIssues.push(`Moderate word count (${totalWordCount}). 600+ is better for competitive topics`); contScore -= 15; }
  if (paragraphs < 3) { contIssues.push('Very few paragraphs — structure content better'); contScore -= 15; }
  if (codeRatio < 10) { contIssues.push('Low text-to-code ratio — too much code relative to content'); contScore -= 10; }

  const content: ContentSEO = {
    score: clamp(contScore), wordCount: totalWordCount, paragraphCount: paragraphs,
    readabilityScore: clamp(fleschScore), readabilityGrade: readGrade,
    avgSentenceLength: parseFloat(avgSentLen.toFixed(1)),
    contentToCodeRatio: codeRatio, duplicateContent: false,
    issues: contIssues,
  };

  // ────────────────── BACKLINKS (heuristic) ──────────────────
  const nofollowRatio = externalLinks > 0 ? nofollowLinks / externalLinks : 0;
  const sponsoredLinks = $('a[rel*="sponsored"]').length;
  const ugcLinks = $('a[rel*="ugc"]').length;

  const backlinks: BacklinksSEO = {
    score: 70,
    externalLinksOut: externalLinks,
    nofollowRatio: parseFloat((nofollowRatio * 100).toFixed(1)),
    sponsoredLinks, ugcLinks,
    note: 'Full backlink profile requires Ahrefs/Moz API. Showing on-page outbound link data.',
  };

  // ────────────────── RENDERING ──────────────────
  const lazyLoadImgs = $('img[loading="lazy"]').length > 0;
  const jsRenderRequired = (html.match(/<script\b[^>]*>/gi) || []).length > 10 && $('body p').length < 3;
  const iframes = $('iframe').length;
  const flashContent = $('object, embed').length > 0;
  const cssBlocking = $('link[rel="stylesheet"]').length;
  const jsBlocking = $('script:not([async]):not([defer]):not([type="application/ld+json"])').length;
  const inlineStyles = $('[style]').length;

  const renderIssues: string[] = [];
  let renderScore = 100;
  if (!lazyLoadImgs && totalImgs > 3) { renderIssues.push('Images not lazy-loaded — add loading="lazy" attribute'); renderScore -= 20; }
  if (jsRenderRequired) { renderIssues.push('Page may require JS rendering — Googlebot may miss content'); renderScore -= 25; }
  if (iframes > 0) { renderIssues.push(`${iframes} iframe(s) — Googlebot may not index iframe content`); renderScore -= 10; }
  if (flashContent) { renderIssues.push('Flash/Object content detected — incompatible with modern crawlers'); renderScore -= 30; }
  if (cssBlocking > 5) { renderIssues.push(`${cssBlocking} render-blocking CSS files — consider inlining critical CSS`); renderScore -= 10; }
  if (jsBlocking > 5) { renderIssues.push(`${jsBlocking} blocking JS scripts — add async/defer attributes`); renderScore -= 15; }

  const rendering: RenderingSEO = {
    score: clamp(renderScore), lazyLoadImages: lazyLoadImgs, jsRenderRequired,
    iframes, flashContent, cssBlocking, jsBlocking, inlineStyles, issues: renderIssues,
  };

  // ────────────────── AMP ──────────────────
  const amp = await analyzeAMP(url, html);

  // Re-weight overall score to include AMP
  const overallScoreFinal = clamp(
    onPage.score * 0.18 +
    technical.score * 0.14 +
    security.score * 0.11 +
    crawl.score * 0.12 +
    content.score * 0.14 +
    social.score * 0.09 +
    rendering.score * 0.09 +
    backlinks.score * 0.05 +
    amp.score * 0.08
  );

  return {
    url, timestamp: new Date().toISOString(),
    overallScore: overallScoreFinal, grade: grade(overallScoreFinal),
    onPage, technical, crawl, security, social, content, backlinks, rendering, amp,
    performance: { score: 0, performance: 0, accessibility: 0, bestPractices: 0, seo: 0, fcp: '—', lcp: '—', tbt: '—', cls: '—', tti: '—', speedIndex: '—', resourceCount: cssBlocking + jsBlocking, totalSize: '—', issues: [], error: 'Run separately' },
  };
}
