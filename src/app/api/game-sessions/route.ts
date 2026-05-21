import { ContentCategory, GameMode, InputMode } from "@prisma/client";
import { NextResponse } from "next/server";

import { getCurrentUser } from "../../../lib/auth";
import { clearInMemoryCache } from "../../../lib/cache";
import { prisma } from "../../../lib/prisma";
import { unlockRewardsForUser } from "../../../lib/rewards";

export const runtime = "nodejs";

interface SaveGameSessionBody {
  contentId?: unknown;
  content?: {
    id?: unknown;
    youtubeVideoId?: unknown;
    title?: unknown;
    artist?: unknown;
    category?: unknown;
    thumbnailUrl?: unknown;
    syncOffsetMs?: unknown;
  };
  gameMode?: unknown;
  inputMode?: unknown;
  score?: unknown;
  accuracy?: unknown;
  strokesPerMinute?: unknown;
  wordsPerMinute?: unknown;
  totalStrokes?: unknown;
  correctStrokes?: unknown;
  incorrectStrokes?: unknown;
  playtimeMs?: unknown;
  startedAt?: unknown;
  endedAt?: unknown;
  typoLogs?: Array<{
    lyricSyncId?: unknown;
    targetCharacter?: unknown;
    inputtedCharacter?: unknown;
    targetTextPosition?: unknown;
    videoTimestampMs?: unknown;
    sessionTimestampMs?: unknown;
    contextualPreviousWord?: unknown;
    contextualNextWord?: unknown;
  }>;
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Login is required to save game sessions." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as SaveGameSessionBody | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const contentId = getString(body.contentId) ?? getString(body.content?.id);
  const title = getString(body.content?.title);

  if (!contentId || !title) {
    return NextResponse.json({ error: "contentId and content.title are required." }, { status: 400 });
  }

  const gameMode = parseGameMode(body.gameMode);
  const inputMode = parseInputMode(body.inputMode);
  const playtimeMs = clampInteger(body.playtimeMs, 0, 24 * 60 * 60 * 1000);
  const startedAt = parseDate(body.startedAt) ?? new Date();
  const endedAt = parseDate(body.endedAt) ?? new Date();
  const typoLogs = Array.isArray(body.typoLogs) ? body.typoLogs.slice(0, 300) : [];
  const existingLyricSyncIds = await getExistingLyricSyncIds(
    typoLogs.map((typoLog) => getString(typoLog.lyricSyncId)).filter(Boolean) as string[],
  );

