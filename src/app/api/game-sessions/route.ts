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
  lineResults?: Array<{
    lyricSyncId?: unknown;
    lyricLineIndex?: unknown;
    japaneseText?: unknown;
    expectedInput?: unknown;
    submittedInput?: unknown;
    startedVideoTimestampMs?: unknown;
    completedVideoTimestampMs?: unknown;
    startedSessionTimestampMs?: unknown;
    completedSessionTimestampMs?: unknown;
    responseDelayMs?: unknown;
    durationMs?: unknown;
    typoCount?: unknown;
    strokeCount?: unknown;
    isSuccess?: unknown;
    isDifficult?: unknown;
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
  const lineResults = Array.isArray(body.lineResults) ? body.lineResults.slice(0, 500) : [];
  const existingLyricSyncIds = await getExistingLyricSyncIds(
    [
      ...typoLogs.map((typoLog) => getString(typoLog.lyricSyncId)),
      ...lineResults.map((lineResult) => getString(lineResult.lyricSyncId)),
    ].filter(Boolean) as string[],
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

    const sanitizedLineResults = sanitizeLineResults({
      lineResults,
      sessionId: session.id,
      existingLyricSyncIds,
    });

    if (sanitizedLineResults.length > 0) {
      await tx.gameSessionLineResult.createMany({
        data: sanitizedLineResults,
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

function sanitizeLineResults({
  lineResults,
  sessionId,
  existingLyricSyncIds,
}: {
  lineResults: NonNullable<SaveGameSessionBody["lineResults"]>;
  sessionId: string;
  existingLyricSyncIds: Set<string>;
}) {
  const seenLineIndexes = new Set<number>();

  return lineResults
    .map((lineResult, fallbackIndex) => {
      const lyricSyncId = getString(lineResult.lyricSyncId);
      const lineIndex = clampInteger(lineResult.lyricLineIndex, 0, 100_000);
      const japaneseText = getString(lineResult.japaneseText)?.slice(0, 4000) ?? "";
      const expectedInput = getString(lineResult.expectedInput)?.slice(0, 4000) ?? "";
      const submittedInput = getString(lineResult.submittedInput)?.slice(0, 4000) ?? "";
      const typoCount = clampInteger(lineResult.typoCount, 0, 10_000);
      const strokeCount = clampInteger(lineResult.strokeCount, 0, 100_000);
      const responseDelayMs = getOptionalClampedInteger(lineResult.responseDelayMs, 0, 24 * 60 * 60 * 1000);
      const durationMs = getOptionalClampedInteger(lineResult.durationMs, 0, 24 * 60 * 60 * 1000);

      return {
        gameSessionId: sessionId,
        lyricSyncId: lyricSyncId && existingLyricSyncIds.has(lyricSyncId) ? lyricSyncId : null,
        lineIndex: Number.isFinite(lineIndex) ? lineIndex : fallbackIndex,
        japaneseText,
        expectedInput,
        submittedInput,
        startedVideoTimestampMs: getOptionalClampedInteger(lineResult.startedVideoTimestampMs, 0, 24 * 60 * 60 * 1000),
        completedVideoTimestampMs: getOptionalClampedInteger(lineResult.completedVideoTimestampMs, 0, 24 * 60 * 60 * 1000),
        startedSessionTimestampMs: getOptionalClampedInteger(lineResult.startedSessionTimestampMs, 0, 24 * 60 * 60 * 1000),
        completedSessionTimestampMs: getOptionalClampedInteger(lineResult.completedSessionTimestampMs, 0, 24 * 60 * 60 * 1000),
        responseDelayMs,
        durationMs,
        typoCount,
        strokeCount,
        isSuccess: lineResult.isSuccess === true,
        isDifficult: lineResult.isDifficult === true || typoCount > 0 || lineResult.isSuccess !== true || (responseDelayMs ?? 0) > 3500,
      };
    })
    .filter((lineResult) => lineResult.japaneseText || lineResult.expectedInput || lineResult.submittedInput)
    .filter((lineResult) => {
      if (seenLineIndexes.has(lineResult.lineIndex)) {
        return false;
      }

      seenLineIndexes.add(lineResult.lineIndex);
      return true;
    });
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

function getOptionalClampedInteger(value: unknown, min: number, max: number): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const numberValue = Math.round(Number(value));

  if (!Number.isFinite(numberValue)) {
    return null;
  }

  return Math.min(Math.max(numberValue, min), max);
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
