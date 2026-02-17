import { NextRequest, NextResponse } from 'next/server';
import { analyzeAMP } from '@/lib/ampAnalyzer';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http')) normalizedUrl = 'https://' + normalizedUrl;

    const res = await fetch(normalizedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DeepSEOBot/2.0)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const html = await res.text();

    const ampAnalysis = await analyzeAMP(normalizedUrl, html);
    return NextResponse.json(ampAnalysis);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'AMP analysis failed' }, { status: 500 });
  }
}
