-- CreateEnum
CREATE TYPE "QuizBattleRoomStatus" AS ENUM ('OPEN', 'PLAYING', 'FINISHED');

-- CreateTable
CREATE TABLE "QuizBattleRoom" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "QuizCategory" NOT NULL,
    "status" "QuizBattleRoomStatus" NOT NULL DEFAULT 'OPEN',
    "hostUserId" TEXT,
    "maxPlayers" INTEGER NOT NULL DEFAULT 4,
    "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "QuizBattleRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizBattleParticipant" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
    "isFinished" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizBattleParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuizBattleRoom_code_key" ON "QuizBattleRoom"("code");

-- CreateIndex
CREATE INDEX "QuizBattleRoom_category_status_updatedAt_idx" ON "QuizBattleRoom"("category", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "QuizBattleRoom_hostUserId_idx" ON "QuizBattleRoom"("hostUserId");

-- CreateIndex
CREATE INDEX "QuizBattleRoom_expiresAt_idx" ON "QuizBattleRoom"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuizBattleParticipant_roomId_userId_key" ON "QuizBattleParticipant"("roomId", "userId");

-- CreateIndex
CREATE INDEX "QuizBattleParticipant_roomId_score_idx" ON "QuizBattleParticipant"("roomId", "score");

-- CreateIndex
CREATE INDEX "QuizBattleParticipant_userId_updatedAt_idx" ON "QuizBattleParticipant"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "QuizBattleParticipant_lastSeenAt_idx" ON "QuizBattleParticipant"("lastSeenAt");

-- AddForeignKey
ALTER TABLE "QuizBattleRoom" ADD CONSTRAINT "QuizBattleRoom_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizBattleParticipant" ADD CONSTRAINT "QuizBattleParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "QuizBattleRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizBattleParticipant" ADD CONSTRAINT "QuizBattleParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
