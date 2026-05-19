import styles from "./AdBanner.module.css";

export interface AdBannerProps {
  placement: "game-sidebar" | "dashboard-sidebar";
  isPremium?: boolean;
  label?: string;
}

export function AdBanner({ placement, isPremium = false, label = "Sponsor slot" }: AdBannerProps) {
  if (isPremium) {
    return null;
  }

  return (
    <aside className={styles.banner} aria-label={`${placement} advertisement placeholder`}>
      <span>Ad Placeholder</span>
      <strong>{label}</strong>
      <p>Premium users will be able to hide this space.</p>
    </aside>
  );
}
