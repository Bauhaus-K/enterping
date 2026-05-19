import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import type { JpopSong, JpopSongLyricLine } from "./jpopSongs";
import { parseLrc, withEndTimes } from "./lrcParser";
import { getAcceptedInputs, TypingInputMode } from "./typingEngine";

export interface LoadedLyricSync {
  id: string;
  contentId: string;
  lineIndex: number;
  startMs: number;
  endMs: number;
  japaneseText: string;
  typingText: string;
  romajiText: string;
  koreanPronunciationText: string | null;
}

const LYRICS_DIR = path.join(process.cwd(), "data", "jpop-lyrics");

async function readLrcFile(songId: string): Promise<string | null> {
  try {
    return await fs.readFile(path.join(LYRICS_DIR, `${songId}.lrc`), "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;

    if (code === "ENOENT" || code === "ENOTDIR") {
      return null;
    }

    console.warn(`[Enterping] Failed to read LRC for "${songId}"`, error);
    return null;
  }
}

export async function loadJpopSongLyrics(song: JpopSong): Promise<LoadedLyricSync[]> {
  const lrcContent = await readLrcFile(song.id);

  if (lrcContent) {
    const parsed = parseLrc(lrcContent);

    if (parsed.length > 0) {
      return withEndTimes(parsed).map((line, index) => buildSyncRow(song.id, index, line));
    }
  }

  if (song.lyricLines && song.lyricLines.length > 0) {
    return song.lyricLines.map((line, index) =>
      buildSyncRow(song.id, index, {
        startMs: line.startMs,
        endMs: line.endMs,
        displayText: line.japaneseText,
        typingText: line.typingText,
      }),
    );
  }

  return [buildEmptyLyricForSong(song)];
}

export async function countJpopSongLines(song: JpopSong): Promise<number> {
  const lrcContent = await readLrcFile(song.id);

  if (lrcContent) {
    const parsed = parseLrc(lrcContent);

    if (parsed.length > 0) {
      return parsed.length;
    }
  }

  return song.lyricLines?.length ?? 0;
}

function buildSyncRow(
  songId: string,
  index: number,
  line: { startMs: number; endMs: number; displayText: string; typingText: string },
): LoadedLyricSync {
  const romajiText = getAcceptedInputs(line.typingText, TypingInputMode.Romaji)[0] ?? "";

  return {
    id: `${songId}-line-${index}`,
    contentId: songId,
    lineIndex: index,
    startMs: line.startMs,
    endMs: line.endMs,
    japaneseText: line.displayText,
    typingText: line.typingText,
    romajiText,
    koreanPronunciationText: getAcceptedInputs(line.typingText, TypingInputMode.Hangul)[0] ?? null,
  };
}

export function buildEmptyLyricForSong(song: JpopSong): LoadedLyricSync {
  return {
    id: `${song.id}-empty`,
    contentId: song.id,
    lineIndex: 0,
    startMs: 0,
    endMs: 5000,
    japaneseText: "歌詞ファイルを追加してください",
    typingText: "かしふぁいるをついかしてください",
    romajiText: "kashifairuwotsuikashitekudasai",
    koreanPronunciationText: null,
  };
}

export type { JpopSongLyricLine };
