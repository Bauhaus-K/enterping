"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { loadYouTubeIframeApi } from "../lib/youtubePlayer";
import type { QuizAudioSnippet } from "../lib/quizData";
import styles from "./QuizAudioPlayer.module.css";

interface QuizAudioPlayerProps {
  snippet: QuizAudioSnippet;
  maxPlayCount?: number;
  // 새 문제로 바뀔 때 리셋용 key 역할
  resetKey?: string;
  // true면 영상을 화면에 표시 (ANIME 퀴즈용), false면 오디오만 (JPOP 퀴즈용)
  showVideo?: boolean;
  // 영상에 답을 가리는 모자이크/블러 효과를 줄지 여부 (정답 공개 전 표시 보호)
  blurVideo?: boolean;
  playLabel?: string;
}

const DEFAULT_MAX_PLAYS = 3;

export function QuizAudioPlayer({
  snippet,
  maxPlayCount = DEFAULT_MAX_PLAYS,
  resetKey,
  showVideo = false,
  blurVideo = false,
  playLabel,
}: QuizAudioPlayerProps) {
  const playerHostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const stopTimeoutRef = useRef<number | null>(null);
  const monitorIntervalRef = useRef<number | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [remainingMs, setRemainingMs] = useState(snippet.durationSeconds * 1000);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const durationMs = Math.max(500, Math.round(snippet.durationSeconds * 1000));

  const clearTimers = useCallback(() => {
    if (stopTimeoutRef.current !== null) {
      window.clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    if (monitorIntervalRef.current !== null) {
      window.clearInterval(monitorIntervalRef.current);
      monitorIntervalRef.current = null;
    }
  }, []);

  const stopPlayback = useCallback(() => {
    clearTimers();

    try {
      playerRef.current?.pauseVideo();
    } catch (error) {
      console.warn("[QuizAudioPlayer] pauseVideo failed", error);
    }

    setIsPlaying(false);
    setRemainingMs(durationMs);
  }, [clearTimers, durationMs]);

  useEffect(() => {
    let cancelled = false;
    setIsReady(false);
    setErrorMessage(null);

    loadYouTubeIframeApi()
      .then((YTApi) => {
        if (cancelled || !playerHostRef.current) {
          return;
        }

        playerRef.current?.destroy();
        playerRef.current = new YTApi.Player(playerHostRef.current, {
          videoId: snippet.youtubeVideoId,
          width: showVideo ? "100%" : "0",
          height: showVideo ? "100%" : "0",
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            start: Math.floor(snippet.startSeconds),
          },
          events: {
            onReady: () => {
              if (cancelled) return;
              setIsReady(true);
            },
            onError: (event) => {
              setErrorMessage(`재생 오류 (code: ${event.data})`);
              setIsPlaying(false);
            },
          },
        });
      })
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof Error ? error.message : "YouTube 플레이어를 불러올 수 없습니다.",
        );
      });

    return () => {
      cancelled = true;
      clearTimers();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [snippet.youtubeVideoId, snippet.startSeconds, clearTimers]);

  // 문제가 바뀌면 재생 카운트와 상태를 초기화
  useEffect(() => {
    stopPlayback();
    setPlayCount(0);
    setRemainingMs(durationMs);
  }, [resetKey, durationMs, stopPlayback]);

  const handlePlay = () => {
    if (!isReady || isPlaying) return;
    if (playCount >= maxPlayCount) return;

    const player = playerRef.current;
    if (!player) return;

    try {
      player.seekTo(snippet.startSeconds, true);
      player.playVideo();
    } catch (error) {
      setErrorMessage("재생을 시작할 수 없습니다.");
      console.warn("[QuizAudioPlayer] play failed", error);
      return;
    }

    setIsPlaying(true);
    setPlayCount((previous) => previous + 1);

    const startedAt = performance.now();
    setRemainingMs(durationMs);

    monitorIntervalRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const next = Math.max(0, durationMs - elapsed);
      setRemainingMs(next);
    }, 100);

    stopTimeoutRef.current = window.setTimeout(() => {
      stopPlayback();
    }, durationMs);
  };

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const remainingPlays = Math.max(0, maxPlayCount - playCount);
  const progressPercent = isPlaying
    ? 100 - Math.min(100, Math.round((remainingMs / durationMs) * 100))
    : 0;

  const defaultLabel = showVideo
    ? `짧게 보기 (${snippet.durationSeconds}s)`
    : `짧게 듣기 (${snippet.durationSeconds}s)`;
  const buttonAriaLabel = showVideo ? "영상 짧은 구간 재생" : "음악 짧은 구간 재생";

  return (
    <div className={styles.player}>
      {showVideo ? (
        <div className={`${styles.videoStage} ${blurVideo && !isPlaying ? styles.videoBlurred : ""}`}>
          <div ref={playerHostRef} className={styles.videoFrame} />
          {!isPlaying && !isReady ? (
            <div className={styles.videoOverlay}>
              <span>영상 준비 중...</span>
            </div>
          ) : null}
          {!isPlaying && isReady && playCount === 0 ? (
            <div className={styles.videoOverlay}>
              <span>▶ 버튼을 눌러 영상을 재생하세요</span>
            </div>
          ) : null}
        </div>
      ) : (
        <div ref={playerHostRef} className={styles.hiddenStage} aria-hidden="true" />
      )}

      <button
        type="button"
        className={`${styles.playButton} ${isPlaying ? styles.playing : ""}`}
        onClick={handlePlay}
        disabled={!isReady || isPlaying || remainingPlays === 0}
        aria-label={buttonAriaLabel}
      >
        <span className={styles.icon} aria-hidden="true">
          {isPlaying ? "■" : "▶"}
        </span>
        <span className={styles.buttonText}>
          {!isReady
            ? "준비 중..."
            : isPlaying
              ? `${(remainingMs / 1000).toFixed(1)}s`
              : remainingPlays === 0
                ? "재생 횟수 소진"
                : playLabel ?? defaultLabel}
        </span>
      </button>

      <div className={styles.meta}>
        <span>남은 재생: {remainingPlays} / {maxPlayCount}</span>
        <div className={styles.progressTrack} aria-hidden="true">
          <div
            className={styles.progressFill}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
    </div>
  );
}
