"use client";

import { useState } from "react";

import { AiFeedbackCard } from "../../components/AiFeedbackCard";
import type { AiErrorFeedback } from "../../lib/aiAnalysisPrompt";
import styles from "./page.module.css";

interface AnalyzeTyposResponse {
  feedback?: AiErrorFeedback;
  analyzedTypoCount?: number;
  error?: string;
}

export function ProfileAiFeedback({
  userId,
  typoLogCount,
}: {
  userId: string;
  typoLogCount: number;
}) {
  const [feedback, setFeedback] = useState<AiErrorFeedback | null>(null);
  const [analyzedTypoCount, setAnalyzedTypoCount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const canAnalyze = typoLogCount > 0;

  const handleAnalyze = async () => {
    if (!canAnalyze || isLoading) {
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/analyze-typos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
      const data = (await response.json()) as AnalyzeTyposResponse;

      if (!response.ok || !data.feedback) {
        throw new Error(data.error ?? "AI feedback request failed.");
      }

      setFeedback(data.feedback);
      setAnalyzedTypoCount(data.analyzedTypoCount ?? null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "AI feedback request failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <article className={`${styles.panel} ${styles.aiFeedbackPanel}`}>
      <div className={styles.aiFeedbackHeader}>
        <div>
          <span>AI Coach</span>
          <h2>AI 피드백</h2>
          <p>
            최근 오타 로그를 OpenAI로 분석해 촉음, 장음, 요음, し/ち/つ 같은 일본어 발음 패턴별
            훈련 팁을 생성합니다.
          </p>
        </div>
        <button disabled={!canAnalyze || isLoading} onClick={handleAnalyze} type="button">
          {isLoading ? "분석 중..." : "AI 피드백 생성"}
        </button>
      </div>

      {!canAnalyze ? (
        <div className={styles.aiFeedbackNotice}>
          타이핑을 몇 번 플레이해 오타 로그가 쌓이면 AI 피드백을 생성할 수 있습니다.
        </div>
      ) : errorMessage ? (
        <div className={styles.aiFeedbackError}>{errorMessage}</div>
      ) : analyzedTypoCount !== null ? (
        <div className={styles.aiFeedbackNotice}>최근 오타 로그 {analyzedTypoCount}개를 분석했습니다.</div>
      ) : null}

      <AiFeedbackCard feedback={feedback} isLoading={isLoading} />
    </article>
  );
}
