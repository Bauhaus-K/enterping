import { PrismaClient } from "@prisma/client";

import { QUIZ_ITEMS } from "../src/lib/quizData";

const prisma = new PrismaClient();

async function main() {
  for (const [index, item] of QUIZ_ITEMS.entries()) {
    await prisma.quizQuestion.upsert({
      where: { slug: item.id },
      update: {
        category: item.category,
        prompt: item.prompt,
        clue: item.clue,
        answer: item.answer,
        acceptedAnswers: item.acceptedAnswers,
        workTitle: item.workTitle,
        artistOrStudio: item.artistOrStudio,
        tags: item.tags,
        difficulty: item.difficulty,
        sortOrder: index,
        youtubeVideoId: item.audioSnippet?.youtubeVideoId,
        audioStartSeconds: item.audioSnippet?.startSeconds,
        audioDurationSeconds: item.audioSnippet?.durationSeconds,
        thumbnailUrl: item.thumbnailUrl,
        revealImageUrl: item.revealImageUrl,
        isPublished: true,
      },
      create: {
        slug: item.id,
        category: item.category,
        prompt: item.prompt,
        clue: item.clue,
        answer: item.answer,
        acceptedAnswers: item.acceptedAnswers,
        workTitle: item.workTitle,
        artistOrStudio: item.artistOrStudio,
        tags: item.tags,
        difficulty: item.difficulty,
        sortOrder: index,
        youtubeVideoId: item.audioSnippet?.youtubeVideoId,
        audioStartSeconds: item.audioSnippet?.startSeconds,
        audioDurationSeconds: item.audioSnippet?.durationSeconds,
        thumbnailUrl: item.thumbnailUrl,
        revealImageUrl: item.revealImageUrl,
        isPublished: true,
      },
    });
  }

  console.log(`[Enterping][Seed] ${QUIZ_ITEMS.length} quiz questions upserted.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
