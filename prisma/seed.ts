import { ContentCategory, GameMode, InputMode, PrismaClient } from "@prisma/client";

import { buildLemonDemoLyricSyncData } from "../src/lib/lemonDemoLyrics";
import { seedRewardDefinitions } from "../src/lib/rewards";

const prisma = new PrismaClient();
const lemonLyricSyncs = buildLemonDemoLyricSyncData();

const DEMO_USERS = [
  {
    id: "demo-user-haru",
    email: "haru.demo@enterping.local",
    username: "haru_typing",
    displayName: "Haru Typing",
    avatarUrl: null,
    isPremium: false,
    totalPlaytimeMs: 7_920_000,
    consecutiveLoginDays: 8,
  },
  {
    id: "demo-user-mika",
    email: "mika.demo@enterping.local",
    username: "mika_jpop",
    displayName: "Mika J-Pop",
    avatarUrl: null,
    isPremium: true,
    totalPlaytimeMs: 2_340_000,
    consecutiveLoginDays: 3,
  },
  {
    id: "demo-user-ren",
    email: "ren.demo@enterping.local",
    username: "ren_anime",
    displayName: "Ren Anime",
    avatarUrl: null,
    isPremium: false,
    totalPlaytimeMs: 4_620_000,
    consecutiveLoginDays: 5,
  },
];

const CONTENTS = [
  {
    id: "demo-content-jpop-lemon",
    creatorId: "demo-user-mika",
    youtubeVideoId: "SX_ViT4Ra7k",
    title: "Lemon - Full Demo Typing Edit",
    artist: "Kenshi Yonezu",
    category: ContentCategory.JPOP,
    thumbnailUrl: "https://i.ytimg.com/vi/SX_ViT4Ra7k/hqdefault.jpg",
    syncOffsetMs: 0,
    difficulty: 3,
    playCount: 128,
    lyricSyncs: lemonLyricSyncs.map((lyricSync) => ({
      lineIndex: lyricSync.lineIndex,
      startMs: lyricSync.startMs,
      endMs: lyricSync.endMs,
      japaneseText: lyricSync.japaneseText,
      romajiText: lyricSync.romajiText ?? "",
      koreanPronunciationText: lyricSync.koreanPronunciationText ?? "",
    })),
  },
  {
    id: "demo-content-anime-gurenge",
    creatorId: "demo-user-ren",
    youtubeVideoId: "CwkzK-F0Y00",
    title: "Anime Opening Practice - Demo Clip",
    artist: "LiSA",
    category: ContentCategory.ANIME,
    thumbnailUrl: "https://i.ytimg.com/vi/CwkzK-F0Y00/hqdefault.jpg",
    syncOffsetMs: 0,
    difficulty: 4,
    playCount: 94,
    lyricSyncs: [
      {
        lineIndex: 0,
        startMs: 0,
        endMs: 3600,
        japaneseText: "強くなれる理由を知った",
        romajiText: "tsuyoku nareru riyuu wo shitta",
        koreanPronunciationText: "츠요쿠 나레루 리유 오 싯타",
      },
      {
        lineIndex: 1,
        startMs: 3600,
        endMs: 7200,
        japaneseText: "僕を連れて進め",
        romajiText: "boku wo tsurete susume",
        koreanPronunciationText: "보쿠 오 츠레테 스스메",
      },
      {
        lineIndex: 2,
        startMs: 7200,
        endMs: 11000,
        japaneseText: "泥だらけの走馬灯に酔う",
        romajiText: "doro darake no soumatou ni you",
        koreanPronunciationText: "도로 다라케 노 소마토 니 요",
      },
    ],
  },
];

