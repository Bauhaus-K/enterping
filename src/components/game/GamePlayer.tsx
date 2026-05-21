"use client";

import { useEffect, useRef, useState } from "react";
import { TypingInputMode, type ValidateInputResult } from "../../lib/typingEngine";
import { dispatchRewardNotifications } from "../RewardNotificationCenter";
import { useGameStore, PLAYER_STATE } from "./useGameStore";
import { cacheLyrics, getCachedLyrics } from "../../lib/lyricCache";
import type {
  GamePlayerContent,
  GamePlayerLyricSync,
  GamePlayerMode,
  GameSessionDraft,
  GameTypoDraft,
} from "./types";
import styles from "../GamePlayer.module.css";

import { StatsPanel } from "./StatsPanel";
import { VideoPanel } from "./VideoPanel";
import { InfoPanel } from "./InfoPanel";
import { TypingPanel } from "./TypingPanel";
import { ModePanel } from "./ModePanel";

export interface GamePlayerProps {
  userId?: string;
  isPremium?: boolean;
  content: GamePlayerContent;
  lyrics: GamePlayerLyricSync[];
  gameMode?: GamePlayerMode;
  inputMode?: TypingInputMode;
  autoPlay?: boolean;
  pollIntervalMs?: number;
  lyricLeadMs?: number;
  className?: string;
  onLyricChange?: (lyric: GamePlayerLyricSync | null) => void;
  onValidationChange?: (result: ValidateInputResult | null) => void;
  onCorrectLyric?: (lyric: GamePlayerLyricSync, input: string) => void;
  onTypo?: (typo: GameTypoDraft) => void;
  onSessionSaved?: (session: GameSessionDraft) => void;
  saveSession?: (session: GameSessionDraft) => Promise<void>;
}

