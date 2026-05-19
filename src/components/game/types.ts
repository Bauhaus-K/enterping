import { TypingInputMode } from "../../lib/typingEngine";

export interface GamePlayerContent {
  id: string;
  youtubeVideoId: string;
  title: string;
  artist?: string | null;
  category?: string | null;
  thumbnailUrl?: string | null;
  syncOffsetMs?: number | null;
}

export interface GamePlayerLyricSync {
  id: string;
  contentId?: string;
  lineIndex: number;
  startMs: number;
  endMs?: number | null;
  japaneseText: string;
  typingText?: string | null;
  romajiText?: string | null;
  koreanPronunciationText?: string | null;
  koreanTranslationText?: string | null;
}

export type GamePlayerMode = "LISTEN_AND_TYPE_LYRICS" | "LISTEN_AND_GUESS";

export interface GameMetrics {
  elapsedMs: number;
  totalStrokes: number;
  correctStrokes: number;
  incorrectStrokes: number;
  strokesPerSecond: number;
  strokesPerMinute: number;
  wordsPerMinute: number;
  accuracy: number;
}

export interface GameTypoDraft {
  lyricSyncId?: string;
  lyricLineIndex?: number;
  targetCharacter: string;
  inputtedCharacter: string;
  previousCharacter?: string;
  targetTextPosition: number;
  videoTimestampMs: number;
  sessionTimestampMs: number;
  contextualPreviousWord?: string;
  createdAt: string;
}

export interface GameSessionDraft {
  userId?: string;
  contentId: string;
  gameMode: GamePlayerMode;
  inputMode: TypingInputMode;
  score: number;
  accuracy: number;
  strokesPerMinute: number;
  wordsPerMinute: number;
  totalStrokes: number;
  correctStrokes: number;
  incorrectStrokes: number;
  playtimeMs: number;
  startedAt: string;
  endedAt: string;
  typoLogs: GameTypoDraft[];
}
