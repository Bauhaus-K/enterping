import styles from "./BadgeGallery.module.css";

export interface DashboardReward {
  id?: string;
  slug: string;
  name: string;
  description?: string | null;
  kind: "BADGE" | "TITLE";
  icon?: string | null;
  unlockedAt?: string | Date | null;
  triggerValue?: number | null;
}

export interface BadgeGalleryProps {
  rewards: DashboardReward[];
}

export function BadgeGallery({ rewards }: BadgeGalleryProps) {
  return (
    <article className={styles.gallery} aria-label="Badge gallery">
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Rewards</span>
          <h3>Badge Gallery</h3>
        </div>
        <p>{rewards.length} collected</p>
      </div>

      {rewards.length > 0 ? (
        <div className={styles.rewardGrid}>
          {rewards.map((reward) => (
            <section className={styles.rewardCard} key={reward.slug}>
              <div className={reward.kind === "TITLE" ? styles.titleIcon : styles.badgeIcon}>
                {reward.icon ?? getFallbackIcon(reward.name)}
              </div>
              <div>
                <span>{reward.kind}</span>
                <h4>{reward.name}</h4>
                {reward.description ? <p>{reward.description}</p> : null}
                {reward.unlockedAt ? <small>Unlocked {formatDate(reward.unlockedAt)}</small> : null}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <strong>No rewards yet</strong>
          <p>Play a few sessions, build a streak, and the collection will start lighting up.</p>
        </div>
      )}
    </article>
  );
}

function getFallbackIcon(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