export function GamePlayer({
  userId,
  content,
  lyrics: initialLyrics,
  gameMode = "LISTEN_AND_TYPE_LYRICS",
  inputMode = TypingInputMode.Romaji,
  autoPlay = false,
  pollIntervalMs = 250,
  lyricLeadMs = 0,
  className,
  onLyricChange,
  onValidationChange,
  onCorrectLyric,
  onTypo,
  onSessionSaved,
  saveSession,
}: GamePlayerProps) {
  const baseSyncOffsetMs = content.syncOffsetMs ?? 0;
  const [cachedLyrics, setCachedLyrics] = useState<GamePlayerLyricSync[]>(initialLyrics);
  
  const {
    resetGame,
    playerState,
    sessionSaved,
    setSessionSaved,
    setSessionSaveState,
    currentTimestampMs,
    setCurrentLyric,
    metrics,
    typoLogs,
    sessionStartedAt
  } = useGameStore();

  // Reset store on mount / content change
  useEffect(() => {
    resetGame();
  }, [content.id, resetGame]);

  // Caching lyrics logic
  useEffect(() => {
    async function handleCache() {
      if (initialLyrics.length > 0 && initialLyrics[0].id !== `${content.id}-empty`) {
        await cacheLyrics(content.id, initialLyrics);
        setCachedLyrics(initialLyrics);
      } else {
        const fromCache = await getCachedLyrics(content.id);
        if (fromCache && fromCache.length > 0) {
          setCachedLyrics(fromCache);
        }
      }
    }
    handleCache();
  }, [content.id, initialLyrics]);

  // Lyric sync logic (Lead Ms)
  useEffect(() => {
    const nextLyric = findActiveLyric(cachedLyrics, currentTimestampMs + lyricLeadMs + baseSyncOffsetMs);
    setCurrentLyric(nextLyric);
  }, [currentTimestampMs, cachedLyrics, lyricLeadMs, setCurrentLyric, baseSyncOffsetMs]);

  // Notify parent of active lyric changes
  const activeLyric = useGameStore((state) => state.currentLyric);
  useEffect(() => {
    onLyricChange?.(activeLyric);
  }, [activeLyric, onLyricChange]);

  // Notify parent of typos
  useEffect(() => {
    if (typoLogs.length > 0) {
      const lastTypo = typoLogs[typoLogs.length - 1];
      onTypo?.(lastTypo);
    }
  }, [typoLogs, onTypo]);

  // Session saving logic
  useEffect(() => {
    if (playerState !== PLAYER_STATE.ENDED || sessionSaved) {
      return;
    }
    
    setSessionSaved(true);
    const endedAt = new Date();
    
    const sessionDraft: GameSessionDraft = {
      userId,
      contentId: content.id,
      gameMode,
      inputMode,
      score: Math.max(0, Math.round(metrics.correctStrokes * 10 + metrics.accuracy * 4 - metrics.incorrectStrokes * 8)),
      accuracy: Math.round(metrics.accuracy * 100) / 100,
      strokesPerMinute: Math.round(metrics.strokesPerMinute * 100) / 100,
      wordsPerMinute: Math.round(metrics.wordsPerMinute * 100) / 100,
      totalStrokes: metrics.totalStrokes,
      correctStrokes: metrics.correctStrokes,
      incorrectStrokes: metrics.incorrectStrokes,
      playtimeMs: metrics.elapsedMs || Math.max(endedAt.getTime() - (sessionStartedAt?.getTime() ?? endedAt.getTime()), 0),
      startedAt: (sessionStartedAt ?? endedAt).toISOString(),
      endedAt: endedAt.toISOString(),
      typoLogs,
    };

    setSessionSaveState("saving");
    
    const doSave = async () => {
      try {
        if (saveSession) {
          await saveSession(sessionDraft);
        } else if (userId) {
          const response = await fetch("/api/game-sessions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...sessionDraft,
              content,
            }),
          });

          if (!response.ok && response.status !== 401) {
            throw new Error(`Session save failed with status ${response.status}`);
          }

          if (response.ok) {
            const data = (await response.json()) as {
              unlockedRewards?: Parameters<typeof dispatchRewardNotifications>[0];
            };
            dispatchRewardNotifications(data.unlockedRewards ?? []);
          }
        } else {
          // Keep anonymous practice playable without forcing login.
          await new Promise((resolve) => setTimeout(resolve, 350));
        }
        setSessionSaveState("saved");
        onSessionSaved?.(sessionDraft);
      } catch (err) {
        console.error("[Enterping] Failed to save session", err);
        setSessionSaveState("error");
        setSessionSaved(false);
      }
    };
    
    doSave();
  }, [playerState, sessionSaved, userId, content.id, gameMode, inputMode, metrics, sessionStartedAt, typoLogs, saveSession, onSessionSaved, setSessionSaveState, setSessionSaved]);

  const shellClassName = className ? `${styles.shell} ${className}` : styles.shell;
  const firstLyricStartMs = Math.max(
    0,
    (cachedLyrics[0]?.startMs ?? 0) - lyricLeadMs - baseSyncOffsetMs,
  );

  return (
    <section className={shellClassName}>
      <StatsPanel />
      <VideoPanel
        content={content}
        autoPlay={autoPlay}
        pollIntervalMs={pollIntervalMs}
        firstLyricStartMs={firstLyricStartMs}
      />
      <InfoPanel content={content} inputMode={inputMode} />
      <aside className={styles.emptyPanel} aria-label="Gameplay reserved panel" />
      <TypingPanel 
        lyrics={cachedLyrics} 
        inputMode={inputMode} 
        onCorrectLyric={onCorrectLyric}
        onValidationChange={onValidationChange} 
      />
      <ModePanel gameMode={gameMode} />
    </section>
  );
}

function findActiveLyric(
  lyrics: GamePlayerLyricSync[],
  currentTimestampMs: number,
): GamePlayerLyricSync | null {
  const sortedLyrics = [...lyrics].sort((left, right) => left.startMs - right.startMs);

  for (let index = 0; index < sortedLyrics.length; index += 1) {
    const lyric = sortedLyrics[index];
    const nextLyric = sortedLyrics[index + 1];
    const endMs = lyric.endMs ?? nextLyric?.startMs ?? Number.POSITIVE_INFINITY;

    if (currentTimestampMs >= lyric.startMs && currentTimestampMs < endMs) {
      return lyric;
    }
  }

  return null;
}

export * from "./types";
