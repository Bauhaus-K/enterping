import { useEffect, useLayoutEffect, useRef, type ChangeEvent, type CompositionEvent, type CSSProperties, type ReactNode } from "react";
import { useGameStore } from "./useGameStore";
import { TypingInputMode, validateInput, InputValidationState, type ValidateInputResult } from "../../lib/typingEngine";
import type { GamePlayerLyricSync } from "./types";
import styles from "../GamePlayer.module.css";

interface TypingPanelProps {
  lyrics: GamePlayerLyricSync[];
  inputMode: TypingInputMode;
  onCorrectLyric?: (lyric: GamePlayerLyricSync, input: string) => void;
  onValidationChange?: (result: ValidateInputResult | null) => void;
}

export function TypingPanel({ lyrics, inputMode, onCorrectLyric, onValidationChange }: TypingPanelProps) {
  const typingInputRef = useRef<HTMLInputElement | null>(null);
  const previousTypingLyricIdRef = useRef<string | null>(null);
  
  const {
    isInputFocused,
    setIsInputFocused,
    userInput,
    setUserInput,
    isComposing,
    setIsComposing,
    currentLyric,
    completedLyricId,
    setCompletedLyricId,
    applyInput,
    currentTimestampMs,
  } = useGameStore();

  const getVisibleLyrics = () => {
    const sortedLyrics = [...lyrics].sort((left, right) => left.startMs - right.startMs);
    const activeIndex = sortedLyrics.findIndex((lyric) => lyric.id === currentLyric?.id);
    const startIndex = activeIndex >= 0 ? Math.max(activeIndex, 0) : 0;
    return sortedLyrics.slice(startIndex, startIndex + 3);
  };

  const visibleLyrics = getVisibleLyrics();
  const activeTypingLyric = currentLyric ?? visibleLyrics[0] ?? lyrics[0] ?? null;
  const currentTypingText = activeTypingLyric?.typingText ?? activeTypingLyric?.japaneseText ?? null;

  useLayoutEffect(() => {
    const nextLyricId = activeTypingLyric?.id ?? null;
    const previousLyricId = previousTypingLyricIdRef.current;

    if (previousLyricId !== null && previousLyricId !== nextLyricId && userInput.length > 0) {
      setUserInput("");
      console.log("[Enterping][TypingEngine] cleared input for next lyric", {
        previousLyricId,
        nextLyricId,
      });
    }

    previousTypingLyricIdRef.current = nextLyricId;
  }, [activeTypingLyric?.id, setUserInput, userInput.length]);

  const validationResult = activeTypingLyric
    ? validateInput(currentTypingText ?? activeTypingLyric.japaneseText, userInput, { mode: inputMode })
    : null;

  useEffect(() => {
    onValidationChange?.(validationResult);

    if (
      activeTypingLyric &&
      validationResult?.state === InputValidationState.Correct &&
      completedLyricId !== activeTypingLyric.id
    ) {
      setCompletedLyricId(activeTypingLyric.id);
      onCorrectLyric?.(activeTypingLyric, userInput);
    }
  }, [
    activeTypingLyric,
    userInput,
    onCorrectLyric,
    onValidationChange,
    validationResult?.state,
    completedLyricId,
    setCompletedLyricId,
  ]);

  const displayLyric = activeTypingLyric;
  const queuedLyrics = visibleLyrics.filter((lyric) => lyric.id !== displayLyric?.id).slice(0, 2);
  const displayedCurrentLyric = displayLyric?.typingText ?? displayLyric?.japaneseText ?? null;
  const currentRomajiText = displayLyric?.romajiText || displayLyric?.typingText || "";
  const currentNormalizedInput = validationResult?.normalizedInput ?? userInput;
  const liveNormalizedInput = inputMode === TypingInputMode.Romaji
    ? userInput.normalize("NFKC").toLowerCase()
    : userInput.normalize("NFC");
  const liveDisplayInput = liveNormalizedInput.length > 0 ? liveNormalizedInput : userInput;
  const currentLyricProgress = validationResult?.progress ?? 0;
  const progressStyle = {
    "--typing-progress": `${Math.round(currentLyricProgress * 100)}%`,
  } as CSSProperties;

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextInput = event.currentTarget.value;
    if (isComposing) {
      setUserInput(nextInput);
      return;
    }
    applyInput(nextInput, activeTypingLyric, inputMode);
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = (event: CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    applyInput(event.currentTarget.value, activeTypingLyric, inputMode);
  };

  useEffect(() => {
    const focusTimer = window.setTimeout(() => {
      typingInputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(focusTimer);
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const inputElement = typingInputRef.current;

      if (!inputElement || inputElement.disabled) return;
      if (target === inputElement) return;

      if (target) {
        const tagName = target.tagName;
        if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT" || target.isContentEditable) {
          return;
        }
      }

      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.length === 1 || event.key === "Backspace" || event.key === " ") {
        inputElement.focus();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  return (
    <main className={styles.typingPanel}>
      <div className={styles.lyricStack}>
        <article
          className={`${styles.currentLyricCard} ${isInputFocused ? styles.currentLyricCardFocused : ""}`}
          onClick={() => typingInputRef.current?.focus()}
        >
          <div className={styles.romajiLine}>
            {currentRomajiText
              ? renderTypedRomajiText(currentRomajiText, currentNormalizedInput)
              : <span className={styles.romajiPlaceholder}>여기를 클릭하고 타이핑을 시작하세요</span>}
          </div>
          <div className={styles.japaneseLine}>
            {displayedCurrentLyric
              ? renderProgressText(displayedCurrentLyric, currentLyricProgress)
              : <span className={styles.japanesePlaceholder}>재생 버튼을 누르면 가사가 표시됩니다</span>}
          </div>
          <label className={styles.inputLabel} htmlFor="enterping-game-input">
            {inputMode === TypingInputMode.Hangul ? "한글 발음 입력" : "로마자 입력"}
          </label>
          <input
            ref={typingInputRef}
            id="enterping-game-input"
            className={styles.hiddenInput}
            type="text"
            value={userInput}
            onChange={handleInputChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onFocus={() => setIsInputFocused(true)}
            onBlur={(event) => {
              setIsInputFocused(false);
              const blurredElement = event.currentTarget;
              window.setTimeout(() => {
                const nextActive = document.activeElement;
                const isOtherInput =
                  nextActive instanceof HTMLElement &&
                  (nextActive.tagName === "INPUT" ||
                    nextActive.tagName === "TEXTAREA" ||
                    nextActive.tagName === "SELECT" ||
                    nextActive.isContentEditable);

                if (!isOtherInput) {
                  blurredElement.focus();
                }
              }, 0);
            }}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            autoFocus
            spellCheck={false}
            aria-label={inputMode === TypingInputMode.Hangul ? "한글 발음 입력" : "로마자 입력"}
          />
          {inputMode === TypingInputMode.Hangul && liveDisplayInput.length > 0 ? (
            <div className={styles.imePreview} aria-live="polite">
              {renderInputChars(liveDisplayInput, validationResult)}
            </div>
          ) : null}
          <div className={styles.progressTrack} style={progressStyle}>
            <div className={styles.progressFill} />
          </div>
        </article>

        {queuedLyrics.map((lyric) => (
          <article key={lyric.id} className={styles.queueLyricCard}>
            <div className={styles.queueGuideText}>
              {lyric.romajiText ?? lyric.typingText ?? "upcoming guide"}
            </div>
            <div className={styles.queueLyricText}>{lyric.typingText ?? lyric.japaneseText}</div>
          </article>
        ))}
      </div>
    </main>
  );
}

// Helpers
function renderInputChars(normalizedInput: string, validationResult: ValidateInputResult | null) {
  const chars = Array.from(normalizedInput);
  if (chars.length === 0) return null;

  const state = validationResult?.state ?? InputValidationState.Incomplete;
  const expectedInputs = validationResult?.expectedInputs ?? [];

  if (state === InputValidationState.Correct || state === InputValidationState.Incomplete) {
    return chars.map((char, index) => (
      <span key={index} className={styles.typedCorrectChar}>
        {char === " " ? "\u00A0" : char}
      </span>
    ));
  }

  const correctPrefixLength = getCorrectPrefixLength(chars, expectedInputs);

  return chars.map((char, index) => (
    <span
      key={index}
      className={index < correctPrefixLength ? styles.typedCorrectChar : styles.typedIncorrectChar}
    >
      {char === " " ? "\u00A0" : char}
    </span>
  ));
}

function getCorrectPrefixLength(inputChars: string[], expectedInputs: string[]): number {
  for (let len = inputChars.length - 1; len >= 0; len -= 1) {
    const prefix = inputChars.slice(0, len).join("");
    if (len === 0 || expectedInputs.some((e) => e.startsWith(prefix))) {
      return len;
    }
  }
  return 0;
}

function renderProgressText(text: string, progress: number) {
  const characters = Array.from(text);
  const completedCount = Math.max(0, Math.min(characters.length, Math.floor(characters.length * progress)));

  return characters.map((character, index) => {
    let className = styles.pendingChar;
    if (index < completedCount) {
      className = styles.completedChar;
    } else if (index === completedCount && progress > 0 && completedCount < characters.length) {
      className = styles.activeChar;
    }
    return (
      <span key={`${character}-${index}`} className={className}>
        {character}
      </span>
    );
  });
}

function renderTypedRomajiText(expectedText: string, currentInput: string) {
  const expectedCharacters = Array.from(expectedText);
  const expectedComparable = Array.from(expectedText.toLowerCase());
  const inputComparable = Array.from(currentInput.toLowerCase());
  const maxLength = Math.max(expectedCharacters.length, inputComparable.length);

  const elements: ReactNode[] = [];
  let inputIndex = 0;

  for (let expectedIndex = 0; expectedIndex < maxLength; expectedIndex += 1) {
    const expectedChar = expectedCharacters[expectedIndex] ?? "";
    const expectedCharLower = expectedComparable[expectedIndex] ?? "";

    if (inputIndex >= inputComparable.length) {
      elements.push(
        <span key={`pending-${expectedIndex}`} className={styles.pendingChar}>
          {expectedChar}
        </span>
      );
      continue;
    }

    const inputCharLower = inputComparable[inputIndex];
    if (expectedCharLower === " " && inputCharLower !== " ") {
      elements.push(
        <span key={`auto-space-${expectedIndex}`} className={styles.typedCorrectChar}>
          {expectedChar === "" ? "\u00A0" : expectedChar}
        </span>
      );
      continue;
    }

    const isCorrect = inputCharLower === expectedCharLower;
    elements.push(
      <span
        key={`typed-${expectedIndex}`}
        className={isCorrect ? styles.typedCorrectChar : styles.typedIncorrectChar}
      >
        {expectedChar === "" ? "\u00A0" : expectedChar}
      </span>
    );
    inputIndex += 1;
  }
  return elements;
}
