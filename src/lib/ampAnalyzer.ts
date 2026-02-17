import * as cheerio from 'cheerio';
import type {
  AMPAnalysis, AMPValidation, AMPTechnical, AMPContent,
  AMPPerformance, AMPComparison, AMPPageSnapshot, AMPDiff
} from './types';

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; DeepSEOBot/2.0; +https://deepseo.vercel.app)',
  'Accept': 'text/html,application/xhtml+xml',
};

function clamp(n: number) { return Math.max(0, Math.min(100, Math.round(n))); }

// AMP forbidden tags per spec
const AMP_FORBIDDEN_TAGS = ['script', 'style', 'frame', 'frameset', 'object', 'param', 'applet', 'base'];
// AMP allowed script srcs
const AMP_ALLOWED_SCRIPTS = ['cdn.ampproject.org'];
// AMP known components/extensions
const AMP_COMPONENTS = [
  'amp-img','amp-video','amp-iframe','amp-audio','amp-anim',
  'amp-carousel','amp-accordion','amp-lightbox','amp-sidebar',
  'amp-analytics','amp-ad','amp-social-share','amp-twitter',
  'amp-instagram','amp-youtube','amp-facebook','amp-pixel',
  'amp-list','amp-bind','amp-form','amp-fit-text','amp-font',
  'amp-install-serviceworker','amp-live-list','amp-selector',
  'amp-story','amp-access','amp-subscriptions','amp-geo'
];

async function fetchPage(url: string): Promise<{ html: string; ok: boolean; status: number }> {
  try {
    const res = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(12000) });
    return { html: await res.text(), ok: res.ok, status: res.status };
  } catch {
    return { html: '', ok: false, status: 0 };
  }
}

function snapshotPage($: cheerio.CheerioAPI, url: string): AMPPageSnapshot {
  const allText = $('body').text().split(/\s+/).filter(Boolean);
  let baseHostname = '';
  try { baseHostname = new URL(url).hostname; } catch {}
  return {
    url,
    title: $('title').first().text().trim() || null,
    metaDescription: $('meta[name="description"]').attr('content')?.trim() || null,
    wordCount: allText.length,
    h1: $('h1').first().text().trim() || null,
    canonical: $('link[rel="canonical"]').attr('href') || null,
    structuredData: $('script[type="application/ld+json"]').length > 0,
    imgCount: $('img, amp-img').length,
    internalLinks: $('a[href]').filter((_, el) => {
      try { return new URL($(el).attr('href') || '', url).hostname === baseHostname; }
      catch { return false; }
    }).length,
  };
}

