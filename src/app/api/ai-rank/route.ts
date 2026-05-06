import { NextRequest, NextResponse } from "next/server";
import { runPromptRanking } from "@/lib/aiTracker/promptRunner";

export async function POST(req: NextRequest) {
  try {
    const { prompt, brand } = await req.json();

    if (!prompt || !brand)
      return NextResponse.json(
        { error: "prompt and brand required" },
        { status: 400 }
      );

    const report = await runPromptRanking(prompt, brand);

    return NextResponse.json({
      success: true,
      data: report,
    });

  } catch (err) {
    return NextResponse.json(
      { error: "AI ranking failed" },
      { status: 500 }
    );
  }
}
