import styles from "./Leaderboard.module.css";

export interface LeaderboardRow {
  rank: number;
  userId: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  value: string;
  valueLabel: string;
  details?: string[];
}

export interface LeaderboardProps {
  title: string;
  subtitle?: string;
  rows: LeaderboardRow[];
  currentUserId?: string;
}

export function Leaderboard({ title, subtitle, rows, currentUserId }: LeaderboardProps) {
  return (
    <article className={styles.board} aria-label={title}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Leaderboard</span>
          <h3>{title}</h3>
        </div>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>

      <ol className={styles.list}>
        {rows.length > 0 ? (
          rows.map((row) => {
            const isCurrentUser = row.userId === currentUserId;

            return (
              <li className={isCurrentUser ? styles.currentUserRow : styles.row} key={`${row.rank}-${row.userId}`}>
                <div className={styles.rank}>{getRankLabel(row.rank)}</div>
                <div className={styles.identity}>
                  <Avatar row={row} />
                  <div>
                    <strong>{row.displayName || row.username}</strong>
                    <span>@{row.username}</span>
                  </div>
                </div>
                <div className={styles.scoreBlock}>
                  <strong>{row.value}</strong>
                  <span>{row.valueLabel}</span>
                </div>
                {row.details?.length ? (
                  <div className={styles.details}>
                    {row.details.map((detail) => (
                      <span key={detail}>{detail}</span>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })
        ) : (
          <li className={styles.emptyRow}>No leaderboard data yet. The crown is just sitting there, suspiciously unattended.</li>
        )}
      </ol>
    </article>
  );
}

function Avatar({ row }: { row: LeaderboardRow }) {
  if (row.avatarUrl) {
    return <img className={styles.avatar} src={row.avatarUrl} alt="" />;
  }

  return <div className={styles.avatarFallback}>{getInitials(row.displayName || row.username)}</div>;
}

function getRankLabel(rank: number): string {
  if (rank === 1) {
    return "1st";
  }

  if (rank === 2) {
    return "2nd";
  }

  if (rank === 3) {
    return "3rd";
  }

  return `${rank}th`;
}

function getInitials(value: string): string {
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
