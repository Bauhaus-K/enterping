"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { dispatchRewardNotifications } from "../../components/RewardNotificationCenter";
import styles from "./page.module.css";

export function AttendanceCheckInButton() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "checking" | "checked" | "error">("idle");

  const handleClick = async () => {
    setStatus("checking");

    try {
      const response = await fetch("/api/attendance/check-in", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Attendance check-in failed with status ${response.status}`);
      }

      const data = (await response.json()) as {
        unlockedRewards?: Parameters<typeof dispatchRewardNotifications>[0];
      };

      dispatchRewardNotifications(data.unlockedRewards ?? []);
      setStatus("checked");
      router.refresh();
    } catch (error) {
      console.error("[Enterping][Attendance] Check-in failed", error);
      setStatus("error");
    }
  };

  return (
    <div className={styles.checkInBox}>
      <button disabled={status === "checking"} onClick={handleClick} type="button">
        {status === "checking" ? "출석 확인 중..." : "오늘 출석 체크"}
      </button>
      <span>
        {status === "checked"
          ? "출석 정보가 갱신되었습니다."
          : status === "error"
            ? "출석 체크 중 오류가 발생했습니다."
            : "로그인 유지 중에도 하루 1회 직접 갱신할 수 있습니다."}
      </span>
    </div>
  );
}
