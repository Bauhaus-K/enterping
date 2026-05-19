import {
  calculateConsecutiveLoginDays,
  evaluateRewardUnlocks,
  getAccuracyStreak,
  shouldResetMissedLoginStreak,
} from "./rewards";

describe("reward streak logic", () => {
  it("increments a login streak when the user logs in on the next local day", () => {
    const nextStreak = calculateConsecutiveLoginDays({
      previousLastLoginAt: new Date("2026-04-29T01:00:00.000Z"),
      currentLoginAt: new Date("2026-04-30T01:00:00.000Z"),
      previousStreak: 4,
    });

    expect(nextStreak).toBe(5);
  });

  it("keeps the same streak for multiple logins on the same day", () => {
    const nextStreak = calculateConsecutiveLoginDays({
      previousLastLoginAt: new Date("2026-04-30T01:00:00.000Z"),
      currentLoginAt: new Date("2026-04-30T13:00:00.000Z"),
      previousStreak: 4,
    });

    expect(nextStreak).toBe(4);
  });

  it("resets the login streak when a day was missed", () => {
    expect(
      shouldResetMissedLoginStreak({
        lastLoginAt: new Date("2026-04-28T01:00:00.000Z"),
        currentDate: new Date("2026-04-30T01:00:00.000Z"),
        consecutiveLoginDays: 7,
      }),
    ).toBe(true);
  });
});

describe("reward unlock evaluation", () => {
  it("counts consecutive 95% accuracy sessions from the newest session backwards", () => {
    const streak = getAccuracyStreak([
      { accuracy: 95, startedAt: "2026-04-30T00:00:00.000Z" },
      { accuracy: 96, startedAt: "2026-04-29T00:00:00.000Z" },
      { accuracy: 94.9, startedAt: "2026-04-28T00:00:00.000Z" },
      { accuracy: 99, startedAt: "2026-04-27T00:00:00.000Z" },
    ]);

    expect(streak).toBe(2);
  });

  it("returns newly unlocked playtime, streak, and accuracy rewards", () => {
    const unlocks = evaluateRewardUnlocks({
      totalPlaytimeMs: 10 * 60 * 60 * 1000,
      consecutiveLoginDays: 10,
      recentSessions: Array.from({ length: 5 }, (_, index) => ({
        accuracy: 96,
        startedAt: new Date(Date.UTC(2026, 3, 30 - index)).toISOString(),
      })),
      existingRewardSlugs: ["j-pop-beginner"],
    });

    expect(unlocks.map((unlock) => unlock.definition.slug)).toEqual(
      expect.arrayContaining(["anime-master", "ten-day-streak", "precision-idol"]),
    );
    expect(unlocks.map((unlock) => unlock.definition.slug)).not.toContain("j-pop-beginner");
  });
});
