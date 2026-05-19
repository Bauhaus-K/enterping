import type { PrismaClient } from "@prisma/client";

import { prisma } from "./prisma";

export type RewardKindValue = "BADGE" | "TITLE";
export type RewardMetricValue = "TOTAL_PLAYTIME_MS" | "LOGIN_STREAK" | "ACCURACY_STREAK";

export interface RewardDefinition {
  slug: string;
  name: string;
  description: string;
  kind: RewardKindValue;
  metric: RewardMetricValue;
  threshold: number;
  icon: string;
}

export interface RewardableSession {
  accuracy: number;
  startedAt?: Date | string | null;
  createdAt?: Date | string | null;
}

export interface RewardEvaluationInput {
  totalPlaytimeMs: number;
  consecutiveLoginDays: number;
  recentSessions: RewardableSession[];
  existingRewardSlugs?: string[];
}

export interface RewardUnlockCandidate {
  definition: RewardDefinition;
  triggerValue: number;
}

type RewardClient = Pick<PrismaClient, "gameSession" | "reward" | "user" | "userReward">;

const MS_PER_DAY = 86_400_000;
const ACCURACY_STREAK_THRESHOLD = 95;

export const REWARD_DEFINITIONS: RewardDefinition[] = [
  {
    slug: "j-pop-beginner",
    name: "J-Pop Beginner",
    description: "Logged 1 hour of total typing playtime.",
    kind: "BADGE",
    metric: "TOTAL_PLAYTIME_MS",
    threshold: 60 * 60 * 1000,
    icon: "JP",
  },
  {
    slug: "anime-master",
    name: "Anime Master",
    description: "Logged 10 hours of total typing playtime.",
    kind: "TITLE",
    metric: "TOTAL_PLAYTIME_MS",
    threshold: 10 * 60 * 60 * 1000,
    icon: "AM",
  },
  {
    slug: "ten-day-streak",
    name: "10-Day Streak",
    description: "Logged in for 10 consecutive days.",
    kind: "BADGE",
    metric: "LOGIN_STREAK",
    threshold: 10,
    icon: "10",
  },
  {
    slug: "precision-idol",
    name: "Precision Idol",
    description: "Maintained at least 95% accuracy for 5 consecutive games.",
    kind: "TITLE",
    metric: "ACCURACY_STREAK",
    threshold: 5,
    icon: "95",
  },
];

export function calculateConsecutiveLoginDays({
  previousLastLoginAt,
  currentLoginAt = new Date(),
  previousStreak,
  timezoneOffsetMinutes = 0,
}: {
  previousLastLoginAt?: Date | string | null;
  currentLoginAt?: Date;
  previousStreak: number;
  timezoneOffsetMinutes?: number;
}): number {
  if (!previousLastLoginAt) {
    return 1;
  }

  const previousDayIndex = getLocalDayIndex(new Date(previousLastLoginAt), timezoneOffsetMinutes);
  const currentDayIndex = getLocalDayIndex(currentLoginAt, timezoneOffsetMinutes);

  if (currentDayIndex === previousDayIndex) {
    return Math.max(previousStreak, 1);
  }

  if (currentDayIndex === previousDayIndex + 1) {
    return Math.max(previousStreak, 0) + 1;
  }

  return 1;
}

export function shouldResetMissedLoginStreak({
  lastLoginAt,
  currentDate = new Date(),
  consecutiveLoginDays,
  timezoneOffsetMinutes = 0,
}: {
  lastLoginAt?: Date | string | null;
  currentDate?: Date;
  consecutiveLoginDays: number;
  timezoneOffsetMinutes?: number;
}): boolean {
  if (!lastLoginAt || consecutiveLoginDays <= 0) {
    return false;
  }

  const lastLoginDayIndex = getLocalDayIndex(new Date(lastLoginAt), timezoneOffsetMinutes);
  const currentDayIndex = getLocalDayIndex(currentDate, timezoneOffsetMinutes);

  return currentDayIndex - lastLoginDayIndex > 1;
}

export function getAccuracyStreak(
  sessions: RewardableSession[],
  accuracyThreshold = ACCURACY_STREAK_THRESHOLD,
): number {
  const sortedSessions = [...sessions].sort((left, right) => {
    return getSessionTime(right) - getSessionTime(left);
  });

  let streak = 0;

  for (const session of sortedSessions) {
    if (session.accuracy >= accuracyThreshold) {
      streak += 1;
      continue;
    }

    break;
  }

  return streak;
}

export function evaluateRewardUnlocks({
  totalPlaytimeMs,
  consecutiveLoginDays,
  recentSessions,
  existingRewardSlugs = [],
}: RewardEvaluationInput): RewardUnlockCandidate[] {
  const existingRewards = new Set(existingRewardSlugs);
  const accuracyStreak = getAccuracyStreak(recentSessions);

  return REWARD_DEFINITIONS.flatMap((definition) => {
    if (existingRewards.has(definition.slug)) {
      return [];
    }

    const triggerValue = getTriggerValue({
      definition,
      totalPlaytimeMs,
      consecutiveLoginDays,
      accuracyStreak,
    });

    if (triggerValue < definition.threshold) {
      return [];
    }

    return [{ definition, triggerValue }];
  });
}

