import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { isAdminUser } from "../../../lib/admin";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

interface RecentSession {
  id: string;
  userId: string;
  contentId: string;
  accuracy: number;
  score: number;
  playtimeMs: number;
  startedAt: Date;
  content: {
    id: string;
    title: string;
    artist: string | null;
    category: string;
    thumbnailUrl: string | null;
    playCount: number;
  };
  lineResults: Array<{
    lyricSyncId: string | null;
    lineIndex: number;
    japaneseText: string;
    expectedInput: string;
    submittedInput: string;
    responseDelayMs: number | null;
    typoCount: number;
    isSuccess: boolean;
    isDifficult: boolean;
  }>;
}

interface PopularSongMetric {
  id: string;
  title: string;
  artist: string | null;
  category: string;
  thumbnailUrl: string | null;
  totalPlayCount: number;
  recentSessions: number;
  recentPlaytimeMs: number;
}

interface FailureSongMetric {
  id: string;
  title: string;
  artist: string | null;
  category: string;
  thumbnailUrl: string | null;
  attempts: number;
  failedAttempts: number;
  failureRate: number;
  averageAccuracy: number;
}

interface SuspiciousLineMetric {
  key: string;
  contentTitle: string;
  artist: string | null;
  lineIndex: number;
  japaneseText: string;
  expectedInput: string;
  submittedInputSample: string;
  attempts: number;
  failedAttempts: number;
  failureRate: number;
  averageDelayMs: number;
  averageTypoCount: number;
}

