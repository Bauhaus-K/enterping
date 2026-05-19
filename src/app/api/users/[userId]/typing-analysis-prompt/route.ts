import { NextResponse } from "next/server";

import { buildTypingAnalysisPrompt } from "../../../../../lib/aiAnalysisPrompt";
import { prisma } from "../../../../../lib/prisma";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    userId: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { userId } = await context.params;

  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const typoLogs = await prisma.typoLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      lyricSync: {
        select: {
          japaneseText: true,
          romajiText: true,
          koreanPronunciationText: true,
          lineIndex: true,
          content: {
            select: {
              title: true,
              artist: true,
            },
          },
        },
      },
    },
  });

  const prompt = buildTypingAnalysisPrompt({
    userId: user.id,
    username: user.username,
    typoLogs,
  });

  return NextResponse.json({
    userId: user.id,
    typoLogCount: typoLogs.length,
    prompt,
  });
}
