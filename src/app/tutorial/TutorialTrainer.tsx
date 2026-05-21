"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { InputValidationState, TypingInputMode, validateInput } from "../../lib/typingEngine";
import styles from "./page.module.css";

interface TutorialStep {
  id: string;
  title: string;
  guide: string;
  targetText: string;
  romajiHint: string;
  note: string;
}

const STEPS: TutorialStep[] = [
  {
    id: "basic",
    title: "1. 기본 로마자 입력",
    guide: "히라가나를 보고 아래 로마자를 그대로 입력해보세요.",
    targetText: "ゆめならば",
    romajiHint: "yumenaraba",
    note: "ゆ = yu, め = me처럼 히라가나 발음을 로마자로 이어서 입력합니다.",
  },
  {
    id: "sokuon",
    title: "2. 촉음 っ",
    guide: "작은 っ는 다음 자음을 한 번 더 입력합니다.",
    targetText: "まって",
    romajiHint: "matte",
    note: "まって는 ma + t + te가 되어 matte로 입력합니다.",
  },
  {
    id: "youon",
    title: "3. 요음 ゃ・ゅ・ょ",
    guide: "작은 ゃ/ゅ/ょ는 앞 글자와 묶어서 입력합니다.",
    targetText: "しゅくだい",
    romajiHint: "shukudai",
    note: "しゅ는 shu 또는 syu로 입력할 수 있습니다.",
  },
  {
    id: "long-vowel",
    title: "4. 장음 ー",
    guide: "장음은 직전 모음을 한 번 더 입력하거나 -로 입력할 수 있습니다.",
    targetText: "ゲーム",
    romajiHint: "geemu",
    note: "ゲーム은 geemu 또는 ge-mu 모두 정답으로 인정됩니다.",
  },
];

export function TutorialTrainer() {
  const [stepIndex, setStepIndex] = useState(0);
  const [input, setInput] = useState("");
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(new Set());
  const step = STEPS[stepIndex];
  const validation = validateInput(step.targetText, input, { mode: TypingInputMode.Romaji });
  const isCorrect = validation.state === InputValidationState.Correct;
  const progressPercent = Math.round(validation.progress * 100);
  const completedCount = completedStepIds.size + (isCorrect && !completedStepIds.has(step.id) ? 1 : 0);
  const allCompleted = completedCount >= STEPS.length;
  const expectedInput = validation.matchedInput ?? validation.expectedInputs[0] ?? step.romajiHint;

  const statusLabel = useMemo(() => {
    if (isCorrect) {
      return "정답입니다. 다음 단계로 넘어가세요.";
    }

    if (input.length === 0) {
      return "입력창을 클릭하고 시작하세요.";
    }

    if (validation.state === InputValidationState.Incorrect) {
      return "조금 어긋났어요. Backspace로 고치면 됩니다.";
    }

    return "좋아요. 계속 입력하세요.";
  }, [input.length, isCorrect, validation.state]);

  const goToStep = (nextIndex: number) => {
    setStepIndex(Math.max(0, Math.min(STEPS.length - 1, nextIndex)));
    setInput("");
  };

  const completeCurrentStep = () => {
    setCompletedStepIds((previous) => new Set(previous).add(step.id));

    if (stepIndex < STEPS.length - 1) {
      goToStep(stepIndex + 1);
    }
  };

  return (
    <section className={styles.trainer} aria-label="Enterping onboarding typing tutorial">
      <div className={styles.stepRail} aria-label="Tutorial steps">
        {STEPS.map((item, index) => {
          const active = index === stepIndex;
          const done = completedStepIds.has(item.id) || (item.id === step.id && isCorrect);

          return (
            <button
              className={`${styles.stepPill} ${active ? styles.stepPillActive : ""} ${done ? styles.stepPillDone : ""}`}
              key={item.id}
              onClick={() => goToStep(index)}
              type="button"
            >
              <span>{index + 1}</span>
              {item.id}
            </button>
          );
        })}
      </div>

      <div className={styles.practiceCard}>
        <div className={styles.practiceHeader}>
          <div>
            <span>Romaji Tutorial</span>
            <h2>{step.title}</h2>
          </div>
          <strong>{completedCount}/{STEPS.length}</strong>
        </div>

        <p className={styles.guideText}>{step.guide}</p>

        <div className={styles.targetBox}>
          <div className={styles.kanaLine}>{renderKanaProgress(step.targetText, validation.progress)}</div>
          <div className={styles.romajiLine}>{renderRomajiProgress(expectedInput, validation.normalizedInput)}</div>
          <input
            aria-label={`${step.title} 입력`}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            className={styles.tutorialInput}
            onChange={(event) => setInput(event.currentTarget.value)}
            placeholder={step.romajiHint}
            spellCheck={false}
            value={input}
          />
          <div className={styles.progressTrack} aria-hidden="true">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className={`${styles.statusBox} ${isCorrect ? styles.statusCorrect : validation.state === InputValidationState.Incorrect ? styles.statusError : ""}`}>
          <strong>{statusLabel}</strong>
          <p>{step.note}</p>
        </div>

        <div className={styles.actionRow}>
          <button disabled={stepIndex === 0} onClick={() => goToStep(stepIndex - 1)} type="button">
            이전
          </button>
          <button disabled={!input} onClick={() => setInput("")} type="button">
            다시 입력
          </button>
          <button className={styles.primaryButton} disabled={!isCorrect} onClick={completeCurrentStep} type="button">
            {stepIndex === STEPS.length - 1 ? "완료" : "다음 단계"}
          </button>
        </div>
      </div>

      <aside className={styles.summaryCard}>
        <span>Next</span>
        <h2>{allCompleted ? "이제 곡을 선택해보세요" : "튜토리얼 목표"}</h2>
        <p>
          {allCompleted
            ? "기본 입력 규칙을 모두 확인했습니다. 짧은 J-POP 라인부터 실제 플레이를 시작할 수 있습니다."
            : "처음에는 정확도가 속도보다 중요합니다. 파란색으로 표시되는 글자를 천천히 따라가세요."}
        </p>
        <Link href={allCompleted ? "/typing" : "/play?contentId=jpop-lemon"}>
          {allCompleted ? "타이핑 곡 선택하기" : "Lemon으로 연습하기"}
        </Link>
      </aside>
    </section>
  );
}

function renderKanaProgress(text: string, progress: number) {
  const characters = Array.from(text);
  const completedCount = Math.max(0, Math.min(characters.length, Math.floor(characters.length * progress)));

  return characters.map((character, index) => (
    <span className={index < completedCount ? styles.completedKana : index === completedCount && progress > 0 ? styles.activeKana : ""} key={`${character}-${index}`}>
      {character}
    </span>
  ));
}

function renderRomajiProgress(expected: string, input: string) {
  const expectedCharacters = Array.from(expected);
  const inputCharacters = Array.from(input);
  const maxLength = Math.max(expectedCharacters.length, inputCharacters.length);

  return Array.from({ length: maxLength }, (_, index) => {
    const expectedChar = expectedCharacters[index] ?? "";
    const inputChar = inputCharacters[index];
    const className =
      inputChar == null
        ? styles.pendingRomaji
        : inputChar.toLowerCase() === expectedChar.toLowerCase()
          ? styles.correctRomaji
          : styles.incorrectRomaji;

    return (
      <span className={className} key={`${expectedChar}-${index}`}>
        {expectedChar || inputChar}
      </span>
    );
  });
}
