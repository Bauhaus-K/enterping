import { GamePlayer } from "../../components/game/GamePlayer";
import { getCurrentUser } from "../../lib/auth";
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
  const currentUser = await getCurrentUser();
  const gameData = await getGameData(selectedContentId, currentUser?.id);

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

async function getGameData(selectedContentId: string, userId?: string) {
  const databaseGameData = await getDatabaseGameData(selectedContentId, userId);
  if (databaseGameData) {
    return databaseGameData;
  }

  const staticSong = getJpopSongById(selectedContentId);
  if (staticSong) {
    const lyrics = await loadJpopSongLyrics(staticSong);
    return {
      userId,
      content: buildJpopSongGameContent(staticSong),
      lyrics,
    };
  }

  return {
    userId,
    content: fallbackDemoData.gameContent,
    lyrics: fallbackDemoData.lyricSyncs,
  };
}

async function getDatabaseGameData(selectedContentId: string, userId?: string) {
  try {
    const content = await prisma.content.findUnique({
      where: { id: selectedContentId },
      include: {
        lyricSyncs: {
          orderBy: {
            lineIndex: "asc",
          },
        },
      },
    });

    if (!content || content.lyricSyncs.length === 0) {
      return null;
    }

    return {
      userId,
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
