import { useGameStore } from "./useGameStore";
import type { GamePlayerMode } from "./types";
import styles from "../GamePlayer.module.css";

interface ModePanelProps {
  gameMode: GamePlayerMode;
  isLoggedIn?: boolean;
}

export function ModePanel({ gameMode, isLoggedIn = false }: ModePanelProps) {
  const { currentLyric, metrics, sessionSaveState } = useGameStore();

  return (
    <aside className={styles.modePanel} aria-label="Game mode">
      <div className={styles.modeTitle}>
        모드: {gameMode === "LISTEN_AND_GUESS" ? "Guess" : "Solo"}
      </div>
      <div className={styles.modeDivider} />
      <div className={styles.modeMeta}>
        <span>Line: {currentLyric ? currentLyric.lineIndex + 1 : "-"}</span>
        <span>Speed: {metrics.strokesPerSecond.toFixed(2)} 타/초</span>
        <span>{getSaveStatusLabel(sessionSaveState, isLoggedIn)}</span>
      </div>
    </aside>
  );
}

function getSaveStatusLabel(
  sessionSaveState: "idle" | "saving" | "saved" | "error",
  isLoggedIn: boolean,
): string {
  if (!isLoggedIn) {
    return "저장: 로그인 필요";
  }

  switch (sessionSaveState) {
    case "saving":
      return "저장: 진행 중";
    case "saved":
      return "저장: 완료";
    case "error":
      return "저장: 실패";
    default:
      return "저장: 대기";
  }
}
