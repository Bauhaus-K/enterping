import { create } from "zustand";

import {
  InputValidationState,
  TypingInputMode,
  type ValidateInputResult,
  validateInput,
} from "../../lib/typingEngine";
import type {
  GameMetrics,
  GamePlayerLyricSync,
  GameSessionDraft,
  GameTypoDraft,
} from "./types";

export const PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

interface GameState {
  // Player state
  isPlayerReady: boolean;
  playerState: number;
  playerError: string | null;
  currentTimestampMs: number;
  
  // Typing & Game state
  isInputFocused: boolean;
  userInput: string;
  isComposing: boolean;
  currentLyric: GamePlayerLyricSync | null;
  completedLyricId: string | null;
  
  // Session / Metrics
  sessionStartedAt: Date | null;
  sessionStartedMonotonicMs: number | null;
  sessionSaved: boolean;
  sessionSaveState: "idle" | "saving" | "saved" | "error";
  elapsedMs: number;
  strokeTotals: {
    totalStrokes: number;
    correctStrokes: number;
    incorrectStrokes: number;
  };
  metrics: GameMetrics;
  typoLogs: GameTypoDraft[];
  peakStrokesPerMinute: number;
  
  // Actions
  setIsPlayerReady: (ready: boolean) => void;
  setPlayerState: (state: number) => void;
  setPlayerError: (error: string | null) => void;
  setCurrentTimestampMs: (ms: number) => void;
  setIsInputFocused: (focused: boolean) => void;
  setUserInput: (input: string) => void;
  setIsComposing: (composing: boolean) => void;
  setCurrentLyric: (lyric: GamePlayerLyricSync | null) => void;
  setCompletedLyricId: (id: string | null) => void;
  ensureSessionStarted: () => void;
  setElapsedMs: (ms: number) => void;
  setSessionSaveState: (state: "idle" | "saving" | "saved" | "error") => void;
  setSessionSaved: (saved: boolean) => void;
  applyInput: (nextInput: string, activeLyric: GamePlayerLyricSync | null, inputMode: TypingInputMode) => void;
  resetGame: () => void;
}

const initialMetrics: GameMetrics = {
  elapsedMs: 0,
  totalStrokes: 0,
  correctStrokes: 0,
  incorrectStrokes: 0,
  strokesPerSecond: 0,
  strokesPerMinute: 0,
  wordsPerMinute: 0,
  accuracy: 100,
};

