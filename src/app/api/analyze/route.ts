import { NextRequest, NextResponse } from 'next/server';
import { runFullAnalysis } from '@/lib/analyzer';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    const report = await runFullAnalysis(url);
    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Analysis failed' }, { status: 500 });
  }
}
