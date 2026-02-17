import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { url, competitor } = await req.json();
    if (!url || !competitor) return NextResponse.json({ error: 'Both URLs required' }, { status: 400 });
    const headers = { 'User-Agent': 'Mozilla/5.0 (compatible; DeepSEOBot/2.0)' };

    const fetchMeta = async (u: string) => {
      const nu = u.startsWith('http') ? u : 'https://' + u;
      const res = await fetch(nu, { headers, signal: AbortSignal.timeout(12000) });
      const html = await res.text();
      const $ = cheerio.load(html);
      const bodyText = $('body').text();
      const words = bodyText.split(/\s+/).filter(Boolean);
      const freq: Record<string, number> = {};
      const stop = new Set(['this','that','with','have','from','they','been','were','your','will','more']);
      words.forEach(w => { const lw = w.toLowerCase().replace(/[^a-z]/g,''); if (lw.length > 3 && !stop.has(lw)) freq[lw] = (freq[lw]||0)+1; });
      const topKw = Object.entries(freq).sort(([,a],[,b])=>b-a).slice(0,10).map(([word,count])=>({word,count}));
      return {
        url: nu,
        title: $('title').first().text().trim(),
        metaDesc: $('meta[name="description"]').attr('content')?.trim() ?? null,
        h1Count: $('h1').length, h2Count: $('h2').length,
        wordCount: words.length, imgCount: $('img').length,
        internalLinks: $('a[href]').filter((_,el)=>{ try { return new URL($(el).attr('href')||'',nu).hostname===new URL(nu).hostname; } catch{ return false; }}).length,
        hasStructuredData: $('script[type="application/ld+json"]').length > 0,
        hasOg: $('meta[property="og:title"]').length > 0,
        topKeywords: topKw,
      };
    };

    const [main, comp] = await Promise.all([fetchMeta(url), fetchMeta(competitor)]);
    return NextResponse.json({ main, competitor: comp });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Comparison failed' }, { status: 500 });
  }
}