function calculateGameMetrics(
  elapsedMs: number,
  totalStrokes: number,
  correctStrokes: number,
  incorrectStrokes: number,
): GameMetrics {
  const elapsedSeconds = Math.max(elapsedMs / 1000, 0);
  const strokesPerSecond = elapsedSeconds > 0 ? totalStrokes / elapsedSeconds : 0;
  const strokesPerMinute = strokesPerSecond * 60;
  const wordsPerMinute = strokesPerMinute / 5;
  const accuracy = totalStrokes > 0 ? (correctStrokes / totalStrokes) * 100 : 100;

  return {
    elapsedMs,
    totalStrokes,
    correctStrokes,
    incorrectStrokes,
    strokesPerSecond,
    strokesPerMinute,
    wordsPerMinute,
    accuracy,
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  // State
  isPlayerReady: false,
  playerState: PLAYER_STATE.UNSTARTED,
  playerError: null,
  currentTimestampMs: 0,
  isInputFocused: false,
  userInput: "",
  isComposing: false,
  currentLyric: null,
  completedLyricId: null,
  
  sessionStartedAt: null,
  sessionStartedMonotonicMs: null,
  sessionSaved: false,
  sessionSaveState: "idle",
  elapsedMs: 0,
  strokeTotals: { totalStrokes: 0, correctStrokes: 0, incorrectStrokes: 0 },
  metrics: initialMetrics,
  typoLogs: [],
  peakStrokesPerMinute: 0,

  // Actions
  setIsPlayerReady: (ready) => set({ isPlayerReady: ready }),
  setPlayerState: (state) => set({ playerState: state }),
  setPlayerError: (error) => set({ playerError: error }),
  setCurrentTimestampMs: (ms) => set({ currentTimestampMs: ms }),
  setIsInputFocused: (focused) => set({ isInputFocused: focused }),
  setUserInput: (input) => set({ userInput: input }),
  setIsComposing: (composing) => set({ isComposing: composing }),
  setCurrentLyric: (lyric) => set((state) => {
    const previousLyricId = state.currentLyric?.id ?? null;
    const nextLyricId = lyric?.id ?? null;

    if (previousLyricId === nextLyricId) {
      return { currentLyric: lyric };
    }

    return {
      currentLyric: lyric,
      userInput: "",
      isComposing: false,
      completedLyricId: null,
    };
  }),
  setCompletedLyricId: (id) => set({ completedLyricId: id }),
  setSessionSaveState: (state) => set({ sessionSaveState: state }),
  setSessionSaved: (saved) => set({ sessionSaved: saved }),

  ensureSessionStarted: () => {
    const { sessionStartedAt } = get();
    if (sessionStartedAt || typeof performance === "undefined") return;
    set({
      sessionStartedAt: new Date(),
      sessionStartedMonotonicMs: performance.now(),
    });
  },

  setElapsedMs: (ms) => {
    set((state) => {
      const newMetrics = calculateGameMetrics(
        ms,
        state.strokeTotals.totalStrokes,
        state.strokeTotals.correctStrokes,
        state.strokeTotals.incorrectStrokes
      );
      return {
        elapsedMs: ms,
        metrics: newMetrics,
        peakStrokesPerMinute: Math.max(state.peakStrokesPerMinute, newMetrics.strokesPerMinute),
      };
    });
  },

  applyInput: (nextInput, activeLyric, inputMode) => {
    const store = get();
    store.ensureSessionStarted();

    if (activeLyric) {
      const inputDelta = evaluateInputChange({
        previousInput: store.userInput,
        nextInput,
        lyric: activeLyric,
        inputMode,
        videoTimestampMs: store.currentTimestampMs,
        sessionTimestampMs: store.elapsedMs,
      });

      if (inputDelta.totalStrokes > 0) {
        set((state) => {
          const newTotals = {
            totalStrokes: state.strokeTotals.totalStrokes + inputDelta.totalStrokes,
            correctStrokes: state.strokeTotals.correctStrokes + inputDelta.correctStrokes,
            incorrectStrokes: state.strokeTotals.incorrectStrokes + inputDelta.incorrectStrokes,
          };
          const newMetrics = calculateGameMetrics(
            state.elapsedMs,
            newTotals.totalStrokes,
            newTotals.correctStrokes,
            newTotals.incorrectStrokes
          );
          return {
            strokeTotals: newTotals,
            metrics: newMetrics,
            peakStrokesPerMinute: Math.max(state.peakStrokesPerMinute, newMetrics.strokesPerMinute),
            typoLogs: [...state.typoLogs, ...inputDelta.typoLogs],
          };
        });
      }
    }

    set({ userInput: nextInput });
  },

  resetGame: () => set({
    isPlayerReady: false,
    playerState: PLAYER_STATE.UNSTARTED,
    playerError: null,
    currentTimestampMs: 0,
    userInput: "",
    isComposing: false,
    currentLyric: null,
    completedLyricId: null,
    sessionStartedAt: null,
    sessionStartedMonotonicMs: null,
    sessionSaved: false,
    sessionSaveState: "idle",
    elapsedMs: 0,
    strokeTotals: { totalStrokes: 0, correctStrokes: 0, incorrectStrokes: 0 },
    metrics: initialMetrics,
    typoLogs: [],
    peakStrokesPerMinute: 0,
  }),
}));

