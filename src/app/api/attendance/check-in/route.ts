import { NextResponse } from "next/server";

import { getCurrentUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { recordLoginAndUpdateStreak, unlockRewardsForUser } from "../../../../lib/rewards";

export const runtime = "nodejs";

const KOREA_TIMEZONE_OFFSET_MINUTES = 9 * 60;

export async function POST() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Login is required to check in." }, { status: 401 });
  }

  const consecutiveLoginDays = await recordLoginAndUpdateStreak({
    userId: currentUser.id,
    timezoneOffsetMinutes: KOREA_TIMEZONE_OFFSET_MINUTES,
    client: prisma,
  });
  const unlockedRewards = await unlockRewardsForUser({
    userId: currentUser.id,
    client: prisma,
  });

  return NextResponse.json({
    consecutiveLoginDays,
    checkedAt: new Date().toISOString(),
    unlockedRewards,
  });
}
