"use client";

import { useEffect } from "react";

import type { DashboardReward } from "./BadgeGallery";
import styles from "./RewardNotification.module.css";

export interface RewardNotificationProps {
  reward: DashboardReward | null;
  variant?: "toast" | "modal";
  autoHideMs?: number;
  onClose: () => void;
}

export function RewardNotification({
  reward,
  variant = "toast",
  autoHideMs = 5000,
  onClose,
}: RewardNotificationProps) {
  useEffect(() => {
    if (!reward || variant === "modal" || autoHideMs <= 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(onClose, autoHideMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [autoHideMs, onClose, reward, variant]);

  if (!reward) {
    return null;
  }

  const content = (
    <section className={styles.card} role="status" aria-live="polite">
      <div className={reward.kind === "TITLE" ? styles.titleIcon : styles.badgeIcon}>
        {reward.icon ?? reward.name.slice(0, 2).toUpperCase()}
      </div>
      <div className={styles.copy}>
        <span>Reward Unlocked</span>
        <h3>{reward.name}</h3>
        {reward.description ? <p>{reward.description}</p> : null}
      </div>
      <button className={styles.closeButton} onClick={onClose} type="button" aria-label="Close reward notification">
        x
      </button>
    </section>
  );

  if (variant === "modal") {
    return (
      <div className={styles.modalBackdrop} role="presentation">
        <div className={styles.modal}>{content}</div>
      </div>
    );
  }

  return <div className={styles.toast}>{content}</div>;
}
