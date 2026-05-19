import { useGameStore } from "./useGameStore";
import styles from "../GamePlayer.module.css";

export function StatsPanel() {
  const { metrics, typoLogs, peakStrokesPerMinute } = useGameStore();

  return (
    <aside className={styles.statsPanel} aria-label="Typing statistics">
      <div className={styles.panelLabel}>타이핑 통계</div>
      <div className={styles.statsGrid}>
        <article>
          <span>현재 WPM</span>
          <strong>{Math.round(metrics.strokesPerMinute)}</strong>
        </article>
        <article>
          <span>최고 WPM</span>
          <strong>{Math.round(peakStrokesPerMinute)}</strong>
        </article>
        <article>
          <span>정확도</span>
          <strong>{metrics.accuracy.toFixed(1)}%</strong>
        </article>
        <article>
          <span>오타수</span>
          <strong>{typoLogs.length}</strong>
        </article>
      </div>
    </aside>
  );
}
