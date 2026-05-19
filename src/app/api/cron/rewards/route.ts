import { NextResponse } from "next/server";

import { prisma } from "../../../../lib/prisma";
import { resetMissedLoginStreaks, seedRewardDefinitions, unlockRewardsForUser } from "../../../../lib/rewards";

export const runtime = "nodejs";

async function runRewardsCron(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (cronSecret && authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  await seedRewardDefinitions(prisma);

  const resetStreakCount = await resetMissedLoginStreaks({
    currentDate: new Date(),
    client: prisma,
  });

  const users = await prisma.user.findMany({
    select: {
      id: true,
    },
  });

  const unlockedRewards = (
    await Promise.all(
      users.map(async (user) => {
        const rewards = await unlockRewardsForUser({
          userId: user.id,
          client: prisma,
        });

        return rewards.map((reward) => ({
          userId: user.id,
          slug: reward.slug,
          name: reward.name,
          triggerValue: reward.triggerValue,
        }));
      }),
    )
  ).flat();

  return NextResponse.json({
    resetStreakCount,
    unlockedRewardCount: unlockedRewards.length,
    unlockedRewards,
  });
}

export async function GET(request: Request) {
  return runRewardsCron(request);
}

export async function POST(request: Request) {
  return runRewardsCron(request);
}