// Helpers for applyInput
interface EvaluateInputChangeParams {
  previousInput: string;
  nextInput: string;
  lyric: GamePlayerLyricSync;
  inputMode: TypingInputMode;
  videoTimestampMs: number;
  sessionTimestampMs: number;
}

function evaluateInputChange({
  previousInput,
  nextInput,
  lyric,
  inputMode,
  videoTimestampMs,
  sessionTimestampMs,
}: EvaluateInputChangeParams) {
  const insertedRange = getInsertedRange(previousInput, nextInput);

  if (insertedRange.characters.length === 0) {
    return { totalStrokes: 0, correctStrokes: 0, incorrectStrokes: 0, typoLogs: [] };
  }

  let correctStrokes = 0;
  const typoLogs: GameTypoDraft[] = [];
  const nextInputCharacters = Array.from(nextInput);

  insertedRange.characters.forEach((inputtedCharacter, offset) => {
    const targetTextPosition = insertedRange.startIndex + offset;
    const partialInput = nextInputCharacters.slice(0, targetTextPosition + 1).join("");
    const partialResult = validateInput(lyric.typingText ?? lyric.japaneseText, partialInput, {
      mode: inputMode,
    });

    if (partialResult.state !== InputValidationState.Incorrect) {
      correctStrokes += 1;
      return;
    }

    const expectedInput = chooseBestExpectedInput(
      partialResult.expectedInputs,
      partialResult.normalizedInput,
    );
    const expectedCharacters = Array.from(expectedInput);
    const targetCharacter = expectedCharacters[targetTextPosition] ?? "";
    const previousCharacter =
      expectedCharacters[targetTextPosition - 1] ??
      nextInputCharacters[targetTextPosition - 1] ??
      undefined;

    typoLogs.push({
      lyricSyncId: lyric.id,
      lyricLineIndex: lyric.lineIndex,
      targetCharacter,
      inputtedCharacter,
      previousCharacter,
      targetTextPosition,
      videoTimestampMs,
      sessionTimestampMs,
      contextualPreviousWord: previousCharacter,
      createdAt: new Date().toISOString(),
    });
  });

  return {
    totalStrokes: insertedRange.characters.length,
    correctStrokes,
    incorrectStrokes: typoLogs.length,
    typoLogs,
  };
}

function getInsertedRange(previousInput: string, nextInput: string) {
  const previousCharacters = Array.from(previousInput);
  const nextCharacters = Array.from(nextInput);

  let startIndex = 0;
  while (
    startIndex < previousCharacters.length &&
    startIndex < nextCharacters.length &&
    previousCharacters[startIndex] === nextCharacters[startIndex]
  ) {
    startIndex += 1;
  }

  let previousEndIndex = previousCharacters.length - 1;
  let nextEndIndex = nextCharacters.length - 1;
  while (
    previousEndIndex >= startIndex &&
    nextEndIndex >= startIndex &&
    previousCharacters[previousEndIndex] === nextCharacters[nextEndIndex]
  ) {
    previousEndIndex -= 1;
    nextEndIndex -= 1;
  }

  return {
    startIndex,
    characters: nextCharacters.slice(startIndex, nextEndIndex + 1),
  };
}

function chooseBestExpectedInput(expectedInputs: string[], normalizedInput: string): string {
  return expectedInputs.reduce((bestCandidate, candidate) => {
    const bestScore = getSharedPrefixLength(bestCandidate, normalizedInput);
    const candidateScore = getSharedPrefixLength(candidate, normalizedInput);

    return candidateScore > bestScore ? candidate : bestCandidate;
  }, expectedInputs[0] ?? "");
}

function getSharedPrefixLength(left: string, right: string): number {
  const leftCharacters = Array.from(left);
  const rightCharacters = Array.from(right);
  const maxLength = Math.min(leftCharacters.length, rightCharacters.length);

  for (let index = 0; index < maxLength; index += 1) {
    if (leftCharacters[index] !== rightCharacters[index]) {
      return index;
    }
  }

  return maxLength;
}
