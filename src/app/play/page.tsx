import { GamePlayer } from "../../components/game/GamePlayer";
import {
  buildJpopSongGameContent,
  getJpopSongById,
  JPOP_SONGS,
} from "../../lib/jpopSongs";
import { loadJpopSongLyrics } from "../../lib/loadSongLyrics";
import { prisma } from "../../lib/prisma";
import { TypingInputMode } from "../../lib/typingEngine";
import { fallbackDemoData } from "../demo/demoData";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

interface PlayPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const DEFAULT_SONG_ID = JPOP_SONGS[0]?.id ?? "jpop-lemon";

export default async function PlayPage({ searchParams }: PlayPageProps) {
  const resolvedSearchParams = await searchParams;
  const selectedContentId = getSearchParam(resolvedSearchParams.contentId) ?? DEFAULT_SONG_ID;
  const gameData = await getGameData(selectedContentId);

  return (
    <main className={styles.page}>
      <GamePlayer
        userId={gameData.userId}
        content={gameData.content}
        lyrics={gameData.lyrics}
        inputMode={TypingInputMode.Romaji}
      />
    </main>
  );
}

async function getGameData(selectedContentId: string) {
  const databaseGameData = await getDatabaseGameData(selectedContentId);
  if (databaseGameData) {
    return databaseGameData;
  }

  const staticSong = getJpopSongById(selectedContentId);
  if (staticSong) {
    const lyrics = await loadJpopSongLyrics(staticSong);
    return {
      userId: fallbackDemoData.user.id,
      content: buildJpopSongGameContent(staticSong),
      lyrics,
    };
  }

  return {
    userId: fallbackDemoData.user.id,
    content: fallbackDemoData.gameContent,
    lyrics: fallbackDemoData.lyricSyncs,
  };
}

async function getDatabaseGameData(selectedContentId: string) {
  try {
    const [user, content] = await Promise.all([
      prisma.user.findUnique({
        where: { id: "demo-user-haru" },
        select: { id: true },
      }),
      prisma.content.findUnique({
        where: { id: selectedContentId },
        include: {
          lyricSyncs: {
            orderBy: {
              lineIndex: "asc",
            },
          },
        },
      }),
    ]);

    if (!content || content.lyricSyncs.length === 0) {
      return null;
    }

    return {
      userId: user?.id ?? fallbackDemoData.user.id,
      content: {
        id: content.id,
        youtubeVideoId: content.youtubeVideoId,
        title: content.title,
        artist: content.artist,
        category: content.category,
        thumbnailUrl: content.thumbnailUrl,
        syncOffsetMs: content.syncOffsetMs,
      },
      lyrics: content.lyricSyncs.map((lyricSync) => ({
        id: lyricSync.id,
        contentId: lyricSync.contentId,
        lineIndex: lyricSync.lineIndex,
        startMs: lyricSync.startMs,
        endMs: lyricSync.endMs,
        japaneseText: lyricSync.japaneseText,
        typingText: lyricSync.japaneseText,
        romajiText: lyricSync.romajiText,
        koreanPronunciationText: lyricSync.koreanPronunciationText,
      })),
    };
  } catch (error) {
    console.warn("[Enterping][Play] Failed to load DB play data. Falling back to bundled songs.", error);
    return null;
  }
}

function getSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
