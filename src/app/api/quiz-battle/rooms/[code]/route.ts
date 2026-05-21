import { NextResponse } from "next/server";

import { getCurrentUser } from "../../../../../lib/auth";
import {
  getQuizBattleRoomState,
  joinQuizBattleRoom,
  updateQuizBattleParticipant,
} from "../../../../../lib/quizBattle";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    code: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { code } = await context.params;
  const room = await getQuizBattleRoomState(code);

  if (!room) {
    return NextResponse.json({ error: "Battle room was not found." }, { status: 404 });
  }

  return NextResponse.json({ room });
}

export async function POST(_request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Login is required to join a battle room." }, { status: 401 });
  }

  const { code } = await context.params;

  try {
    const room = await joinQuizBattleRoom({
      code,
      userId: currentUser.id,
    });

    if (!room) {
      return NextResponse.json({ error: "Battle room was not found." }, { status: 404 });
    }

    return NextResponse.json({ room });
  } catch (error) {
    if (error instanceof Error && error.message === "ROOM_FULL") {
      return NextResponse.json({ error: "This battle room is full." }, { status: 409 });
    }

    throw error;
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Login is required to sync battle score." }, { status: 401 });
  }

  const { code } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    score?: unknown;
    correctCount?: unknown;
    wrongCount?: unknown;
    streak?: unknown;
    currentQuestionIndex?: unknown;
    isFinished?: unknown;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const room = await updateQuizBattleParticipant({
    code,
    userId: currentUser.id,
    score: clampInteger(body.score, 0, 10_000_000),
    correctCount: clampInteger(body.correctCount, 0, 10_000),
    wrongCount: clampInteger(body.wrongCount, 0, 10_000),
    streak: clampInteger(body.streak, 0, 10_000),
    currentQuestionIndex: clampInteger(body.currentQuestionIndex, 0, 10_000),
    isFinished: body.isFinished === true,
  });

  if (!room) {
    return NextResponse.json({ error: "Battle room was not found." }, { status: 404 });
  }

  return NextResponse.json({ room });
}

function clampInteger(value: unknown, min: number, max: number): number {
  const numberValue = Math.round(Number(value));

  if (!Number.isFinite(numberValue)) {
    return min;
  }

  return Math.min(Math.max(numberValue, min), max);
}
