import { cookies } from "next/headers";

import { REWARD_NOTIFICATION_COOKIE } from "./rewardNotificationConstants";
import type { RewardDefinition } from "./rewards";

export async function setPendingRewardNotificationCookie(
  rewards: Array<RewardDefinition & { triggerValue?: number }>,
): Promise<void> {
  if (rewards.length === 0) {
    return;
  }

  const cookieStore = await cookies();
  const payload = rewards.slice(0, 5).map((reward) => ({
    slug: reward.slug,
    name: reward.name,
    description: reward.description,
    kind: reward.kind,
    icon: reward.icon,
    triggerValue: reward.triggerValue ?? null,
  }));
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");

  cookieStore.set(REWARD_NOTIFICATION_COOKIE, encodedPayload, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 5,
    path: "/",
  });
}