  const savedSession = await prisma.$transaction(async (tx) => {
    await tx.content.upsert({
      where: {
        id: contentId,
      },
      update: {
        title,
        artist: getNullableString(body.content?.artist),
        category: parseContentCategory(body.content?.category),
        youtubeVideoId: getString(body.content?.youtubeVideoId) ?? `enterping-${contentId}`,
        thumbnailUrl: getNullableString(body.content?.thumbnailUrl),
        syncOffsetMs: clampInteger(body.content?.syncOffsetMs, -300_000, 300_000),
        isPublished: true,
        playCount: {
          increment: 1,
        },
      },
      create: {
        id: contentId,
        title,
        artist: getNullableString(body.content?.artist),
        category: parseContentCategory(body.content?.category),
        youtubeVideoId: getString(body.content?.youtubeVideoId) ?? `enterping-${contentId}`,
        thumbnailUrl: getNullableString(body.content?.thumbnailUrl),
        syncOffsetMs: clampInteger(body.content?.syncOffsetMs, -300_000, 300_000),
        isPublished: true,
        isUgc: false,
        playCount: 1,
      },
    });

    const session = await tx.gameSession.create({
      data: {
        userId: currentUser.id,
        contentId,
        gameMode,
        inputMode,
        score: clampInteger(body.score, 0, 10_000_000),
        accuracy: clampNumber(body.accuracy, 0, 100),
        strokesPerMinute: clampNumber(body.strokesPerMinute, 0, 3000),
        wordsPerMinute: clampNumber(body.wordsPerMinute, 0, 600),
        totalStrokes: clampInteger(body.totalStrokes, 0, 1_000_000),
        correctStrokes: clampInteger(body.correctStrokes, 0, 1_000_000),
        incorrectStrokes: clampInteger(body.incorrectStrokes, 0, 1_000_000),
        playtimeMs,
        startedAt,
        endedAt,
      },
    });

    if (typoLogs.length > 0) {
      await tx.typoLog.createMany({
        data: typoLogs
          .map((typoLog) => {
            const lyricSyncId = getString(typoLog.lyricSyncId);

            return {
              userId: currentUser.id,
              gameSessionId: session.id,
              lyricSyncId: lyricSyncId && existingLyricSyncIds.has(lyricSyncId) ? lyricSyncId : null,
              targetCharacter: getString(typoLog.targetCharacter)?.slice(0, 16) ?? "",
              inputtedCharacter: getString(typoLog.inputtedCharacter)?.slice(0, 16) ?? "",
              targetTextPosition: getOptionalInteger(typoLog.targetTextPosition),
              videoTimestampMs: getOptionalInteger(typoLog.videoTimestampMs),
              sessionTimestampMs: clampInteger(typoLog.sessionTimestampMs, 0, 24 * 60 * 60 * 1000),
              contextualPreviousWord: getNullableString(typoLog.contextualPreviousWord),
              contextualNextWord: getNullableString(typoLog.contextualNextWord),
            };
          })
          .filter((typoLog) => typoLog.targetCharacter || typoLog.inputtedCharacter),
      });
    }

    await tx.user.update({
      where: {
        id: currentUser.id,
      },
      data: {
        totalPlaytimeMs: {
          increment: playtimeMs,
        },
      },
    });

    return session;
  });

  const unlockedRewards = await unlockRewardsForUser({ userId: currentUser.id }).catch((error) => {
    console.warn("[Enterping][Session] Failed to unlock rewards after session save.", error);
    return [];
  });
  clearInMemoryCache("leaderboard:");

  return NextResponse.json({
    session: {
      id: savedSession.id,
      score: savedSession.score,
      accuracy: savedSession.accuracy,
      strokesPerMinute: savedSession.strokesPerMinute,
    },
    unlockedRewards,
  });
}

async function getExistingLyricSyncIds(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) {
    return new Set();
  }

  const lyricSyncs = await prisma.lyricSync.findMany({
    where: {
      id: {
        in: [...new Set(ids)],
      },
    },
    select: {
      id: true,
    },
  });

  return new Set(lyricSyncs.map((lyricSync) => lyricSync.id));
}

function parseGameMode(value: unknown): GameMode {
  return value === GameMode.LISTEN_AND_GUESS ? GameMode.LISTEN_AND_GUESS : GameMode.LISTEN_AND_TYPE_LYRICS;
}

function parseInputMode(value: unknown): InputMode {
  return value === InputMode.KOREAN_PRONUNCIATION ? InputMode.KOREAN_PRONUNCIATION : InputMode.ROMAJI;
}

function parseContentCategory(value: unknown): ContentCategory {
  if (typeof value !== "string") {
    return ContentCategory.CUSTOM;
  }

  const normalizedValue = value.toUpperCase();
  return normalizedValue in ContentCategory
    ? ContentCategory[normalizedValue as keyof typeof ContentCategory]
    : ContentCategory.CUSTOM;
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getNullableString(value: unknown): string | null {
  return getString(value) ?? null;
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getOptionalInteger(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return Math.round(Number(value));
}

function clampInteger(value: unknown, min: number, max: number): number {
  const numberValue = Math.round(Number(value));

  if (!Number.isFinite(numberValue)) {
    return min;
  }

  return Math.min(Math.max(numberValue, min), max);
}

function clampNumber(value: unknown, min: number, max: number): number {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return min;
  }

  return Math.min(Math.max(numberValue, min), max);
}
