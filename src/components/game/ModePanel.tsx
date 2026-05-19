import { useGameStore } from "./useGameStore";
import type { GamePlayerMode } from "./types";
import styles from "../GamePlayer.module.css";

interface ModePanelProps {
  gameMode: GamePlayerMode;
}

export function ModePanel({ gameMode }: ModePanelProps) {
  const { currentLyric, metrics } = useGameStore();

  return (
    <aside className={styles.modePanel} aria-label="Game mode">
      <div className={styles.modeTitle}>
        모드: {gameMode === "LISTEN_AND_GUESS" ? "Guess" : "Solo"}
      </div>
      <div className={styles.modeDivider} />
      <div className={styles.modeMeta}>
        <span>Line: {currentLyric ? currentLyric.lineIndex + 1 : "-"}</span>
        <span>Speed: {metrics.strokesPerSecond.toFixed(2)} 타/초</span>
      </div>
    </aside>
  );
}
