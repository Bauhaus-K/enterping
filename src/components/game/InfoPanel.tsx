import { useGameStore, PLAYER_STATE } from "./useGameStore";
import { TypingInputMode } from "../../lib/typingEngine";
import type { GamePlayerContent } from "./types";
import styles from "../GamePlayer.module.css";

interface InfoPanelProps {
  content: GamePlayerContent;
  inputMode: TypingInputMode;
}

function formatTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function getPlayerStateLabel(state: number): string {
  switch (state) {
    case PLAYER_STATE.PLAYING:
      return "재생 중";
    case PLAYER_STATE.PAUSED:
      return "일시정지";
    case PLAYER_STATE.BUFFERING:
      return "버퍼링";
    case PLAYER_STATE.ENDED:
      return "종료";
    case PLAYER_STATE.CUED:
      return "준비 완료";
    default:
      return "대기 중";
  }
}

export function InfoPanel({ content, inputMode }: InfoPanelProps) {
  const { isPlayerReady, playerState, currentTimestampMs } = useGameStore();
  const statusLabel =
    !isPlayerReady && playerState === PLAYER_STATE.PLAYING
      ? "LRC 연습"
      : isPlayerReady
        ? getPlayerStateLabel(playerState)
        : "불러오는 중";

  return (
    <aside className={styles.infoPanel} aria-label="Video information">
      <div className={styles.panelLabel}>영상정보</div>
      <div className={styles.infoDecor}>
        <span />
        <span />
      </div>
      <div className={styles.infoIdentity}>
        <span className={styles.infoAvatar} aria-hidden="true" />
        <div>
          <h2>{content.title}</h2>
          <p>{content.artist ?? "Unknown artist"}</p>
        </div>
      </div>
      <div className={styles.infoMeta}>
        <strong>재생 시간: {formatTime(currentTimestampMs)}</strong>
        <span>업로드 날짜</span>
        <span>상태: {statusLabel}</span>
      </div>
      <div className={styles.tagRow}>
        <span>{content.category ?? "JPOP"}</span>
        <span>{inputMode === TypingInputMode.Hangul ? "Hangul" : "Romaji"}</span>
        <span>Lyrics</span>
      </div>
    </aside>
  );
}
