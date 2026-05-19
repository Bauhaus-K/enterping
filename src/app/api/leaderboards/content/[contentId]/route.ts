import { NextResponse } from "next/server";

import { getContentScoreLeaderboard } from "../../../../../lib/social";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    contentId: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { contentId } = await context.params;

  if (!contentId) {
    return NextResponse.json({ error: "Missing contentId." }, { status: 400 });
  }

  const leaderboard = await getContentScoreLeaderboard(contentId, 10);

  return NextResponse.json({ leaderboard });
}
