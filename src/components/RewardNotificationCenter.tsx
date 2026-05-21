"use client";

import { useCallback, useEffect, useState } from "react";

import { REWARD_NOTIFICATION_COOKIE } from "../lib/rewardNotificationConstants";
import type { DashboardReward } from "./BadgeGallery";
import { RewardNotification } from "./RewardNotification";

const REWARD_EVENT_NAME = "enterping:reward-unlocked";

interface RewardEventDetail {
  rewards?: DashboardReward[];
}

export function RewardNotificationCenter() {
  const [rewardQueue, setRewardQueue] = useState<DashboardReward[]>([]);
  const activeReward = rewardQueue[0] ?? null;

  const enqueueRewards = useCallback((rewards: DashboardReward[]) => {
    if (rewards.length === 0) {
      return;
    }

    setRewardQueue((previousQueue) => {
      const existingSlugs = new Set(previousQueue.map((reward) => reward.slug));
      const nextRewards = rewards.filter((reward) => !existingSlugs.has(reward.slug));

      return [...previousQueue, ...nextRewards];
    });
  }, []);

  useEffect(() => {
    enqueueRewards(readPendingRewardsFromCookie());
    clearPendingRewardsCookie();
  }, [enqueueRewards]);

  useEffect(() => {
    const handleRewardEvent = (event: Event) => {
      const customEvent = event as CustomEvent<RewardEventDetail>;
      enqueueRewards(customEvent.detail?.rewards ?? []);
    };

    window.addEventListener(REWARD_EVENT_NAME, handleRewardEvent);

    return () => {
      window.removeEventListener(REWARD_EVENT_NAME, handleRewardEvent);
    };
  }, [enqueueRewards]);

  return (
    <RewardNotification
      reward={activeReward}
      onClose={() => setRewardQueue((previousQueue) => previousQueue.slice(1))}
    />
  );
}

export function dispatchRewardNotifications(rewards: DashboardReward[]): void {
  if (typeof window === "undefined" || rewards.length === 0) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<RewardEventDetail>(REWARD_EVENT_NAME, {
      detail: {
        rewards,
      },
    }),
  );
}

function readPendingRewardsFromCookie(): DashboardReward[] {
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${REWARD_NOTIFICATION_COOKIE}=`));

  if (!cookie) {
    return [];
  }

  const encodedPayload = cookie.split("=").slice(1).join("=");

  try {
    const normalizedPayload = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const binary = window.atob(normalizedPayload);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const rewards = JSON.parse(json) as DashboardReward[];

    return Array.isArray(rewards) ? rewards : [];
  } catch {
    return [];
  }
}

function clearPendingRewardsCookie(): void {
  document.cookie = `${REWARD_NOTIFICATION_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`;
}