export default async function AdminOperationsPage() {
  const currentUser = await getCurrentUser();

  if (!isAdminUser(currentUser)) {
    redirect("/");
  }

  const now = new Date();
  const since30Days = new Date(now.getTime() - 30 * DAY_MS);
  const since7Days = new Date(now.getTime() - 7 * DAY_MS);
  const todayStart = getStartOfDay(now);

  const [recentSessions, popularContents, dailyActiveUsers, weeklyActiveUsers, totalPublishedContents] =
    await Promise.all([
      getRecentSessions(since30Days),
      getPopularContents(),
      countActiveUsers(todayStart),
      countActiveUsers(since7Days),
      prisma.content.count({ where: { isPublished: true } }),
    ]);

  const popularSongs = buildPopularSongs(recentSessions, popularContents);
  const highFailureSongs = buildHighFailureSongs(recentSessions);
  const suspiciousLines = buildSuspiciousLines(recentSessions);
  const totalRecentSessions = recentSessions.length;
  const averageAccuracy = average(recentSessions.map((session) => session.accuracy));
  const totalRecentPlaytimeMs = sum(recentSessions.map((session) => session.playtimeMs));

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span>ADMIN OPERATIONS</span>
        <h1>운영 대시보드</h1>
        <p>
          최근 30일 플레이 데이터를 기준으로 인기 곡, 실패율 높은 곡, 자막 오류 의심 라인,
          DAU/WAU를 한 번에 확인합니다.
        </p>
        <div className={styles.linkRow}>
          <Link href="/admin/typing">타이핑 곡 관리</Link>
          <Link href="/admin/quiz">퀴즈 관리</Link>
          <Link href="/admin/notices">공지 관리</Link>
        </div>
      </section>

      <section className={styles.metricGrid} aria-label="운영 핵심 지표">
        <MetricCard label="DAU" value={formatNumber(dailyActiveUsers)} note="오늘 플레이한 사용자" tone="mint" />
        <MetricCard label="WAU" value={formatNumber(weeklyActiveUsers)} note="최근 7일 활성 사용자" tone="blue" />
        <MetricCard label="30일 세션" value={formatNumber(totalRecentSessions)} note="최근 플레이 저장 수" tone="pink" />
        <MetricCard label="평균 정확도" value={`${averageAccuracy.toFixed(1)}%`} note="최근 30일 기준" tone="amber" />
        <MetricCard label="공개 곡" value={formatNumber(totalPublishedContents)} note="타이핑 콘텐츠 수" tone="mint" />
        <MetricCard label="총 플레이 시간" value={formatDuration(totalRecentPlaytimeMs)} note="최근 30일 누적" tone="blue" />
      </section>

      <section className={styles.dashboardGrid}>
        <DashboardPanel eyebrow="POPULAR" title="인기 곡 TOP 10" description="최근 세션 수와 전체 playCount를 함께 반영합니다.">
          <div className={styles.songList}>
            {popularSongs.length > 0 ? (
              popularSongs.map((song, index) => (
                <SongMetricRow key={song.id} rank={index + 1} song={song} />
              ))
            ) : (
              <EmptyState text="아직 인기 곡을 계산할 플레이 데이터가 없습니다." />
            )}
          </div>
        </DashboardPanel>

        <DashboardPanel eyebrow="RISK" title="실패율 높은 곡" description="라인 실패/어려움 플래그와 낮은 정확도 세션을 기준으로 정렬합니다.">
          <div className={styles.failureList}>
            {highFailureSongs.length > 0 ? (
              highFailureSongs.map((song) => (
                <article className={styles.failureCard} key={song.id}>
                  <div>
                    <strong>{song.title}</strong>
                    <span>{song.artist ?? "Unknown Artist"} · {song.category}</span>
                  </div>
                  <div className={styles.progressTrack} aria-hidden="true">
                    <span style={{ width: `${Math.round(song.failureRate * 100)}%` }} />
                  </div>
                  <p>
                    실패율 <b>{formatPercent(song.failureRate)}</b> · 시도 {song.attempts}회 · 평균 정확도{" "}
                    {song.averageAccuracy.toFixed(1)}%
                  </p>
                </article>
              ))
            ) : (
              <EmptyState text="최근 실패율이 높은 곡이 아직 감지되지 않았습니다." />
            )}
          </div>
        </DashboardPanel>
      </section>

      <section className={styles.fullPanel}>
        <div className={styles.panelHeader}>
          <div>
            <span>CAPTION QA</span>
            <h2>자막 오류 의심 라인</h2>
          </div>
          <p>
            여러 사용자가 같은 라인에서 실패하거나, 평균 지연 시간이 길거나, 오타 수가 높은 라인을 우선 확인합니다.
          </p>
        </div>

        <div className={styles.lineTable}>
          <div className={styles.tableHead}>
            <span>곡 / 라인</span>
            <span>가사</span>
            <span>실패율</span>
            <span>평균 지연</span>
            <span>오타</span>
          </div>
          {suspiciousLines.length > 0 ? (
            suspiciousLines.map((line) => (
              <article className={styles.lineRow} key={line.key}>
                <div>
                  <strong>{line.contentTitle}</strong>
                  <span>
                    {line.artist ?? "Unknown Artist"} · #{line.lineIndex + 1}
                  </span>
                </div>
                <div>
                  <p>{line.japaneseText}</p>
                  <small>기대: {line.expectedInput || "없음"} · 입력 예: {line.submittedInputSample || "없음"}</small>
                </div>
                <strong>{formatPercent(line.failureRate)}</strong>
                <strong>{formatMilliseconds(line.averageDelayMs)}</strong>
                <strong>{line.averageTypoCount.toFixed(1)}</strong>
              </article>
            ))
          ) : (
            <EmptyState text="자막 오류 의심 라인이 아직 없습니다. 라인별 결과가 쌓이면 자동으로 표시됩니다." />
          )}
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: "mint" | "blue" | "pink" | "amber";
}) {
  return (
    <article className={`${styles.metricCard} ${styles[tone]}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}

function DashboardPanel({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <p>{description}</p>
      </div>
      {children}
    </section>
  );
}

function SongMetricRow({ rank, song }: { rank: number; song: PopularSongMetric }) {
  return (
    <article className={styles.songRow}>
      <div className={styles.rankBadge}>{rank}</div>
      {song.thumbnailUrl ? <img src={song.thumbnailUrl} alt="" /> : <div className={styles.thumbnailFallback}>♪</div>}
      <div>
        <strong>{song.title}</strong>
        <span>{song.artist ?? "Unknown Artist"} · {song.category}</span>
      </div>
      <dl>
        <div>
          <dt>{formatNumber(song.recentSessions)}</dt>
          <dd>30일 세션</dd>
        </div>
        <div>
          <dt>{formatNumber(song.totalPlayCount)}</dt>
          <dd>누적</dd>
        </div>
      </dl>
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className={styles.emptyState}>{text}</p>;
}

async function getRecentSessions(since: Date): Promise<RecentSession[]> {
  return prisma.gameSession.findMany({
    where: {
      startedAt: {
        gte: since,
      },
    },
    orderBy: {
      startedAt: "desc",
    },
    take: 2000,
    select: {
      id: true,
      userId: true,
      contentId: true,
      accuracy: true,
      score: true,
      playtimeMs: true,
      startedAt: true,
      content: {
        select: {
          id: true,
          title: true,
          artist: true,
          category: true,
          thumbnailUrl: true,
          playCount: true,
        },
      },
      lineResults: {
        select: {
          lyricSyncId: true,
          lineIndex: true,
          japaneseText: true,
          expectedInput: true,
          submittedInput: true,
          responseDelayMs: true,
          typoCount: true,
          isSuccess: true,
          isDifficult: true,
        },
      },
    },
  });
}

async function getPopularContents() {
  return prisma.content.findMany({
    where: {
      isPublished: true,
    },
    orderBy: [{ playCount: "desc" }, { updatedAt: "desc" }],
    take: 10,
    select: {
      id: true,
      title: true,
      artist: true,
      category: true,
      thumbnailUrl: true,
      playCount: true,
    },
  });
}

async function countActiveUsers(since: Date): Promise<number> {
  const activeUsers = await prisma.gameSession.findMany({
    where: {
      startedAt: {
        gte: since,
      },
    },
    distinct: ["userId"],
    select: {
      userId: true,
    },
  });

  return activeUsers.length;
}

function buildPopularSongs(
  recentSessions: RecentSession[],
  popularContents: Awaited<ReturnType<typeof getPopularContents>>,
): PopularSongMetric[] {
  const metrics = new Map<string, PopularSongMetric>();

  for (const content of popularContents) {
    metrics.set(content.id, {
      id: content.id,
      title: content.title,
      artist: content.artist,
      category: content.category,
      thumbnailUrl: content.thumbnailUrl,
      totalPlayCount: content.playCount,
      recentSessions: 0,
      recentPlaytimeMs: 0,
    });
  }

  for (const session of recentSessions) {
    const current = metrics.get(session.contentId) ?? {
      id: session.content.id,
      title: session.content.title,
      artist: session.content.artist,
      category: session.content.category,
      thumbnailUrl: session.content.thumbnailUrl,
      totalPlayCount: session.content.playCount,
      recentSessions: 0,
      recentPlaytimeMs: 0,
    };

    current.recentSessions += 1;
    current.recentPlaytimeMs += session.playtimeMs;
    metrics.set(session.contentId, current);
  }

  return [...metrics.values()]
    .sort((left, right) => {
      const recentDelta = right.recentSessions - left.recentSessions;
      return recentDelta !== 0 ? recentDelta : right.totalPlayCount - left.totalPlayCount;
    })
    .slice(0, 10);
}

function buildHighFailureSongs(recentSessions: RecentSession[]): FailureSongMetric[] {
  const metrics = new Map<
    string,
    FailureSongMetric & {
      accuracyTotal: number;
      sessionCount: number;
    }
  >();

  for (const session of recentSessions) {
    const current = metrics.get(session.contentId) ?? {
      id: session.content.id,
      title: session.content.title,
      artist: session.content.artist,
      category: session.content.category,
      thumbnailUrl: session.content.thumbnailUrl,
      attempts: 0,
      failedAttempts: 0,
      failureRate: 0,
      averageAccuracy: 0,
      accuracyTotal: 0,
      sessionCount: 0,
    };

    const totalLines = session.lineResults.length;
    const failedLines = session.lineResults.filter((line) => !line.isSuccess || line.isDifficult).length;
    current.attempts += totalLines > 0 ? totalLines : 1;
    current.failedAttempts += totalLines > 0 ? failedLines : session.accuracy < 70 ? 1 : 0;
    current.accuracyTotal += session.accuracy;
    current.sessionCount += 1;
    current.averageAccuracy = current.accuracyTotal / current.sessionCount;
    metrics.set(session.contentId, current);
  }

  return [...metrics.values()]
    .map((metric) => ({
      ...metric,
      failureRate: metric.attempts > 0 ? metric.failedAttempts / metric.attempts : 0,
    }))
    .filter((metric) => metric.attempts > 0)
    .sort((left, right) => {
      const failureDelta = right.failureRate - left.failureRate;
      return failureDelta !== 0 ? failureDelta : right.failedAttempts - left.failedAttempts;
    })
    .slice(0, 8);
}

function buildSuspiciousLines(recentSessions: RecentSession[]): SuspiciousLineMetric[] {
  const groups = new Map<
    string,
    SuspiciousLineMetric & {
      delayTotal: number;
      typoTotal: number;
    }
  >();

  for (const session of recentSessions) {
    for (const line of session.lineResults) {
      const key = line.lyricSyncId ?? `${session.contentId}:${line.lineIndex}:${line.japaneseText.slice(0, 80)}`;
      const current = groups.get(key) ?? {
        key,
        contentTitle: session.content.title,
        artist: session.content.artist,
        lineIndex: line.lineIndex,
        japaneseText: line.japaneseText,
        expectedInput: line.expectedInput,
        submittedInputSample: line.submittedInput,
        attempts: 0,
        failedAttempts: 0,
        failureRate: 0,
        averageDelayMs: 0,
        averageTypoCount: 0,
        delayTotal: 0,
        typoTotal: 0,
      };

      current.attempts += 1;
      current.failedAttempts += !line.isSuccess || line.isDifficult ? 1 : 0;
      current.delayTotal += line.responseDelayMs ?? 0;
      current.typoTotal += line.typoCount;

      if (!current.submittedInputSample && line.submittedInput) {
        current.submittedInputSample = line.submittedInput;
      }

      groups.set(key, current);
    }
  }

  return [...groups.values()]
    .map((line) => ({
      ...line,
      failureRate: line.attempts > 0 ? line.failedAttempts / line.attempts : 0,
      averageDelayMs: line.attempts > 0 ? line.delayTotal / line.attempts : 0,
      averageTypoCount: line.attempts > 0 ? line.typoTotal / line.attempts : 0,
    }))
    .filter((line) => line.failureRate >= 0.5 || line.averageDelayMs >= 6000 || line.averageTypoCount >= 1.5)
    .sort((left, right) => {
      const leftScore = left.failureRate * 100 + left.averageDelayMs / 1000 + left.averageTypoCount * 10;
      const rightScore = right.failureRate * 100 + right.averageDelayMs / 1000 + right.averageTypoCount * 10;
      return rightScore - leftScore;
    })
    .slice(0, 12);
}

function getStartOfDay(value: Date): Date {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return sum(values) / values.length;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatMilliseconds(value: number): string {
  if (value <= 0) {
    return "0초";
  }

  return `${(value / 1000).toFixed(1)}초`;
}

function formatDuration(value: number): string {
  const minutes = Math.round(value / 60_000);

  if (minutes < 60) {
    return `${formatNumber(minutes)}분`;
  }

  return `${formatNumber(Math.round(minutes / 60))}시간`;
}
