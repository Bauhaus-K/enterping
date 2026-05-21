import { NextResponse } from "next/server";

import { getCurrentUser } from "../../../../lib/auth";
import { createQuizBattleRoom, getOpenQuizBattleRooms } from "../../../../lib/quizBattle";
import { parseQuizCategory } from "../../../../lib/quizData";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const rooms = await getOpenQuizBattleRooms(category ? parseQuizCategory(category) : undefined);

  return NextResponse.json({ rooms });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Login is required to create a battle room." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { category?: string } | null;
  const category = parseQuizCategory(body?.category);
  const room = await createQuizBattleRoom({
    category,
    hostUserId: currentUser.id,
  });

  return NextResponse.json({ room });
}
