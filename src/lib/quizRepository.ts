import "server-only";

import type { QuizQuestion } from "@prisma/client";

import { prisma } from "./prisma";
import {
  getQuizItemsByCategory,
  type QuizCategory,
  type QuizItem,
} from "./quizData";

export async function getPublishedQuizItemsByCategory(category: QuizCategory): Promise<QuizItem[]> {
  try {
    const questions = await prisma.quizQuestion.findMany({
      where: {
        category,
        isPublished: true,
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "asc" },
      ],
    });

    if (questions.length > 0) {
      return questions.map(mapQuizQuestionToItem);
    }
  } catch (error) {
    console.warn("[Enterping][Quiz] Failed to load DB quiz items. Falling back to bundled data.", error);
  }

  return getQuizItemsByCategory(category);
}

export function mapQuizQuestionToItem(question: QuizQuestion): QuizItem {
  return {
    id: question.slug,
    category: question.category,
    prompt: question.prompt,
    clue: question.clue,
    answer: question.answer,
    acceptedAnswers: question.acceptedAnswers,
    workTitle: question.workTitle,
    artistOrStudio: question.artistOrStudio,
    tags: question.tags,
    difficulty: question.difficulty,
    audioSnippet: question.youtubeVideoId
      ? {
          youtubeVideoId: question.youtubeVideoId,
          startSeconds: question.audioStartSeconds ?? 0,
          durationSeconds: question.audioDurationSeconds ?? 5,
        }
      : undefined,
    thumbnailUrl: question.thumbnailUrl ?? undefined,
    revealImageUrl: question.revealImageUrl ?? undefined,
  };
}