async function main() {
  await seedRewardDefinitions(prisma);

  for (const user of DEMO_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isPremium: user.isPremium,
        totalPlaytimeMs: user.totalPlaytimeMs,
        consecutiveLoginDays: user.consecutiveLoginDays,
        lastLoginAt: new Date(),
      },
      create: {
        ...user,
        passwordHash: "demo-password-hash",
        lastLoginAt: new Date(),
      },
    });
  }

  await prisma.typoLog.deleteMany({
    where: {
      userId: {
        in: DEMO_USERS.map((user) => user.id),
      },
    },
  });

  await prisma.gameSession.deleteMany({
    where: {
      userId: {
        in: DEMO_USERS.map((user) => user.id),
      },
    },
  });

  for (const content of CONTENTS) {
    await prisma.lyricSync.deleteMany({ where: { contentId: content.id } });
    await prisma.content.upsert({
      where: { id: content.id },
      update: {
        creatorId: content.creatorId,
        youtubeVideoId: content.youtubeVideoId,
        title: content.title,
        artist: content.artist,
        category: content.category,
        thumbnailUrl: content.thumbnailUrl,
        syncOffsetMs: content.syncOffsetMs,
        difficulty: content.difficulty,
        isPublished: true,
        isUgc: true,
        playCount: content.playCount,
      },
      create: {
        id: content.id,
        creatorId: content.creatorId,
        youtubeVideoId: content.youtubeVideoId,
        title: content.title,
        artist: content.artist,
        category: content.category,
        thumbnailUrl: content.thumbnailUrl,
        syncOffsetMs: content.syncOffsetMs,
        difficulty: content.difficulty,
        isPublished: true,
        isUgc: true,
        playCount: content.playCount,
      },
    });

    await prisma.lyricSync.createMany({
      data: content.lyricSyncs.map((lyricSync) => ({
        id: `${content.id}-line-${lyricSync.lineIndex}`,
        contentId: content.id,
        ...lyricSync,
      })),
    });
  }

  await createDemoSessionHistory();
  await unlockDemoRewards();

  console.log("Seed complete: 3 users, 2 contents, lyric syncs, sessions, typos, and rewards created.");
}

async function createDemoSessionHistory() {
  const sessions = [
    { accuracy: 88.2, spm: 168, score: 960, contentId: CONTENTS[0].id },
    { accuracy: 90.4, spm: 174, score: 1040, contentId: CONTENTS[1].id },
    { accuracy: 91.1, spm: 182, score: 1125, contentId: CONTENTS[0].id },
    { accuracy: 93.6, spm: 194, score: 1250, contentId: CONTENTS[1].id },
    { accuracy: 94.8, spm: 204, score: 1365, contentId: CONTENTS[0].id },
    { accuracy: 95.2, spm: 211, score: 1480, contentId: CONTENTS[0].id },
    { accuracy: 95.8, spm: 218, score: 1540, contentId: CONTENTS[1].id },
    { accuracy: 96.4, spm: 226, score: 1660, contentId: CONTENTS[0].id },
    { accuracy: 95.9, spm: 221, score: 1620, contentId: CONTENTS[1].id },
    { accuracy: 97.1, spm: 238, score: 1785, contentId: CONTENTS[0].id },
  ];

  for (const [index, session] of sessions.entries()) {
    const startedAt = new Date(Date.now() - (sessions.length - index) * 86_400_000);
    const playtimeMs = 210_000 + index * 12_000;
    const totalStrokes = Math.round((session.spm * playtimeMs) / 60_000);
    const correctStrokes = Math.round(totalStrokes * (session.accuracy / 100));
    const gameSession = await prisma.gameSession.create({
      data: {
        id: `demo-session-haru-${index + 1}`,
        userId: "demo-user-haru",
        contentId: session.contentId,
        gameMode: GameMode.LISTEN_AND_TYPE_LYRICS,
        inputMode: InputMode.ROMAJI,
        score: session.score,
        accuracy: session.accuracy,
        strokesPerMinute: session.spm,
        wordsPerMinute: session.spm / 5,
        totalStrokes,
        correctStrokes,
        incorrectStrokes: totalStrokes - correctStrokes,
        playtimeMs,
        startedAt,
        endedAt: new Date(startedAt.getTime() + playtimeMs),
        createdAt: startedAt,
      },
    });

    if (index < 8) {
      await createTypoLogsForSession(gameSession.id, session.contentId, index, startedAt);
    }
  }

  await createLeaderboardSessionsForOtherUsers();
}