export async function analyzeAMP(canonicalUrl: string, html: string): Promise<AMPAnalysis> {
  const $ = cheerio.load(html);
  const issues: string[] = [];
  const recommendations: string[] = [];

  // ── Detect AMP link on canonical page ────────────────────────────────────
  const ampHref = $('link[rel="amphtml"]').attr('href') || null;
  const isAmpPage = !!($('html[amp]').length || $('html[⚡]').length || html.includes('<html amp') || html.includes('<html ⚡'));
  const hasAmp = isAmpPage || !!ampHref;

  let ampUrl: string | null = null;
  if (ampHref) {
    try { ampUrl = new URL(ampHref, canonicalUrl).href; } catch {}
  } else if (isAmpPage) {
    ampUrl = canonicalUrl;
  }

  // ── Fetch AMP page if separate URL ────────────────────────────────────────
  let ampHtml = html;
  let $amp = $;
  if (ampUrl && ampUrl !== canonicalUrl) {
    const result = await fetchPage(ampUrl);
    if (result.ok) {
      ampHtml = result.html;
      $amp = cheerio.load(ampHtml);
    }
  }

  const isActuallyAmp = !!($amp('html[amp]').length || $amp('html[⚡]').length || ampHtml.includes('<html amp') || ampHtml.includes('<html ⚡'));

  // ── VALIDATION ────────────────────────────────────────────────────────────
  const valIssues: string[] = [];
  let valScore = 100;

  const hasAmpHtmlAttribute = isActuallyAmp;
  const hasCharsetUtf8 = !!($amp('meta[charset="utf-8"]').length || ampHtml.toLowerCase().includes('charset="utf-8"') || ampHtml.toLowerCase().includes("charset='utf-8'"));
  const hasViewport = !!$amp('meta[name="viewport"]').attr('content');
  const hasAmpBoilerplate = ampHtml.includes('amp-boilerplate') || ampHtml.includes('style amp-boilerplate');
  const hasAmpRuntime = ampHtml.includes('cdn.ampproject.org/v0.js');
  const hasCanonicalLink = !!$amp('link[rel="canonical"]').attr('href');

  // Check for forbidden custom JS
  let forbiddenScripts = 0;
  $amp('script').each((_, el) => {
    const src = $amp(el).attr('src') || '';
    const type = $amp(el).attr('type') || '';
    const custom = $amp(el).attr('custom-element') || $amp(el).attr('custom-template') || '';
    if (!src && type !== 'application/ld+json' && type !== 'application/json') forbiddenScripts++;
    else if (src && !AMP_ALLOWED_SCRIPTS.some(a => src.includes(a)) && !custom) forbiddenScripts++;
  });
  const noCustomJs = forbiddenScripts === 0;

  // Check inline styles (only <style amp-custom> allowed)
  const inlineStylesOnElements = $amp('[style]').length;
  const noInlineStyles = inlineStylesOnElements === 0;

  // Forms
  const formElements = $amp('form').length;
  const noFormElements = formElements === 0;

  // amp-img usage
  const regularImgCount = $amp('img').length;
  const ampImgCount = $amp('amp-img').length;
  const usesAmpImg = ampImgCount > 0 || regularImgCount === 0;

  const regularVideoCount = $amp('video').length;
  const ampVideoCount = $amp('amp-video').length;
  const usesAmpVideo = ampVideoCount > 0 || regularVideoCount === 0;

  const regularIframeCount = $amp('iframe').length;
  const ampIframeCount = $amp('amp-iframe').length;
  const usesAmpIframe = ampIframeCount > 0 || regularIframeCount === 0;

  // Forbidden tags
  const foundForbidden: string[] = [];
  AMP_FORBIDDEN_TAGS.forEach(tag => {
    if (tag === 'script') return; // handled above
    const count = $amp(tag).length;
    if (count > 0) foundForbidden.push(`<${tag}> (${count}x)`);
  });

  // Custom CSS size
  const customCssContent = $amp('style[amp-custom]').html() || '';
  const customCssSize = new Blob([customCssContent]).size;
  const customCssSizeLimit = 75000; // 75KB AMP limit

  if (!hasAmpHtmlAttribute) { valIssues.push('Missing ⚡ or amp attribute on <html> tag'); valScore -= 25; }
  if (!hasCharsetUtf8) { valIssues.push('Missing <meta charset="utf-8"> — required in AMP'); valScore -= 15; }
  if (!hasViewport) { valIssues.push('Missing viewport meta tag — required in AMP'); valScore -= 10; }
  if (!hasAmpBoilerplate) { valIssues.push('Missing AMP boilerplate CSS — required for valid AMP'); valScore -= 20; }
  if (!hasAmpRuntime) { valIssues.push('Missing AMP runtime script (cdn.ampproject.org/v0.js)'); valScore -= 20; }
  if (!hasCanonicalLink) { valIssues.push('Missing canonical link — AMP page must point to canonical'); valScore -= 15; }
  if (!noCustomJs) { valIssues.push(`${forbiddenScripts} custom JS script(s) found — not allowed in AMP`); valScore -= 20; }
  if (!noInlineStyles) { valIssues.push(`${inlineStylesOnElements} inline style(s) on elements — use <style amp-custom> instead`); valScore -= 10; }
  if (!noFormElements && !$amp('amp-form').length) { valIssues.push('Raw <form> tags found — use <amp-form> extension instead'); valScore -= 10; }
  if (!usesAmpImg && regularImgCount > 0) { valIssues.push(`${regularImgCount} <img> tag(s) found — replace with <amp-img>`); valScore -= 15; }
  if (foundForbidden.length) { valIssues.push(`Forbidden tags found: ${foundForbidden.join(', ')}`); valScore -= foundForbidden.length * 5; }
  if (customCssSize > customCssSizeLimit) { valIssues.push(`Custom CSS too large (${Math.round(customCssSize/1000)}KB) — AMP limit is 75KB`); valScore -= 20; }

  const validation: AMPValidation = {
    score: clamp(valScore),
    hasAmpHtmlAttribute, hasCharsetUtf8, hasViewport, hasAmpBoilerplate,
    hasAmpRuntime, hasCanonicalLink, noCustomJs, noInlineStyles,
    noFormElements: noFormElements || !!$amp('amp-form').length,
    usesAmpImg, usesAmpVideo, usesAmpIframe,
    forbiddenTagsFound: foundForbidden,
    customCssSize, customCssSizeLimit,
    issues: valIssues,
  };

  // ── TECHNICAL ─────────────────────────────────────────────────────────────
  const techIssues: string[] = [];
  let techScore = 100;

  const ampRuntimeEl = $amp('script[src*="cdn.ampproject.org/v0.js"]');
  const ampRuntimeSrc = ampRuntimeEl.attr('src') || null;

  // Detect all AMP components used
  const usedComponents: string[] = [];
  AMP_COMPONENTS.forEach(comp => {
    if ($amp(comp).length > 0) usedComponents.push(comp);
  });

  // Detect AMP extension scripts
  const ampExtensions: string[] = [];
  $amp('script[custom-element], script[custom-template]').each((_, el) => {
    const ext = $amp(el).attr('custom-element') || $amp(el).attr('custom-template') || '';
    if (ext) ampExtensions.push(ext);
  });

  // Structured data
  const sdTypes: string[] = [];
  $amp('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($amp(el).html() || '{}');
      const t = json['@type'];
      if (t) sdTypes.push(Array.isArray(t) ? t.join(', ') : t);
    } catch {}
  });

  const ampCanonical = $amp('link[rel="canonical"]').attr('href') || null;
  const canonicalPointsToNonAmp = !!ampCanonical && ampCanonical !== ampUrl;
  const selfCanonical = ampCanonical === ampUrl;
  const metaCharset = $amp('meta[charset]').attr('charset') || null;
  const metaViewport = $amp('meta[name="viewport"]').attr('content') || null;
  const hreflang: string[] = [];
  $amp('link[rel="alternate"][hreflang]').each((_, el) => hreflang.push($amp(el).attr('hreflang') || ''));
  const robotsMeta = $amp('meta[name="robots"]').attr('content') || null;
  const isIndexable = !robotsMeta?.includes('noindex');

  if (!ampRuntimeSrc) { techIssues.push('AMP runtime script not found'); techScore -= 20; }
  if (!ampCanonical) { techIssues.push('Missing <link rel="canonical"> — links AMP to main page'); techScore -= 20; }
  if (selfCanonical) { techIssues.push('AMP page canonical points to itself — should point to non-AMP'); techScore -= 15; }
  if (!sdTypes.length) { techIssues.push('No structured data on AMP page — add JSON-LD for rich results'); techScore -= 10; }
  if (!isIndexable) { techIssues.push('AMP page has noindex — Google will not index it'); techScore -= 30; }
  if (ampExtensions.length > 10) { techIssues.push(`Many AMP extensions (${ampExtensions.length}) may impact load speed`); }

  const ampTechnical: AMPTechnical = {
    score: clamp(techScore),
    ampRuntimeSrc, ampComponents: usedComponents, ampExtensions,
    structuredData: { found: sdTypes.length > 0, types: sdTypes },
    canonicalPointsToNonAmp, canonicalUrl: ampCanonical, selfCanonical,
    metaCharset, metaViewport, hreflang, robotsMeta, isIndexable,
    issues: techIssues,
  };

  // ── CONTENT ───────────────────────────────────────────────────────────────
  const contIssues: string[] = [];
  let contScore = 100;

  const ampWordCount = $amp('body').text().split(/\s+/).filter(Boolean).length;
  const totalAmpImgs = $amp('amp-img').length;
  const totalRegularImgs = $amp('img').length;
  const totalAmpVideos = $amp('amp-video, amp-youtube, amp-vimeo').length;
  const totalRegularVideos = $amp('video').length;
  const totalAmpIframes = $amp('amp-iframe').length;
  const totalRegularIframes = $amp('iframe').length;

  const socialComponents = ['amp-twitter','amp-instagram','amp-facebook','amp-pinterest','amp-tiktok','amp-youtube'];
  const foundSocial = socialComponents.filter(c => $amp(c).length > 0);
  const hasAd = $amp('amp-ad').length > 0;

  if (totalRegularImgs > 0) { contIssues.push(`${totalRegularImgs} <img> tag(s) — replace with <amp-img> for AMP compliance`); contScore -= totalRegularImgs * 5; }
  if (totalRegularVideos > 0) { contIssues.push(`${totalRegularVideos} <video> tag(s) — replace with <amp-video>`); contScore -= 10; }
  if (totalRegularIframes > 0) { contIssues.push(`${totalRegularIframes} <iframe> tag(s) — replace with <amp-iframe>`); contScore -= 10; }

  const ampContent: AMPContent = {
    score: clamp(contScore),
    wordCount: ampWordCount,
    imgCount: totalAmpImgs + totalRegularImgs,
    ampImgCount: totalAmpImgs, regularImgCount: totalRegularImgs,
    videoCount: totalAmpVideos + totalRegularVideos,
    ampVideoCount: totalAmpVideos, iframeCount: totalAmpIframes + totalRegularIframes,
    ampIframeCount: totalAmpIframes, hasAd,
    hasSocialEmbed: foundSocial.length > 0, socialEmbedComponents: foundSocial,
    issues: contIssues,
  };

  // ── PERFORMANCE ───────────────────────────────────────────────────────────
  const perfIssues: string[] = [];
  let perfScore = 100;

  const allScripts = $amp('script');
  let allowedScripts = 0, blockedScripts = 0;
  allScripts.each((_, el) => {
    const src = $amp(el).attr('src') || '';
    const ce = $amp(el).attr('custom-element') || $amp(el).attr('custom-template') || '';
    const type = $amp(el).attr('type') || '';
    if (src.includes('cdn.ampproject.org') || ce || type === 'application/ld+json' || type === 'application/json') allowedScripts++;
    else blockedScripts++;
  });

  const criticalPathOk = hasAmpBoilerplate && hasAmpRuntime && noCustomJs;

  if (blockedScripts > 0) { perfIssues.push(`${blockedScripts} non-AMP scripts blocked by AMP runtime`); perfScore -= blockedScripts * 10; }
  if (!criticalPathOk) { perfIssues.push('Critical render path not fully AMP-optimized'); perfScore -= 15; }
  if (customCssSize > 50000) { perfIssues.push(`Large custom CSS (${Math.round(customCssSize/1000)}KB) — keep under 50KB for best performance`); perfScore -= 10; }
  if (ampExtensions.length > 8) { perfIssues.push(`High number of AMP extensions (${ampExtensions.length}) — each adds load time`); perfScore -= 5; }

  const ampPerformance: AMPPerformance = {
    score: clamp(perfScore),
    inlineStylesCount: inlineStylesOnElements,
    customCssKb: parseFloat((customCssSize / 1000).toFixed(2)),
    scriptTagsCount: allScripts.length,
    allowedScriptCount: allowedScripts,
    externalScriptsBlocked: blockedScripts,
    criticalPathOptimized: criticalPathOk,
    issues: perfIssues,
  };

  // ── COMPARISON (canonical vs AMP) ─────────────────────────────────────────
  let comparison: AMPComparison | null = null;

  if (ampUrl && ampUrl !== canonicalUrl && ampHtml) {
    const canonicalSnapshot = snapshotPage($, canonicalUrl);
    const ampSnapshot = snapshotPage($amp, ampUrl);
    const diffs: AMPDiff[] = [];

    // Title comparison
    if (canonicalSnapshot.title !== ampSnapshot.title) {
      diffs.push({ field: 'Title', canonical: canonicalSnapshot.title, amp: ampSnapshot.title,
        severity: 'critical', message: 'Title mismatch between canonical and AMP page — affects SEO consistency' });
    }
    // Meta description
    if (canonicalSnapshot.metaDescription !== ampSnapshot.metaDescription) {
      diffs.push({ field: 'Meta Description', canonical: canonicalSnapshot.metaDescription, amp: ampSnapshot.metaDescription,
        severity: 'warning', message: 'Meta description differs — keep consistent for unified SERP appearance' });
    }
    // H1
    if (canonicalSnapshot.h1 !== ampSnapshot.h1) {
      diffs.push({ field: 'H1', canonical: canonicalSnapshot.h1, amp: ampSnapshot.h1,
        severity: 'critical', message: 'H1 mismatch — main heading should be identical on both versions' });
    }
    // Canonical check
    if (ampSnapshot.canonical !== canonicalUrl) {
      diffs.push({ field: 'AMP Canonical', canonical: canonicalUrl, amp: ampSnapshot.canonical,
        severity: 'critical', message: 'AMP page canonical must point to the non-AMP URL' });
    }
    // Word count parity
    const wordDiff = Math.abs(canonicalSnapshot.wordCount - ampSnapshot.wordCount);
    const wordPct = canonicalSnapshot.wordCount > 0 ? (wordDiff / canonicalSnapshot.wordCount) * 100 : 0;
    if (wordPct > 20) {
      diffs.push({ field: 'Word Count', canonical: canonicalSnapshot.wordCount, amp: ampSnapshot.wordCount,
        severity: wordPct > 40 ? 'critical' : 'warning', message: `Content parity issue: ${Math.round(wordPct)}% word count difference — AMP should mirror canonical content` });
    }
    // Structured data
    if (canonicalSnapshot.structuredData !== ampSnapshot.structuredData) {
      diffs.push({ field: 'Structured Data', canonical: canonicalSnapshot.structuredData, amp: ampSnapshot.structuredData,
        severity: 'warning', message: 'Structured data presence differs — duplicate on AMP for full rich result coverage' });
    }
    // Internal links
    const linkDiff = Math.abs(canonicalSnapshot.internalLinks - ampSnapshot.internalLinks);
    if (linkDiff > 5) {
      diffs.push({ field: 'Internal Links', canonical: canonicalSnapshot.internalLinks, amp: ampSnapshot.internalLinks,
        severity: 'info', message: `Link count differs by ${linkDiff} — some variation is normal but avoid hiding navigation` });
    }

    const contentParity = clamp(100 - wordPct);
    const seoEquivalence = clamp(100 - (diffs.filter(d => d.severity === 'critical').length * 25 + diffs.filter(d => d.severity === 'warning').length * 10));

    comparison = { canonical: canonicalSnapshot, amp: ampSnapshot, differences: diffs, contentParity, seoEquivalence };
  }

  // ── RECOMMENDATIONS ───────────────────────────────────────────────────────
  if (!hasAmp) {
    recommendations.push('Consider adding AMP version — improves mobile load speed and can boost SERP visibility');
    recommendations.push('Use amp-html to create AMP pages from existing content');
  }
  if (hasAmp && !hasAmpBoilerplate) recommendations.push('Add required AMP boilerplate CSS to pass AMP validation');
  if (hasAmp && !sdTypes.length) recommendations.push('Add JSON-LD structured data to AMP page for rich results eligibility');
  if (hasAmp && totalRegularImgs > 0) recommendations.push(`Replace ${totalRegularImgs} <img> with <amp-img> — required for AMP compliance`);
  if (hasAmp && customCssSize > 50000) recommendations.push('Reduce custom CSS — consider removing unused styles to stay under 75KB limit');
  if (hasAmp && ampExtensions.length < 2) recommendations.push('Explore AMP components: amp-analytics, amp-social-share, amp-carousel for richer pages');
  if (comparison && comparison.seoEquivalence < 80) recommendations.push('Improve content parity between canonical and AMP — search engines index both');

  // ── OVERALL AMP SCORE ─────────────────────────────────────────────────────
  let ampScore = 0;
  if (!hasAmp) {
    ampScore = 20; // No AMP implemented
    issues.push('No AMP version found — add <link rel="amphtml"> and create an AMP page');
  } else {
    ampScore = clamp(
      validation.score * 0.30 +
      ampTechnical.score * 0.25 +
      ampContent.score * 0.20 +
      ampPerformance.score * 0.25
    );
    issues.push(...valIssues.slice(0, 3), ...techIssues.slice(0, 2));
  }

  return {
    score: ampScore,
    hasAmp, isAmpPage, ampUrl,
    ampHtmlTag: hasAmpHtmlAttribute,
    ampBoilerplate: hasAmpBoilerplate,
    ampCanonical: ampCanonical,
    ampLinkedFromCanonical: !!ampHref,
    validation, technical: ampTechnical, content: ampContent,
    performance: ampPerformance, comparison,
    issues, recommendations,
  };
}
