-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ContentCategory" AS ENUM ('JPOP', 'ANIME', 'VOCALOID', 'GAME', 'DRAMA', 'CUSTOM');

-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('LISTEN_AND_TYPE_LYRICS', 'LISTEN_AND_GUESS');

-- CreateEnum
CREATE TYPE "InputMode" AS ENUM ('ROMAJI', 'KOREAN_PRONUNCIATION');

-- CreateEnum
CREATE TYPE "RewardKind" AS ENUM ('BADGE', 'TITLE');

-- CreateEnum
CREATE TYPE "RewardMetric" AS ENUM ('TOTAL_PLAYTIME_MS', 'LOGIN_STREAK', 'ACCURACY_STREAK');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "totalPlaytimeMs" INTEGER NOT NULL DEFAULT 0,
    "consecutiveLoginDays" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT,
    "youtubeVideoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "category" "ContentCategory" NOT NULL,
    "thumbnailUrl" TEXT,
    "durationMs" INTEGER,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isUgc" BOOLEAN NOT NULL DEFAULT true,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LyricSync" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "lineIndex" INTEGER NOT NULL,
    "startMs" INTEGER NOT NULL,
    "endMs" INTEGER,
    "japaneseText" TEXT NOT NULL,
    "romajiText" TEXT NOT NULL,
    "koreanPronunciationText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LyricSync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "gameMode" "GameMode" NOT NULL,
    "inputMode" "InputMode" NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "strokesPerMinute" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "wordsPerMinute" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalStrokes" INTEGER NOT NULL DEFAULT 0,
    "correctStrokes" INTEGER NOT NULL DEFAULT 0,
    "incorrectStrokes" INTEGER NOT NULL DEFAULT 0,
    "playtimeMs" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypoLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameSessionId" TEXT NOT NULL,
    "lyricSyncId" TEXT,
    "targetCharacter" TEXT NOT NULL,
    "inputtedCharacter" TEXT NOT NULL,
    "targetTextPosition" INTEGER,
    "videoTimestampMs" INTEGER,
    "sessionTimestampMs" INTEGER NOT NULL,
    "contextualPreviousWord" TEXT,
    "contextualNextWord" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TypoLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kind" "RewardKind" NOT NULL,
    "metric" "RewardMetric" NOT NULL,
    "threshold" INTEGER NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "triggerValue" INTEGER,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "Content_creatorId_idx" ON "Content"("creatorId");

-- CreateIndex
CREATE INDEX "Content_youtubeVideoId_idx" ON "Content"("youtubeVideoId");

-- CreateIndex
CREATE INDEX "Content_category_idx" ON "Content"("category");

-- CreateIndex
CREATE INDEX "Content_isPublished_isUgc_idx" ON "Content"("isPublished", "isUgc");

-- CreateIndex
CREATE INDEX "Content_playCount_idx" ON "Content"("playCount");

-- CreateIndex
CREATE INDEX "Content_createdAt_idx" ON "Content"("createdAt");

-- CreateIndex
CREATE INDEX "Content_title_idx" ON "Content"("title");

-- CreateIndex
CREATE INDEX "LyricSync_contentId_startMs_idx" ON "LyricSync"("contentId", "startMs");

-- CreateIndex
CREATE UNIQUE INDEX "LyricSync_contentId_lineIndex_key" ON "LyricSync"("contentId", "lineIndex");

-- CreateIndex
CREATE INDEX "GameSession_userId_startedAt_idx" ON "GameSession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "GameSession_contentId_idx" ON "GameSession"("contentId");

-- CreateIndex
CREATE INDEX "TypoLog_userId_createdAt_idx" ON "TypoLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TypoLog_gameSessionId_idx" ON "TypoLog"("gameSessionId");

-- CreateIndex
CREATE INDEX "TypoLog_lyricSyncId_idx" ON "TypoLog"("lyricSyncId");

-- CreateIndex
CREATE INDEX "TypoLog_targetCharacter_idx" ON "TypoLog"("targetCharacter");

-- CreateIndex
CREATE UNIQUE INDEX "Reward_slug_key" ON "Reward"("slug");

-- CreateIndex
CREATE INDEX "Reward_kind_idx" ON "Reward"("kind");

-- CreateIndex
CREATE INDEX "Reward_metric_idx" ON "Reward"("metric");

-- CreateIndex
CREATE INDEX "UserReward_userId_unlockedAt_idx" ON "UserReward"("userId", "unlockedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserReward_userId_rewardId_key" ON "UserReward"("userId", "rewardId");

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LyricSync" ADD CONSTRAINT "LyricSync_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypoLog" ADD CONSTRAINT "TypoLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypoLog" ADD CONSTRAINT "TypoLog_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypoLog" ADD CONSTRAINT "TypoLog_lyricSyncId_fkey" FOREIGN KEY ("lyricSyncId") REFERENCES "LyricSync"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReward" ADD CONSTRAINT "UserReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReward" ADD CONSTRAINT "UserReward_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

