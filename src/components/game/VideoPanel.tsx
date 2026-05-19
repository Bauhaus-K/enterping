import { useEffect, useRef, CSSProperties } from "react";
import { useGameStore, PLAYER_STATE } from "./useGameStore";
import type { GamePlayerContent } from "./types";
import styles from "../GamePlayer.module.css";

interface VideoPanelProps {
  content: GamePlayerContent;
  autoPlay?: boolean;
  pollIntervalMs?: number;
  firstLyricStartMs?: number;
}

let youtubeApiPromise: Promise<typeof YT> | null = null;

function loadYouTubeIframeApi(): Promise<typeof YT> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube IFrame API can only be loaded in the browser."));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise((resolve) => {
    const previousReadyHandler = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousReadyHandler?.();

      if (window.YT) {
        resolve(window.YT);
      }
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
}

function getBackdropStyle(thumbnailUrl?: string | null): CSSProperties | undefined {
  if (!thumbnailUrl) {
    return undefined;
  }

  return {
    backgroundImage: `linear-gradient(180deg, rgba(10, 16, 28, 0.16), rgba(10, 16, 28, 0.42)), url(${thumbnailUrl})`,
  };
}

export function VideoPanel({
  content,
  autoPlay = false,
  pollIntervalMs = 250,
  firstLyricStartMs = 0,
}: VideoPanelProps) {
  const playerHostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const fallbackRafRef = useRef<number | null>(null);
  const fallbackTimeoutRef = useRef<number | null>(null);
  const fallbackStartedAtRef = useRef<number | null>(null);
  const fallbackBaseTimestampRef = useRef<number>(0);
  
  const { 
    playerState, 
    playerError, 
    isPlayerReady,
    setIsPlayerReady, 
    setPlayerState, 
    setPlayerError,
    setCurrentTimestampMs,
    setElapsedMs,
    ensureSessionStarted,
    sessionStartedMonotonicMs
  } = useGameStore();

  const hasPlaybackStarted = playerState !== PLAYER_STATE.UNSTARTED && playerState !== PLAYER_STATE.CUED;
  const canShowPlayOverlay =
    (playerState === PLAYER_STATE.UNSTARTED ||
      playerState === PLAYER_STATE.CUED ||
      playerState === PLAYER_STATE.PAUSED ||
      !isPlayerReady);

  const stopFallbackPlayback = () => {
    if (fallbackTimeoutRef.current !== null) {
      window.clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }

    if (fallbackRafRef.current !== null) {
      window.cancelAnimationFrame(fallbackRafRef.current);
      fallbackRafRef.current = null;
    }

    fallbackStartedAtRef.current = null;
  };

  const startFallbackPlayback = (reason: string) => {
    stopFallbackPlayback();
    ensureSessionStarted();

    const now = performance.now();
    const store = useGameStore.getState();
    const startTimestampMs = Math.max(store.currentTimestampMs, firstLyricStartMs);
    fallbackStartedAtRef.current = now;
    fallbackBaseTimestampRef.current = startTimestampMs;
    setCurrentTimestampMs(startTimestampMs);
    setPlayerState(PLAYER_STATE.PLAYING);

    console.log("[Enterping][YouTubeSync] fallback lyric timer started", {
      contentId: content.id,
      reason,
      baseTimestampMs: startTimestampMs,
    });

    const tick = () => {
      const startedAt = fallbackStartedAtRef.current;
      if (startedAt === null) return;

      const timestampMs = fallbackBaseTimestampRef.current + performance.now() - startedAt;
      setCurrentTimestampMs(Math.max(0, Math.round(timestampMs)));

      const sessionMonotonic = useGameStore.getState().sessionStartedMonotonicMs;
      if (sessionMonotonic !== null) {
        setElapsedMs(Math.round(performance.now() - sessionMonotonic));
      }

      fallbackRafRef.current = window.requestAnimationFrame(tick);
    };

    fallbackRafRef.current = window.requestAnimationFrame(tick);
  };

  useEffect(() => {
    let cancelled = false;

    setIsPlayerReady(false);
    setPlayerError(null);

    loadYouTubeIframeApi()
      .then((YTApi) => {
        if (cancelled || !playerHostRef.current) {
          return;
        }

        playerRef.current?.destroy();
        playerRef.current = new YTApi.Player(playerHostRef.current, {
          videoId: content.youtubeVideoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: autoPlay ? 1 : 0,
            controls: 1,
            enablejsapi: 1,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              if (!cancelled) {
                setIsPlayerReady(true);
              }
            },
            onStateChange: (event) => {
              setPlayerState(event.data);
              if (event.data === PLAYER_STATE.PLAYING) {
                stopFallbackPlayback();
                ensureSessionStarted();
              }
            },
            onError: (event) => {
              setPlayerError(`YouTube player error: ${event.data}`);
            },
          },
        });
      })
      .catch((error: unknown) => {
        setPlayerError(error instanceof Error ? error.message : "Unable to load YouTube player.");
      });

    return () => {
      cancelled = true;
      stopFallbackPlayback();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [autoPlay, content.id, content.youtubeVideoId, ensureSessionStarted, setIsPlayerReady, setPlayerError, setPlayerState]);

  useEffect(() => {
    if (!isPlayerReady) return;

    let cancelled = false;
    let rafId: number | null = null;
    let baselineTimestampMs = 0;
    let baselineMonotonicMs = performance.now();
    let lastPlayerTimeMs = -1;

    const readPlaybackRate = (): number => {
      const player = playerRef.current as (YT.Player & { getPlaybackRate?: () => number }) | null;
      try {
        const rate = player?.getPlaybackRate?.();
        return typeof rate === "number" && rate > 0 ? rate : 1;
      } catch {
        return 1;
      }
    };

    const tick = () => {
      if (cancelled) return;

      const player = playerRef.current;
      const state = useGameStore.getState().playerState;
      const isAdvancing = state === PLAYER_STATE.PLAYING;

      if (player) {
        try {
          const currentPlayerTimeMs = Math.round(player.getCurrentTime() * 1000);
          // YouTube API의 시간이 실제로 업데이트된 순간에만 기준점(baseline)을 갱신합니다.
          // 이렇게 하면 이전처럼 setInterval에 의해 시간이 뒤로 튀는 현상(Stuttering)을 완벽히 방지합니다.
          if (currentPlayerTimeMs !== lastPlayerTimeMs) {
            baselineTimestampMs = currentPlayerTimeMs;
            baselineMonotonicMs = performance.now();
            lastPlayerTimeMs = currentPlayerTimeMs;
          }
        } catch (error) {
          // Ignore
        }
      }

      let estimatedMs = baselineTimestampMs;
      if (isAdvancing) {
        const elapsed = performance.now() - baselineMonotonicMs;
        const rate = readPlaybackRate();
        estimatedMs = baselineTimestampMs + elapsed * rate;
      }

      const roundedMs = Math.max(0, Math.round(estimatedMs));
      setCurrentTimestampMs(roundedMs);

      const sessionMonotonic = useGameStore.getState().sessionStartedMonotonicMs;
      if (sessionMonotonic !== null) {
        setElapsedMs(Math.round(performance.now() - sessionMonotonic));
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [isPlayerReady, setCurrentTimestampMs, setElapsedMs]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const latest = useGameStore.getState();
      const hasNotStarted =
        latest.playerState === PLAYER_STATE.UNSTARTED || latest.playerState === PLAYER_STATE.CUED;

      if (!latest.isPlayerReady && hasNotStarted) {
        setPlayerError("YouTube player is unavailable, so Enterping started LRC practice mode.");
        startFallbackPlayback("youtube-api-timeout");
      }
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [content.id, setPlayerError]);

  const handlePlayClick = () => {
    const player = playerRef.current;

    if (!player) {
      setPlayerError("YouTube player is still loading. Typing practice timer started instead.");
      startFallbackPlayback("youtube-player-not-ready");
      return;
    }

    try {
      ensureSessionStarted();
      setPlayerError(null);
      player.playVideo();
      fallbackTimeoutRef.current = window.setTimeout(() => {
        const latestState = useGameStore.getState().playerState;
        if (latestState !== PLAYER_STATE.PLAYING) {
          setPlayerError("YouTube playback did not start, so Enterping started LRC practice mode.");
          startFallbackPlayback("youtube-state-did-not-advance");
        }
      }, 900);
      console.log("[Enterping][YouTubeSync] manual play requested", {
        contentId: content.id,
        videoId: content.youtubeVideoId,
      });
    } catch (error) {
      setPlayerError(error instanceof Error ? error.message : "Unable to start YouTube playback.");
      startFallbackPlayback("youtube-play-video-threw");
    }
  };

  return (
    <section className={styles.videoPanel} aria-label="YouTube video player">
      <div
        className={`${styles.videoFrame} ${hasPlaybackStarted ? styles.videoFrameActive : ""}`}
        style={hasPlaybackStarted ? undefined : getBackdropStyle(content.thumbnailUrl)}
        onClick={canShowPlayOverlay ? handlePlayClick : undefined}
        role={canShowPlayOverlay ? "button" : undefined}
        tabIndex={canShowPlayOverlay ? 0 : undefined}
        onKeyDown={(event) => {
          if (!canShowPlayOverlay) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handlePlayClick();
          }
        }}
      >
        <div ref={playerHostRef} className={styles.playerHost} />
        {canShowPlayOverlay ? (
          <button
            className={styles.playOverlayButton}
            onClick={(event) => {
              event.stopPropagation();
              handlePlayClick();
            }}
            type="button"
            aria-label="영상 재생"
          >
            <span className={styles.playGlyph} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {playerError ? <p className={styles.errorText}>{playerError}</p> : null}
    </section>
  );
}
