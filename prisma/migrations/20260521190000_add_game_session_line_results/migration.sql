-- CreateTable
CREATE TABLE "GameSessionLineResult" (
    "id" TEXT NOT NULL,
    "gameSessionId" TEXT NOT NULL,
    "lyricSyncId" TEXT,
    "lineIndex" INTEGER NOT NULL,
    "japaneseText" TEXT NOT NULL,
    "expectedInput" TEXT NOT NULL,
    "submittedInput" TEXT NOT NULL,
    "startedVideoTimestampMs" INTEGER,
    "completedVideoTimestampMs" INTEGER,
    "startedSessionTimestampMs" INTEGER,
    "completedSessionTimestampMs" INTEGER,
    "responseDelayMs" INTEGER,
    "durationMs" INTEGER,
    "typoCount" INTEGER NOT NULL DEFAULT 0,
    "strokeCount" INTEGER NOT NULL DEFAULT 0,
    "isSuccess" BOOLEAN NOT NULL DEFAULT false,
    "isDifficult" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameSessionLineResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameSessionLineResult_gameSessionId_lineIndex_key" ON "GameSessionLineResult"("gameSessionId", "lineIndex");

-- CreateIndex
CREATE INDEX "GameSessionLineResult_gameSessionId_idx" ON "GameSessionLineResult"("gameSessionId");

-- CreateIndex
CREATE INDEX "GameSessionLineResult_lyricSyncId_idx" ON "GameSessionLineResult"("lyricSyncId");

-- CreateIndex
CREATE INDEX "GameSessionLineResult_isDifficult_idx" ON "GameSessionLineResult"("isDifficult");

-- CreateIndex
CREATE INDEX "GameSessionLineResult_lineIndex_idx" ON "GameSessionLineResult"("lineIndex");

-- AddForeignKey
ALTER TABLE "GameSessionLineResult" ADD CONSTRAINT "GameSessionLineResult_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSessionLineResult" ADD CONSTRAINT "GameSessionLineResult_lyricSyncId_fkey" FOREIGN KEY ("lyricSyncId") REFERENCES "LyricSync"("id") ON DELETE SET NULL ON UPDATE CASCADE;
