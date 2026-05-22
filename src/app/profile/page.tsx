import { GameMode } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { getAccuracyStreak, REWARD_DEFINITIONS, type RewardDefinition } from "../../lib/rewards";
import { AttendanceCheckInButton } from "./AttendanceCheckInButton";
import { ProfileAiFeedback } from "./ProfileAiFeedback";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const KOREA_TIMEZONE = "Asia/Seoul";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: currentUser.id,
    },
    include: {
      rewards: {
        include: {
          reward: true,
        },
        orderBy: {
          unlockedAt: "desc",
        },
      },
      gameSessions: {
        include: {
          content: {
            select: {
              title: true,
              artist: true,
              category: true,
              thumbnailUrl: true,
            },
          },
        },
        orderBy: {
          startedAt: "desc",
        },
        take: 30,
      },
      typoLogs: {
        orderBy: {
          createdAt: "desc",
        },
        take: 100,
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const typingSessions = user.gameSessions.filter(
    (session) => session.gameMode === GameMode.LISTEN_AND_TYPE_LYRICS,
  );
  const quizSessions = user.gameSessions.filter(
    (session) => session.gameMode === GameMode.LISTEN_AND_GUESS,
  );
  const typingAnalysis = buildTypingAnalysis(typingSessions, user.typoLogs);
  const quizAnalysis = buildQuizAnalysis(quizSessions);
  const attendanceDays = buildAttendanceDays(user.consecutiveLoginDays, user.lastLoginAt);
  const totalPlaytimeLabel = formatDuration(user.totalPlaytimeMs);
  const rewardGoals = buildRewardGoals({
    totalPlaytimeMs: user.totalPlaytimeMs,
    consecutiveLoginDays: user.consecutiveLoginDays,
    recentSessions: user.gameSessions,
    unlockedSlugs: user.rewards.map((userReward) => userReward.reward.slug),
  });

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.avatar} aria-hidden="true">
          {getInitial(user.displayName ?? user.username)}
        </div>
        <div className={styles.heroCopy}>
          <span>My Enterping Profile</span>
          <h1>{user.displayName ?? user.username}</h1>
          <p>
            타이핑과 퀴즈 플레이 기록을 모아 실력 변화, 획득 뱃지, 출석 상태를 한눈에 확인할 수
            있습니다.
          </p>
        </div>
        <div className={styles.heroStats}>
          <MetricCard label="누적 플레이" value={totalPlaytimeLabel} />
          <MetricCard label="연속 출석" value={`${user.consecutiveLoginDays}일`} />
          <MetricCard label="획득 뱃지" value={`${user.rewards.length}개`} />
        </div>
      </section>

      <section className={styles.grid}>
        <article className={`${styles.panel} ${styles.badgePanel}`}>
          <PanelHeader eyebrow="Rewards" title="뱃지" description="조건을 달성하면 자동으로 수집됩니다." />
          {user.rewards.length > 0 ? (
            <div className={styles.badgeGrid}>
              {user.rewards.map((userReward) => (
                <section className={styles.badgeCard} key={userReward.id}>
                  <div className={styles.badgeIcon}>{userReward.reward.icon ?? getFallbackIcon(userReward.reward.name)}</div>
                  <div>
                    <span>{userReward.reward.kind === "TITLE" ? "칭호" : "뱃지"}</span>
                    <h3>{userReward.reward.name}</h3>
                    {userReward.reward.description ? <p>{userReward.reward.description}</p> : null}
                    <small>{formatDate(userReward.unlockedAt)} 획득</small>
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <EmptyState
              title="아직 획득한 뱃지가 없습니다"
              description="타이핑을 플레이하고 출석을 이어가면 첫 뱃지가 열립니다."
              href="/typing"
              action="타이핑 시작하기"
            />
          )}
        </article>

        <article className={`${styles.panel} ${styles.attendancePanel}`}>
          <PanelHeader eyebrow="Attendance" title="출석 체크" description="로그인할 때마다 연속 출석이 갱신됩니다." />
          <div className={styles.streakCard}>
            <strong>{user.consecutiveLoginDays}</strong>
            <span>일 연속 출석 중</span>
            <p>마지막 출석: {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "기록 없음"}</p>
          </div>
          <AttendanceCheckInButton />
          <div className={styles.attendanceTrack} aria-label="최근 7일 출석 현황">
            {attendanceDays.map((day) => (
              <div className={day.checked ? styles.attendanceChecked : styles.attendanceEmpty} key={day.key}>
                <span>{day.label}</span>
                <strong>{day.checked ? "출석" : "-"}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className={`${styles.panel} ${styles.rewardGoalPanel}`}>
          <PanelHeader eyebrow="Automation" title="다음 뱃지 목표" description="플레이와 출석 기록에 따라 자동으로 잠금 해제됩니다." />
          <div className={styles.rewardGoalList}>
            {rewardGoals.map((goal) => (
              <section className={styles.rewardGoalCard} key={goal.slug}>
                <div>
                  <span>{goal.kind === "TITLE" ? "칭호" : "뱃지"}</span>
                  <h3>{goal.name}</h3>
                  <p>{goal.description}</p>
                </div>
                <strong>{goal.progressLabel}</strong>
                <div className={styles.goalTrack} aria-label={`${goal.name} progress`}>
                  <span style={{ width: `${goal.progressPercent}%` }} />
                </div>
              </section>
            ))}
          </div>
        </article>

        <article className={`${styles.panel} ${styles.analysisPanel}`}>
          <PanelHeader eyebrow="Skill Analysis" title="실력 분석" description="타이핑과 퀴즈 기록을 나누어 보여줍니다." />
          <div className={styles.analysisGrid}>
            <SkillCard
              title="타이핑"
              score={`${typingAnalysis.averageSpm} 타/분`}
              description={`정확도 ${typingAnalysis.averageAccuracy}% · 최근 ${typingSessions.length}회 기준`}
              details={[
                `오타 로그 ${user.typoLogs.length}개`,
                `취약 키 ${typingAnalysis.weakKeys.length > 0 ? typingAnalysis.weakKeys.join(", ").toUpperCase() : "아직 없음"}`,
                typingAnalysis.recommendation,
              ]}
            />
            <SkillCard
              title="퀴즈"
              score={`${quizAnalysis.averageScore}점`}
              description={`정답률 추정 ${quizAnalysis.estimatedAccuracy}% · 최근 ${quizSessions.length}회 기준`}
              details={[
                `최고 점수 ${quizAnalysis.bestScore}점`,
                `플레이 ${quizSessions.length}회`,
                quizAnalysis.recommendation,
              ]}
            />
          </div>
        </article>

        <ProfileAiFeedback userId={user.id} typoLogCount={user.typoLogs.length} />

        <article className={`${styles.panel} ${styles.historyPanel}`}>
          <PanelHeader eyebrow="History" title="히스토리" description="최근 플레이 기록을 최신순으로 보여줍니다." />
          {user.gameSessions.length > 0 ? (
            <div className={styles.historyList}>
              {user.gameSessions.slice(0, 12).map((session) => (
                <section className={styles.historyItem} key={session.id}>
                  <div className={styles.historyThumb}>
                    {session.content.thumbnailUrl ? (
                      <img src={session.content.thumbnailUrl} alt={`${session.content.title} thumbnail`} />
                    ) : (
                      <span>{session.content.title.slice(0, 1)}</span>
                    )}
                  </div>
                  <div>
                    <span>{session.gameMode === GameMode.LISTEN_AND_GUESS ? "퀴즈" : "타이핑"}</span>
                    <h3>{session.content.title}</h3>
                    <p>{session.content.artist ?? session.content.category}</p>
                  </div>
                  <dl>
                    <div>
                      <dt>{session.score}</dt>
                      <dd>점수</dd>
                    </div>
                    <div>
                      <dt>{session.accuracy.toFixed(1)}%</dt>
                      <dd>정확도</dd>
                    </div>
                    <div>
                      <dt>{Math.round(session.strokesPerMinute)}</dt>
                      <dd>타/분</dd>
                    </div>
                  </dl>
                  <time>{formatDate(session.startedAt)}</time>
                </section>
              ))}
            </div>
          ) : (
            <EmptyState
              title="아직 플레이 히스토리가 없습니다"
              description="곡을 하나 선택해 플레이하면 이곳에 기록이 쌓입니다."
              href="/typing"
              action="첫 기록 만들기"
            />
          )}
        </article>
      </section>
    </main>
  );
}

function PanelHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className={styles.panelHeader}>
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <p>{description}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className={styles.metricCard}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function SkillCard({
  title,
  score,
  description,
  details,
}: {
  title: string;
  score: string;
  description: string;
  details: string[];
}) {
  return (
    <section className={styles.skillCard}>
      <div>
        <span>{title}</span>
        <strong>{score}</strong>
        <p>{description}</p>
      </div>
      <ul>
        {details.map((detail) => (
          <li key={detail}>{detail}</li>
        ))}
      </ul>
    </section>
  );
}

function EmptyState({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className={styles.emptyState}>
      <strong>{title}</strong>
      <p>{description}</p>
      <Link href={href}>{action}</Link>
    </div>
  );
}

function buildTypingAnalysis(
  sessions: Array<{ strokesPerMinute: number; accuracy: number }>,
  typoLogs: Array<{ inputtedCharacter: string }>,
) {
  const averageSpm = Math.round(average(sessions.map((session) => session.strokesPerMinute)));
  const averageAccuracy = average(sessions.map((session) => session.accuracy)).toFixed(1);
  const weakKeys = Object.entries(
    typoLogs.reduce<Record<string, number>>((frequencies, typoLog) => {
      const key = typoLog.inputtedCharacter.trim().toLowerCase().match(/[a-z]/)?.[0];

      if (key) {
        frequencies[key] = (frequencies[key] ?? 0) + 1;
      }

      return frequencies;
    }, {}),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([key]) => key);

  return {
    averageSpm,
    averageAccuracy,
    weakKeys,
    recommendation:
      sessions.length > 0
        ? "최근 기록을 기준으로 속도와 정확도를 함께 관리하고 있습니다."
        : "타이핑을 한 번 플레이하면 속도와 정확도 분석이 시작됩니다.",
  };
}

function buildQuizAnalysis(sessions: Array<{ score: number; accuracy: number }>) {
  const averageScore = Math.round(average(sessions.map((session) => session.score)));
  const estimatedAccuracy = average(sessions.map((session) => session.accuracy)).toFixed(1);
  const bestScore = Math.max(...sessions.map((session) => session.score), 0);

  return {
    averageScore,
    estimatedAccuracy,
    bestScore,
    recommendation:
      sessions.length > 0
        ? "자주 틀리는 작품군을 중심으로 다시 플레이하면 점수가 안정됩니다."
        : "퀴즈 솔로 또는 대전 모드를 플레이하면 분석이 채워집니다.",
  };
}

function buildAttendanceDays(streak: number, lastLoginAt: Date | null) {
  const now = new Date();
  const checkedUntil = lastLoginAt ?? now;
  const checkedDates = new Set<string>();

  for (let index = 0; index < Math.min(streak, 7); index += 1) {
    const date = new Date(checkedUntil);
    date.setDate(date.getDate() - index);
    checkedDates.add(toKoreaDateKey(date));
  }

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - index));
    const key = toKoreaDateKey(date);

    return {
      key,
      label: new Intl.DateTimeFormat("ko-KR", {
        weekday: "short",
        timeZone: KOREA_TIMEZONE,
      }).format(date),
      checked: checkedDates.has(key),
    };
  });
}

function buildRewardGoals({
  totalPlaytimeMs,
  consecutiveLoginDays,
  recentSessions,
  unlockedSlugs,
}: {
  totalPlaytimeMs: number;
  consecutiveLoginDays: number;
  recentSessions: Array<{ accuracy: number; startedAt: Date; createdAt: Date }>;
  unlockedSlugs: string[];
}) {
  const unlockedSlugSet = new Set(unlockedSlugs);
  const accuracyStreak = getAccuracyStreak(recentSessions);

  return REWARD_DEFINITIONS.map((definition) => {
    const currentValue = getRewardProgressValue({
      definition,
      totalPlaytimeMs,
      consecutiveLoginDays,
      accuracyStreak,
    });
    const progressPercent = Math.min(Math.round((currentValue / definition.threshold) * 100), 100);

    return {
      ...definition,
      progressPercent,
      progressLabel: unlockedSlugSet.has(definition.slug)
        ? "획득 완료"
        : `${formatRewardProgressValue(definition, currentValue)} / ${formatRewardProgressValue(definition, definition.threshold)}`,
    };
  });
}

function getRewardProgressValue({
  definition,
  totalPlaytimeMs,
  consecutiveLoginDays,
  accuracyStreak,
}: {
  definition: RewardDefinition;
  totalPlaytimeMs: number;
  consecutiveLoginDays: number;
  accuracyStreak: number;
}) {
  switch (definition.metric) {
    case "TOTAL_PLAYTIME_MS":
      return totalPlaytimeMs;
    case "LOGIN_STREAK":
      return consecutiveLoginDays;
    case "ACCURACY_STREAK":
      return accuracyStreak;
  }
}

function formatRewardProgressValue(definition: RewardDefinition, value: number): string {
  if (definition.metric === "TOTAL_PLAYTIME_MS") {
    return formatDuration(value);
  }

  if (definition.metric === "LOGIN_STREAK") {
    return `${value}일`;
  }

  return `${value}게임`;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatDuration(milliseconds: number): string {
  const totalMinutes = Math.floor(milliseconds / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }

  return `${minutes}분`;
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    timeZone: KOREA_TIMEZONE,
  }).format(value);
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: KOREA_TIMEZONE,
  }).format(value);
}

function toKoreaDateKey(value: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: KOREA_TIMEZONE,
  }).format(value);
}

function getInitial(value: string): string {
  return Array.from(value.trim())[0]?.toUpperCase() ?? "E";
}

function getFallbackIcon(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}