async function createTypoLogsForSession(
  gameSessionId: string,
  contentId: string,
  sessionIndex: number,
  createdAt: Date,
) {
  const typoPatterns = [
    { targetCharacter: "t", inputtedCharacter: "r", contextualPreviousWord: "ma", position: 2 },
    { targetCharacter: "u", inputtedCharacter: "i", contextualPreviousWord: "ts", position: 2 },
    { targetCharacter: "c", inputtedCharacter: "x", contextualPreviousWord: "", position: 0 },
    { targetCharacter: "h", inputtedCharacter: "j", contextualPreviousWord: "c", position: 1 },
    { targetCharacter: "n", inputtedCharacter: "m", contextualPreviousWord: "yu", position: 4 },
  ];

  const lyricSyncId = `${contentId}-line-${sessionIndex % 3}`;
  const count = 3 + (sessionIndex % 4);

  await prisma.typoLog.createMany({
    data: Array.from({ length: count }, (_, index) => {
      const typo = typoPatterns[(index + sessionIndex) % typoPatterns.length];

      return {
        userId: "demo-user-haru",
        gameSessionId,
        lyricSyncId,
        targetCharacter: typo.targetCharacter,
        inputtedCharacter: typo.inputtedCharacter,
        targetTextPosition: typo.position,
        videoTimestampMs: 1600 + index * 740,
        sessionTimestampMs: 1800 + index * 810,
        contextualPreviousWord: typo.contextualPreviousWord,
        contextualNextWord: null,
        createdAt: new Date(createdAt.getTime() + index * 10_000),
      };
    }),
  });
}

async function createLeaderboardSessionsForOtherUsers() {
  const otherSessions = [
    { userId: "demo-user-mika", spm: 244, accuracy: 94.2, score: 1810, contentId: CONTENTS[0].id },
    { userId: "demo-user-mika", spm: 236, accuracy: 93.9, score: 1740, contentId: CONTENTS[1].id },
    { userId: "demo-user-ren", spm: 229, accuracy: 96.2, score: 1690, contentId: CONTENTS[1].id },
    { userId: "demo-user-ren", spm: 218, accuracy: 95.4, score: 1580, contentId: CONTENTS[0].id },
  ];

  for (const [index, session] of otherSessions.entries()) {
    const startedAt = new Date(Date.now() - (index + 1) * 43_200_000);
    await prisma.gameSession.create({
      data: {
        id: `demo-session-${session.userId}-${index + 1}`,
        userId: session.userId,
        contentId: session.contentId,
        gameMode: GameMode.LISTEN_AND_TYPE_LYRICS,
        inputMode: InputMode.ROMAJI,
        score: session.score,
        accuracy: session.accuracy,
        strokesPerMinute: session.spm,
        wordsPerMinute: session.spm / 5,
        totalStrokes: 860,
        correctStrokes: Math.round(860 * (session.accuracy / 100)),
        incorrectStrokes: 860 - Math.round(860 * (session.accuracy / 100)),
        playtimeMs: 220_000,
        startedAt,
        endedAt: new Date(startedAt.getTime() + 220_000),
        createdAt: startedAt,
      },
    });
  }
}

async function unlockDemoRewards() {
  await prisma.userReward.deleteMany({
    where: {
      userId: "demo-user-haru",
    },
  });

  const rewards = await prisma.reward.findMany({
    where: {
      slug: {
        in: ["j-pop-beginner", "precision-idol"],
      },
    },
  });

  for (const reward of rewards) {
    await prisma.userReward.create({
      data: {
        userId: "demo-user-haru",
        rewardId: reward.id,
        triggerValue: reward.threshold,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
