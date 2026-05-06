import { NextRequest, NextResponse } from 'next/server';
import { runFullAnalysis } from '@/lib/analyzer';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body?.url;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // -------------------------
    // RUN MAIN ANALYSIS
    // -------------------------
    const report = await runFullAnalysis(url);

    // -------------------------
    // SAFETY FALLBACK
    // (prevents frontend crash)
    // -------------------------
    if (!report.intelligence?.aiVisibility) {
      report.intelligence = {
        ...report.intelligence,
        aiVisibility: {
          score: 0,
          answerability: 0,
          entityAuthority: 0,
          citationReadiness: 0,
          llmAccessibility: 0,
          hints: ['AI visibility analysis not available'],
        },
      };
    }

    // -------------------------
    // RETURN STANDARD RESPONSE
    // -------------------------
    return NextResponse.json({
      success: true,
      data: report,
    });

  } catch (err) {
    console.error('Analysis Error:', err);

    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error ? err.message : 'Analysis failed',
      },
      { status: 500 }
    );
  }
}
