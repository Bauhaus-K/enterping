import { create } from "zustand";

import {
  InputValidationState,
  TypingInputMode,
  type ValidateInputResult,
  validateInput,
} from "../../lib/typingEngine";
import type {
  GameLineResultDraft,
  GameMetrics,
  GamePlayerLyricSync,
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
  activeLineStartedVideoTimestampMs: number | null;
  activeLineStartedSessionTimestampMs: number | null;
  
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
  lineResults: GameLineResultDraft[];
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
  completeCurrentLine: (lyric: GamePlayerLyricSync, submittedInput: string, matchedInput?: string) => void;
  finalizeCurrentLine: () => void;
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
  activeLineStartedVideoTimestampMs: null,
  activeLineStartedSessionTimestampMs: null,
  
  sessionStartedAt: null,
  sessionStartedMonotonicMs: null,
  sessionSaved: false,
  sessionSaveState: "idle",
  elapsedMs: 0,
  strokeTotals: { totalStrokes: 0, correctStrokes: 0, incorrectStrokes: 0 },
  metrics: initialMetrics,
  typoLogs: [],
  lineResults: [],
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

    const missedLineResult =
      state.currentLyric && !state.lineResults.some((lineResult) => lineResult.lyricSyncId === state.currentLyric?.id)
        ? buildLineResult({
            lyric: state.currentLyric,
            submittedInput: state.userInput,
            matchedInput: state.currentLyric.romajiText ?? undefined,
            isSuccess: false,
            startedVideoTimestampMs: state.activeLineStartedVideoTimestampMs ?? state.currentLyric.startMs,
            completedVideoTimestampMs: state.currentTimestampMs,
            startedSessionTimestampMs: state.activeLineStartedSessionTimestampMs ?? state.elapsedMs,
            completedSessionTimestampMs: state.elapsedMs,
            typoLogs: state.typoLogs,
          })
        : null;

    return {
      currentLyric: lyric,
      userInput: "",
      isComposing: false,
      completedLyricId: null,
      activeLineStartedVideoTimestampMs: lyric ? state.currentTimestampMs : null,
      activeLineStartedSessionTimestampMs: lyric ? state.elapsedMs : null,
      lineResults: missedLineResult ? [...state.lineResults, missedLineResult] : state.lineResults,
    };
  }),
  setCompletedLyricId: (id) => set({ completedLyricId: id }),
  completeCurrentLine: (lyric, submittedInput, matchedInput) => set((state) => {
    if (state.lineResults.some((lineResult) => lineResult.lyricSyncId === lyric.id)) {
      return {};
    }

    return {
      lineResults: [
        ...state.lineResults,
        buildLineResult({
          lyric,
          submittedInput,
          matchedInput,
          isSuccess: true,
          startedVideoTimestampMs: state.activeLineStartedVideoTimestampMs ?? lyric.startMs,
          completedVideoTimestampMs: state.currentTimestampMs,
          startedSessionTimestampMs: state.activeLineStartedSessionTimestampMs ?? state.elapsedMs,
          completedSessionTimestampMs: state.elapsedMs,
          typoLogs: state.typoLogs,
        }),
      ],
    };
  }),
  finalizeCurrentLine: () => set((state) => {
    if (!state.currentLyric || state.lineResults.some((lineResult) => lineResult.lyricSyncId === state.currentLyric?.id)) {
      return {};
    }

    return {
      lineResults: [
        ...state.lineResults,
        buildLineResult({
          lyric: state.currentLyric,
          submittedInput: state.userInput,
          matchedInput: state.currentLyric.romajiText ?? undefined,
          isSuccess: false,
          startedVideoTimestampMs: state.activeLineStartedVideoTimestampMs ?? state.currentLyric.startMs,
          completedVideoTimestampMs: state.currentTimestampMs,
          startedSessionTimestampMs: state.activeLineStartedSessionTimestampMs ?? state.elapsedMs,
          completedSessionTimestampMs: state.elapsedMs,
          typoLogs: state.typoLogs,
        }),
      ],
    };
  }),
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
    activeLineStartedVideoTimestampMs: null,
    activeLineStartedSessionTimestampMs: null,
    sessionStartedAt: null,
    sessionStartedMonotonicMs: null,
    sessionSaved: false,
    sessionSaveState: "idle",
    elapsedMs: 0,
    strokeTotals: { totalStrokes: 0, correctStrokes: 0, incorrectStrokes: 0 },
    metrics: initialMetrics,
    typoLogs: [],
    lineResults: [],
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

interface BuildLineResultParams {
  lyric: GamePlayerLyricSync;
  submittedInput: string;
  matchedInput?: string;
  isSuccess: boolean;
  startedVideoTimestampMs: number;
  completedVideoTimestampMs: number;
  startedSessionTimestampMs: number;
  completedSessionTimestampMs: number;
  typoLogs: GameTypoDraft[];
}

function buildLineResult({
  lyric,
  submittedInput,
  matchedInput,
  isSuccess,
  startedVideoTimestampMs,
  completedVideoTimestampMs,
  startedSessionTimestampMs,
  completedSessionTimestampMs,
  typoLogs,
}: BuildLineResultParams): GameLineResultDraft {
  const lineTypoCount = typoLogs.filter((typoLog) => typoLog.lyricSyncId === lyric.id).length;
  const responseDelayMs = Math.max(0, completedVideoTimestampMs - lyric.startMs);
  const durationMs = Math.max(0, completedSessionTimestampMs - startedSessionTimestampMs);
  const expectedInput = matchedInput || lyric.romajiText || lyric.typingText || lyric.japaneseText;

  return {
    lyricSyncId: lyric.id,
    lyricLineIndex: lyric.lineIndex,
    japaneseText: lyric.typingText ?? lyric.japaneseText,
    expectedInput,
    submittedInput,
    startedVideoTimestampMs,
    completedVideoTimestampMs,
    startedSessionTimestampMs,
    completedSessionTimestampMs,
    responseDelayMs,
    durationMs,
    typoCount: lineTypoCount,
    strokeCount: Array.from(submittedInput).length,
    isSuccess,
    isDifficult: !isSuccess || lineTypoCount > 0 || responseDelayMs > 4500,
  };
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
