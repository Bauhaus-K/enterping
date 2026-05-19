import { NextResponse } from "next/server";

import { getGlobalAverageSpmLeaderboard } from "../../../../lib/social";

export const runtime = "nodejs";

export async function GET() {
  const leaderboard = await getGlobalAverageSpmLeaderboard(10);

  return NextResponse.json({ leaderboard });
}
