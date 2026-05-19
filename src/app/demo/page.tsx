import { prisma } from "../../lib/prisma";
import { buildJpopSongGameContent, getJpopSongById, JPOP_SONGS } from "../../lib/jpopSongs";
import { loadJpopSongLyrics } from "../../lib/loadSongLyrics";
import { DemoSandbox } from "./DemoSandbox";
import { fallbackDemoData } from "./demoData";

export const dynamic = "force-dynamic";

interface DemoPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DemoPage({ searchParams }: DemoPageProps) {
  const resolvedSearchParams = await searchParams;
  const selectedContentId = getSearchParam(resolvedSearchParams.contentId) ?? JPOP_SONGS[0]?.id ?? "jpop-lemon";
  const selectedSong = getJpopSongById(selectedContentId) ?? JPOP_SONGS[0];
  const lrcGameContent = buildJpopSongGameContent(selectedSong);
  const lrcLyrics = await loadJpopSongLyrics(selectedSong);

  try {
    const user = await prisma.user.findUnique({
      where: { id: "demo-user-haru" },
      include: {
        rewards: {
          include: {
            reward: true,
          },
          orderBy: {
            unlockedAt: "desc",
          },
        },
      },
    });

    if (!user) {
      console.warn("[Enterping][Demo] Seeded user not found. Falling back to bundled dashboard data.");
      return <DemoSandbox {...fallbackDemoData} gameContent={lrcGameContent} lyricSyncs={lrcLyrics} />;
    }

    const [sessions, typoLogs] = await Promise.all([
      prisma.gameSession.findMany({
        where: { userId: user.id },
        orderBy: { startedAt: "asc" },
        take: 10,
      }),
      prisma.typoLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    return (
      <DemoSandbox
        user={{
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          isPremium: user.isPremium,
        }}
        gameContent={lrcGameContent}
        lyricSyncs={lrcLyrics}
        dashboard={{
          typoLogs: typoLogs.map((typoLog) => ({
            id: typoLog.id,
            targetCharacter: typoLog.targetCharacter,
            inputtedCharacter: typoLog.inputtedCharacter,
            contextualPreviousWord: typoLog.contextualPreviousWord,
            createdAt: typoLog.createdAt.toISOString(),
          })),
          sessions: sessions.map((session) => ({
            id: session.id,
            startedAt: session.startedAt.toISOString(),
            strokesPerMinute: session.strokesPerMinute,
            accuracy: session.accuracy,
            score: session.score,
            playtimeMs: session.playtimeMs,
          })),
          rewards: user.rewards.map((userReward) => ({
            id: userReward.id,
            slug: userReward.reward.slug,
            name: userReward.reward.name,
            description: userReward.reward.description,
            kind: userReward.reward.kind,
            icon: userReward.reward.icon,
            unlockedAt: userReward.unlockedAt.toISOString(),
            triggerValue: userReward.triggerValue,
          })),
          aiFeedback: {
            weakness: "sokuon timing and tsu transitions",
            tip: "Practice short loops like matte, kitte, tsuyoku, and tsurete while saying the doubled consonant rhythm out loud.",
            encouragement:
              "Your recent sessions already show strong speed growth. A little rhythm work will make the accuracy catch up.",
          },
        }}
      />
    );
  } catch (error) {
    console.warn("[Enterping][Demo] Failed to load Prisma demo data. Falling back to bundled dashboard data.", error);
    return <DemoSandbox {...fallbackDemoData} gameContent={lrcGameContent} lyricSyncs={lrcLyrics} />;
  }
}

function getSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
