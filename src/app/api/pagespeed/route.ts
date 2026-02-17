import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });
    const apiKey = process.env.PAGESPEED_API_KEY;
    const strategies = ['mobile', 'desktop'];
    const results: Record<string, any> = {};

    for (const strategy of strategies) {
      const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}${apiKey ? `&key=${apiKey}` : ''}`;
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(25000) });
      if (!res.ok) throw new Error(`PageSpeed API: ${res.status}`);
      const data = await res.json();
      const cats = data.lighthouseResult?.categories ?? {};
      const audits = data.lighthouseResult?.audits ?? {};
      results[strategy] = {
        performance: Math.round((cats.performance?.score ?? 0) * 100),
        accessibility: Math.round((cats.accessibility?.score ?? 0) * 100),
        bestPractices: Math.round((cats['best-practices']?.score ?? 0) * 100),
        seo: Math.round((cats.seo?.score ?? 0) * 100),
        fcp: audits['first-contentful-paint']?.displayValue ?? 'N/A',
        lcp: audits['largest-contentful-paint']?.displayValue ?? 'N/A',
        tbt: audits['total-blocking-time']?.displayValue ?? 'N/A',
        cls: audits['cumulative-layout-shift']?.displayValue ?? 'N/A',
        tti: audits['interactive']?.displayValue ?? 'N/A',
        speedIndex: audits['speed-index']?.displayValue ?? 'N/A',
        opportunities: Object.values(audits)
          .filter((a: any) => a.score !== null && a.score < 0.9)
          .sort((a: any, b: any) => (a.score ?? 1) - (b.score ?? 1))
          .slice(0, 8)
          .map((a: any) => ({ id: a.id, title: a.title, score: Math.round((a.score ?? 0) * 100), displayValue: a.displayValue })),
      };
    }
    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'PageSpeed failed' }, { status: 500 });
  }
}
