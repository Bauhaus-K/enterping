import type { ContentCategory, PrismaClient } from "@prisma/client";

import { getCachedValue } from "./cache";
import { prisma } from "./prisma";

export type UgcExplorerSort = "newest" | "mostPlayed";

export interface UgcExplorerQuery {
  category?: ContentCategory;
  sort?: UgcExplorerSort;
  currentUserId?: string;
  take?: number;
  skip?: number;
}

export interface UgcExplorerItem {
  id: string;
  title: string;
  artist: string | null;
  category: ContentCategory;
  youtubeVideoId: string;
  thumbnailUrl: string | null;
  difficulty: number;
  playCount: number;
  createdAt: Date;
  creator: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  lyricLineCount: number;
}

export interface GlobalLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  averageStrokesPerMinute: number;
  averageWordsPerMinute: number;
  sessionCount: number;
}

export interface ContentLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  score: number;
  accuracy: number;
  strokesPerMinute: number;
  wordsPerMinute: number;
  playedAt: Date;
}

type SocialClient = Pick<PrismaClient, "content" | "gameSession" | "user">;
const LEADERBOARD_CACHE_TTL_MS = 60_000;

export async function getUgcExplorerContent({
  category,
  sort = "newest",
  currentUserId,
  take = 24,
  skip = 0,
}: UgcExplorerQuery = {},
client: SocialClient = prisma): Promise<UgcExplorerItem[]> {
  const contents = await client.content.findMany({
    where: {
      isPublished: true,
      isUgc: true,
      ...(category ? { category } : {}),
      ...(currentUserId
        ? {
            OR: [{ creatorId: null }, { creatorId: { not: currentUserId } }],
          }
        : {}),
    },
    orderBy:
      sort === "mostPlayed"
        ? [{ playCount: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }],
    take,
    skip,
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: {
          lyricSyncs: true,
        },
      },
    },
  });

  return contents.map((content) => ({
    id: content.id,
    title: content.title,
    artist: content.artist,
    category: content.category,
    youtubeVideoId: content.youtubeVideoId,
    thumbnailUrl: content.thumbnailUrl,
    difficulty: content.difficulty,
    playCount: content.playCount,
    createdAt: content.createdAt,
    creator: content.creator,
    lyricLineCount: content._count.lyricSyncs,
  }));
}

export async function getGlobalAverageSpmLeaderboard(
  limit = 10,
  client: SocialClient = prisma,
): Promise<GlobalLeaderboardEntry[]> {
  if (client === prisma) {
    return getCachedValue({
      key: `leaderboard:global-average-spm:${limit}`,
      ttlMs: LEADERBOARD_CACHE_TTL_MS,
      fetcher: () => queryGlobalAverageSpmLeaderboard(limit, client),
    });
  }

  return queryGlobalAverageSpmLeaderboard(limit, client);
}

async function queryGlobalAverageSpmLeaderboard(
  limit: number,
  client: SocialClient,
): Promise<GlobalLeaderboardEntry[]> {
  const groupedSessions = await client.gameSession.groupBy({
    by: ["userId"],
    where: {
      strokesPerMinute: {
        gt: 0,
      },
    },
    _avg: {
      strokesPerMinute: true,
      wordsPerMinute: true,
    },
    _count: {
      _all: true,
    },
    orderBy: {
      _avg: {
        strokesPerMinute: "desc",
      },
    },
    take: limit,
  });
  const users = await client.user.findMany({
    where: {
      id: {
        in: groupedSessions.map((session) => session.userId),
      },
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  });
  const usersById = new Map(users.map((user) => [user.id, user]));

  return groupedSessions.map((session, index) => {
    const user = usersById.get(session.userId);

    return {
      rank: index + 1,
      userId: session.userId,
      username: user?.username ?? "unknown",
      displayName: user?.displayName ?? null,
      avatarUrl: user?.avatarUrl ?? null,
      averageStrokesPerMinute: roundMetric(session._avg.strokesPerMinute ?? 0),
      averageWordsPerMinute: roundMetric(session._avg.wordsPerMinute ?? 0),
      sessionCount: session._count._all,
    };
  });
}

export async function getContentScoreLeaderboard(
  contentId: string,
  limit = 10,
  client: SocialClient = prisma,
): Promise<ContentLeaderboardEntry[]> {
  if (client === prisma) {
    return getCachedValue({
      key: `leaderboard:content-score:${contentId}:${limit}`,
      ttlMs: LEADERBOARD_CACHE_TTL_MS,
      fetcher: () => queryContentScoreLeaderboard(contentId, limit, client),
    });
  }

  return queryContentScoreLeaderboard(contentId, limit, client);
}

async function queryContentScoreLeaderboard(
  contentId: string,
  limit: number,
  client: SocialClient,
): Promise<ContentLeaderboardEntry[]> {
  const sessions = await client.gameSession.findMany({
    where: {
      contentId,
    },
    orderBy: [{ score: "desc" }, { accuracy: "desc" }, { strokesPerMinute: "desc" }],
    take: limit,
    select: {
      score: true,
      accuracy: true,
      strokesPerMinute: true,
      wordsPerMinute: true,
      startedAt: true,
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });

  return sessions.map((session, index) => ({
    rank: index + 1,
    userId: session.user.id,
    username: session.user.username,
    displayName: session.user.displayName,
    avatarUrl: session.user.avatarUrl,
    score: session.score,
    accuracy: roundMetric(session.accuracy),
    strokesPerMinute: roundMetric(session.strokesPerMinute),
    wordsPerMinute: roundMetric(session.wordsPerMinute),
    playedAt: session.startedAt,
  }));
}

function roundMetric(value: number): number {
  return Math.round(value * 100) / 100;
}
