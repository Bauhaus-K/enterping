import { NextResponse } from "next/server";

import { generatePronunciationGuides } from "../../../lib/japaneseGuides";

export const runtime = "nodejs";

interface PronunciationGuideRequestBody {
  lines?: unknown;
}

export async function POST(request: Request) {
  const body = (await request.json()) as PronunciationGuideRequestBody;

  if (!Array.isArray(body.lines) || body.lines.some((line) => typeof line !== "string")) {
    return NextResponse.json({ error: "`lines` must be an array of strings." }, { status: 400 });
  }

  const lines = body.lines.map((line) => line.trim()).filter(Boolean);

  if (lines.length === 0) {
    return NextResponse.json({ guides: [] });
  }

  const guides = await generatePronunciationGuides(lines);

  return NextResponse.json({ guides });
}