export async function seedRewardDefinitions(client: RewardClient = prisma): Promise<void> {
  await Promise.all(
    REWARD_DEFINITIONS.map((definition) =>
      client.reward.upsert({
        where: { slug: definition.slug },
        update: {
          name: definition.name,
          description: definition.description,
          kind: definition.kind,
          metric: definition.metric,
          threshold: definition.threshold,
          icon: definition.icon,
        },
        create: {
          slug: definition.slug,
          name: definition.name,
          description: definition.description,
          kind: definition.kind,
          metric: definition.metric,
          threshold: definition.threshold,
          icon: definition.icon,
        },
      }),
    ),
  );
}

export async function recordLoginAndUpdateStreak({
  userId,
  currentLoginAt = new Date(),
  timezoneOffsetMinutes = 0,
  client = prisma,
}: {
  userId: string;
  currentLoginAt?: Date;
  timezoneOffsetMinutes?: number;
  client?: RewardClient;
}): Promise<number> {
  const user = await client.user.findUnique({
    where: { id: userId },
    select: {
      consecutiveLoginDays: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    throw new Error(`User ${userId} was not found.`);
  }

  const nextStreak = calculateConsecutiveLoginDays({
    previousLastLoginAt: user.lastLoginAt,
    currentLoginAt,
    previousStreak: user.consecutiveLoginDays,
    timezoneOffsetMinutes,
  });

  await client.user.update({
    where: { id: userId },
    data: {
      consecutiveLoginDays: nextStreak,
      lastLoginAt: currentLoginAt,
    },
  });

  return nextStreak;
}

export async function resetMissedLoginStreaks({
  currentDate = new Date(),
  timezoneOffsetMinutes = 0,
  client = prisma,
}: {
  currentDate?: Date;
  timezoneOffsetMinutes?: number;
  client?: RewardClient;
} = {}): Promise<number> {
  const streakedUsers = await client.user.findMany({
    where: {
      consecutiveLoginDays: {
        gt: 0,
      },
    },
    select: {
      id: true,
      consecutiveLoginDays: true,
      lastLoginAt: true,
    },
  });

  const usersToReset = streakedUsers.filter((user) =>
    shouldResetMissedLoginStreak({
      lastLoginAt: user.lastLoginAt,
      currentDate,
      consecutiveLoginDays: user.consecutiveLoginDays,
      timezoneOffsetMinutes,
    }),
  );

  if (usersToReset.length === 0) {
    return 0;
  }

  const updateResult = await client.user.updateMany({
    where: {
      id: {
        in: usersToReset.map((user) => user.id),
      },
    },
    data: {
      consecutiveLoginDays: 0,
    },
  });

  return updateResult.count;
}

export async function unlockRewardsForUser({
  userId,
  client = prisma,
}: {
  userId: string;
  client?: RewardClient;
}) {
  await seedRewardDefinitions(client);

  const user = await client.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      totalPlaytimeMs: true,
      consecutiveLoginDays: true,
      rewards: {
        select: {
          reward: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error(`User ${userId} was not found.`);
  }

  const recentSessions = await client.gameSession.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: 10,
    select: {
      accuracy: true,
      startedAt: true,
      createdAt: true,
    },
  });

  const candidates = evaluateRewardUnlocks({
    totalPlaytimeMs: user.totalPlaytimeMs,
    consecutiveLoginDays: user.consecutiveLoginDays,
    recentSessions,
    existingRewardSlugs: user.rewards.map((userReward) => userReward.reward.slug),
  });

  if (candidates.length === 0) {
    return [];
  }

  const rewards = await client.reward.findMany({
    where: {
      slug: {
        in: candidates.map((candidate) => candidate.definition.slug),
      },
    },
  });
  const rewardBySlug = new Map(rewards.map((reward) => [reward.slug, reward]));

  await Promise.all(
    candidates.map((candidate) => {
      const reward = rewardBySlug.get(candidate.definition.slug);

      if (!reward) {
        return Promise.resolve();
      }

      return client.userReward.create({
        data: {
          userId,
          rewardId: reward.id,
          triggerValue: candidate.triggerValue,
        },
      });
    }),
  );

  return candidates.map((candidate) => ({
    ...candidate.definition,
    triggerValue: candidate.triggerValue,
  }));
}

function getTriggerValue({
  definition,
  totalPlaytimeMs,
  consecutiveLoginDays,
  accuracyStreak,
}: {
  definition: RewardDefinition;
  totalPlaytimeMs: number;
  consecutiveLoginDays: number;
  accuracyStreak: number;
}): number {
  switch (definition.metric) {
    case "TOTAL_PLAYTIME_MS":
      return totalPlaytimeMs;
    case "LOGIN_STREAK":
      return consecutiveLoginDays;
    case "ACCURACY_STREAK":
      return accuracyStreak;
  }
}

function getLocalDayIndex(date: Date, timezoneOffsetMinutes: number): number {
  return Math.floor((date.getTime() + timezoneOffsetMinutes * 60_000) / MS_PER_DAY);
}

function getSessionTime(session: RewardableSession): number {
  const date = session.startedAt ?? session.createdAt;
  return date ? new Date(date).getTime() : 0;
}
