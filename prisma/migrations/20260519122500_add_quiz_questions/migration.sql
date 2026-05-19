CREATE TYPE "QuizCategory" AS ENUM ('JPOP', 'ANIME');

CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "QuizCategory" NOT NULL,
    "prompt" TEXT NOT NULL,
    "clue" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "acceptedAnswers" TEXT[],
    "workTitle" TEXT NOT NULL,
    "artistOrStudio" TEXT NOT NULL,
    "tags" TEXT[],
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "youtubeVideoId" TEXT,
    "audioStartSeconds" INTEGER,
    "audioDurationSeconds" INTEGER,
    "thumbnailUrl" TEXT,
    "revealImageUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuizQuestion_slug_key" ON "QuizQuestion"("slug");
CREATE INDEX "QuizQuestion_category_isPublished_sortOrder_idx" ON "QuizQuestion"("category", "isPublished", "sortOrder");
CREATE INDEX "QuizQuestion_slug_idx" ON "QuizQuestion"("slug");
CREATE INDEX "QuizQuestion_createdAt_idx" ON "QuizQuestion"("createdAt");
