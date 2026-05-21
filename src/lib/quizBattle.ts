import { QuizBattleRoomStatus, type QuizCategory } from "@prisma/client";

import { prisma } from "./prisma";

export const QUIZ_BATTLE_ROOM_TTL_MS = 1000 * 60 * 60 * 3;

export interface QuizBattleRoomState {
  id: string;
  code: string;
  title: string;
  category: QuizCategory;
  status: QuizBattleRoomStatus;
  maxPlayers: number;
  currentQuestionIndex: number;
  host: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  participants: QuizBattleParticipantState[];
  updatedAt: string;
}

export interface QuizBattleParticipantState {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  score: number;
  correctCount: number;
  wrongCount: number;
  streak: number;
  currentQuestionIndex: number;
  isFinished: boolean;
  lastSeenAt: string;
}

export async function getOpenQuizBattleRooms(category?: QuizCategory) {
  const rooms = await prisma.quizBattleRoom.findMany({
    where: {
      status: {
        in: [QuizBattleRoomStatus.OPEN, QuizBattleRoomStatus.PLAYING],
      },
      ...(category ? { category } : {}),
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: {
      host: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: [{ score: "desc" }, { updatedAt: "asc" }],
      },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 12,
  });

  return rooms.map(mapRoomState);
}

export async function createQuizBattleRoom({
  category,
  hostUserId,
}: {
  category: QuizCategory;
  hostUserId: string;
}) {
  const code = await createUniqueRoomCode(category);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + QUIZ_BATTLE_ROOM_TTL_MS);
  const title = category === "ANIME" ? "애니메이션 실시간 대전" : "JPOP 실시간 대전";

  const room = await prisma.quizBattleRoom.create({
    data: {
      code,
      title,
      category,
      hostUserId,
      expiresAt,
      participants: {
        create: {
          userId: hostUserId,
          lastSeenAt: now,
        },
      },
    },
    include: roomInclude,
  });

  return mapRoomState(room);
}

export async function joinQuizBattleRoom({
  code,
  userId,
}: {
  code: string;
  userId: string;
}) {
  const room = await prisma.quizBattleRoom.findUnique({
    where: {
      code: code.toUpperCase(),
    },
    include: {
      participants: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!room) {
    return null;
  }

  const alreadyJoined = room.participants.some((participant) => participant.userId === userId);
  if (!alreadyJoined && room.participants.length >= room.maxPlayers) {
    throw new Error("ROOM_FULL");
  }

  await prisma.quizBattleParticipant.upsert({
    where: {
      roomId_userId: {
        roomId: room.id,
        userId,
      },
    },
    update: {
      lastSeenAt: new Date(),
    },
    create: {
      roomId: room.id,
      userId,
      lastSeenAt: new Date(),
    },
  });

  if (room.status === QuizBattleRoomStatus.OPEN && room.participants.length > 0) {
    await prisma.quizBattleRoom.update({
      where: {
        id: room.id,
      },
      data: {
        status: QuizBattleRoomStatus.PLAYING,
      },
    });
  }

  return getQuizBattleRoomState(code);
}

export async function getQuizBattleRoomState(code: string) {
  const room = await prisma.quizBattleRoom.findUnique({
    where: {
      code: code.toUpperCase(),
    },
    include: roomInclude,
  });

  return room ? mapRoomState(room) : null;
}

export async function updateQuizBattleParticipant({
  code,
  userId,
  score,
  correctCount,
  wrongCount,
  streak,
  currentQuestionIndex,
  isFinished,
}: {
  code: string;
  userId: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  streak: number;
  currentQuestionIndex: number;
  isFinished: boolean;
}) {
  const room = await prisma.quizBattleRoom.findUnique({
    where: {
      code: code.toUpperCase(),
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!room) {
    return null;
  }

  await prisma.quizBattleParticipant.upsert({
    where: {
      roomId_userId: {
        roomId: room.id,
        userId,
      },
    },
    update: {
      score,
      correctCount,
      wrongCount,
      streak,
      currentQuestionIndex,
      isFinished,
      lastSeenAt: new Date(),
    },
    create: {
      roomId: room.id,
      userId,
      score,
      correctCount,
      wrongCount,
      streak,
      currentQuestionIndex,
      isFinished,
      lastSeenAt: new Date(),
    },
  });

  await prisma.quizBattleRoom.update({
    where: {
      id: room.id,
    },
    data: {
      status: isFinished ? room.status : QuizBattleRoomStatus.PLAYING,
      currentQuestionIndex,
    },
  });

  return getQuizBattleRoomState(code);
}

const roomInclude = {
  host: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  participants: {
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: [{ score: "desc" as const }, { updatedAt: "asc" as const }],
  },
};

function mapRoomState(room: {
  id: string;
  code: string;
  title: string;
  category: QuizCategory;
  status: QuizBattleRoomStatus;
  maxPlayers: number;
  currentQuestionIndex: number;
  updatedAt: Date;
  host: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  participants: Array<{
    score: number;
    correctCount: number;
    wrongCount: number;
    streak: number;
    currentQuestionIndex: number;
    isFinished: boolean;
    lastSeenAt: Date;
    user: {
      id: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
    };
  }>;
}): QuizBattleRoomState {
  return {
    id: room.id,
    code: room.code,
    title: room.title,
    category: room.category,
    status: room.status,
    maxPlayers: room.maxPlayers,
    currentQuestionIndex: room.currentQuestionIndex,
    host: room.host,
    updatedAt: room.updatedAt.toISOString(),
    participants: room.participants.map((participant) => ({
      userId: participant.user.id,
      username: participant.user.username,
      displayName: participant.user.displayName,
      avatarUrl: participant.user.avatarUrl,
      score: participant.score,
      correctCount: participant.correctCount,
      wrongCount: participant.wrongCount,
      streak: participant.streak,
      currentQuestionIndex: participant.currentQuestionIndex,
      isFinished: participant.isFinished,
      lastSeenAt: participant.lastSeenAt.toISOString(),
    })),
  };
}

async function createUniqueRoomCode(category: QuizCategory): Promise<string> {
  const prefix = category === "ANIME" ? "AN" : "JP";

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
    const existingRoom = await prisma.quizBattleRoom.findUnique({
      where: {
        code,
      },
      select: {
        id: true,
      },
    });

    if (!existingRoom) {
      return code;
    }
  }

  return `${prefix}-${Date.now().toString().slice(-6)}`;
}
