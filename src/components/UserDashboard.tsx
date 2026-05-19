"use client";

import type { CSSProperties } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AiErrorFeedback } from "../lib/aiAnalysisPrompt";
import { AdBanner } from "./AdBanner";
import { AiFeedbackCard } from "./AiFeedbackCard";
import { BadgeGallery, type DashboardReward } from "./BadgeGallery";
import styles from "./UserDashboard.module.css";

export interface DashboardTypoLog {
  id: string;
  targetCharacter: string;
  inputtedCharacter: string;
  contextualPreviousWord?: string | null;
  createdAt: string | Date;
}

export interface DashboardGameSession {
  id: string;
  startedAt: string | Date;
  strokesPerMinute: number;
  accuracy: number;
  score?: number;
  playtimeMs?: number;
}

export interface UserDashboardProps {
  username?: string;
  typoLogs?: DashboardTypoLog[];
  sessions?: DashboardGameSession[];
  rewards?: DashboardReward[];
  aiFeedback?: AiErrorFeedback | null;
  isAiFeedbackLoading?: boolean;
  isPremium?: boolean;
}

interface ChartDatum {
  label: string;
  strokesPerMinute: number;
  accuracy: number;
}

const QWERTY_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

const MOCK_TYPO_LOGS: DashboardTypoLog[] = [
  createMockTypo("1", "t", "r", "ma"),
  createMockTypo("2", "t", "r", "ma"),
  createMockTypo("3", "s", "a", "ki"),
  createMockTypo("4", "u", "i", "ts"),
  createMockTypo("5", "u", "i", "ts"),
  createMockTypo("6", "u", "i", "ts"),
  createMockTypo("7", "c", "x", "ma"),
  createMockTypo("8", "h", "j", "c"),
  createMockTypo("9", "h", "j", "c"),
  createMockTypo("10", "n", "m", "yu"),
  createMockTypo("11", "n", "m", "yu"),
  createMockTypo("12", "n", "m", "yu"),
  createMockTypo("13", "n", "m", "yu"),
  createMockTypo("14", "y", "t", "ki"),
  createMockTypo("15", "o", "p", "ry"),
  createMockTypo("16", "o", "p", "ry"),
  createMockTypo("17", "i", "u", "ch"),
];

const MOCK_SESSIONS: DashboardGameSession[] = Array.from({ length: 10 }, (_, index) => ({
  id: `mock-session-${index + 1}`,
  startedAt: new Date(Date.now() - (9 - index) * 86_400_000).toISOString(),
  strokesPerMinute: [164, 171, 168, 184, 197, 191, 205, 214, 209, 226][index],
  accuracy: [87.2, 88.1, 86.7, 89.4, 91.2, 90.1, 92.3, 93.8, 92.9, 95.1][index],
  score: [920, 980, 960, 1080, 1190, 1160, 1280, 1370, 1320, 1480][index],
  playtimeMs: 180_000 + index * 12_000,
}));

const MOCK_REWARDS: DashboardReward[] = [
  {
    slug: "j-pop-beginner",
    name: "J-Pop Beginner",
    description: "Logged 1 hour of total typing playtime.",
    kind: "BADGE",
    icon: "JP",
    unlockedAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
  },
  {
    slug: "precision-idol",
    name: "Precision Idol",
    description: "Maintained at least 95% accuracy for 5 consecutive games.",
    kind: "TITLE",
    icon: "95",
    unlockedAt: new Date(Date.now() - 86_400_000).toISOString(),
  },
];

const MOCK_AI_FEEDBACK: AiErrorFeedback = {
  weakness: "촉음(っ) 입력 타이밍",
  tip: "まって, きって처럼 작은 っ이 있는 단어를 볼 때 다음 자음을 한 번 더 눌러 리듬을 만들어 보세요.",
  encouragement: "이미 속도는 좋아지고 있어요. 이제 리듬만 잡으면 정확도가 확 올라갑니다.",
};

export function UserDashboard({
  username = "Enterping Player",
  typoLogs = MOCK_TYPO_LOGS,
  sessions = MOCK_SESSIONS,
  rewards = MOCK_REWARDS,
  aiFeedback = MOCK_AI_FEEDBACK,
  isAiFeedbackLoading = false,
  isPremium = false,
}: UserDashboardProps) {
  const keyFrequencies = buildKeyFrequencies(typoLogs);
  const maxTypoCount = Math.max(...Object.values(keyFrequencies), 1);
  const chartData = buildChartData(sessions);
  const averageAccuracy = average(sessions.map((session) => session.accuracy));
  const averageSpm = average(sessions.map((session) => session.strokesPerMinute));
  const topTypoKeys = Object.entries(keyFrequencies)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4);

  return (
    <section className={styles.dashboard} aria-label="User dashboard">
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Learning Dashboard</span>
          <h2>{username}</h2>
          <p>Review typing speed, accuracy trends, and the keys causing the most friction.</p>
        </div>

        <div className={styles.summaryGrid}>
          <MetricCard label="Average SPM" value={Math.round(averageSpm).toString()} />
          <MetricCard label="Accuracy" value={`${averageAccuracy.toFixed(1)}%`} />
          <MetricCard label="Logged Typos" value={typoLogs.length.toString()} />
        </div>
      </header>

      <div className={styles.analysisGrid}>
        <AiFeedbackCard feedback={aiFeedback} isLoading={isAiFeedbackLoading} />
        <div className={styles.dashboardSidebar}>
          <AdBanner placement="dashboard-sidebar" isPremium={isPremium} label="Study tools partner" />
          <BadgeGallery rewards={rewards} />
        </div>
      </div>

      <div className={styles.contentGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Typo Heatmap</span>
              <h3>QWERTY weak spots</h3>
            </div>
            <p>Red intensity increases with typo frequency.</p>
          </div>

          <div className={styles.keyboard} role="img" aria-label="QWERTY typo heatmap">
            {QWERTY_ROWS.map((row, rowIndex) => (
              <div className={styles.keyboardRow} key={row.join("")}>
                {rowIndex === 1 ? <span className={styles.keySpacer} aria-hidden="true" /> : null}
                {rowIndex === 2 ? <span className={styles.keySpacerWide} aria-hidden="true" /> : null}
                {row.map((key) => {
                  const count = keyFrequencies[key] ?? 0;

                  return (
                    <button
                      className={styles.key}
                      key={key}
                      style={getKeyHeatStyle(count, maxTypoCount)}
                      type="button"
                      aria-label={`${key.toUpperCase()} key, ${count} typos`}
                    >
                      <span>{key.toUpperCase()}</span>
                      <strong>{count}</strong>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className={styles.insightPills}>
            {topTypoKeys.length > 0 ? (
              topTypoKeys.map(([key, count]) => (
                <span key={key}>
                  {key.toUpperCase()}: {count}
                </span>
              ))
            ) : (
              <span>No typo data yet</span>
            )}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Last 10 Sessions</span>
              <h3>Speed and accuracy trend</h3>
            </div>
            <p>SPM and accuracy are tracked from completed game sessions.</p>
          </div>

          <div className={styles.chartFrame}>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top: 10, right: 18, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.12)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,248,231,0.58)" tickLine={false} />
                <YAxis
                  yAxisId="speed"
                  stroke="#ffcf7a"
                  tickLine={false}
                  axisLine={false}
                  width={42}
                />
                <YAxis
                  yAxisId="accuracy"
                  orientation="right"
                  domain={[70, 100]}
                  stroke="#44d7c7"
                  tickLine={false}
                  axisLine={false}
                  width={42}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(10, 15, 22, 0.94)",
                    border: "1px solid rgba(255,255,255,0.16)",
                    borderRadius: 16,
                    color: "#fff8e7",
                  }}
                />
                <Legend />
                <Line
                  yAxisId="speed"
                  type="monotone"
                  dataKey="strokesPerMinute"
                  name="SPM"
                  stroke="#ffcf7a"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  yAxisId="accuracy"
                  type="monotone"
                  dataKey="accuracy"
                  name="Accuracy %"
                  stroke="#44d7c7"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
    </section>
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

function buildChartData(sessions: DashboardGameSession[]): ChartDatum[] {
  return [...sessions]
    .sort((left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime())
    .slice(-10)
    .map((session, index) => ({
      label: `#${index + 1}`,
      strokesPerMinute: Math.round(session.strokesPerMinute),
      accuracy: Math.round(session.accuracy * 10) / 10,
    }));
}

function buildKeyFrequencies(typoLogs: DashboardTypoLog[]): Record<string, number> {
  return typoLogs.reduce<Record<string, number>>((frequencies, typoLog) => {
    const key = normalizeKeyboardKey(typoLog.inputtedCharacter);

    if (!key) {
      return frequencies;
    }

    frequencies[key] = (frequencies[key] ?? 0) + 1;
    return frequencies;
  }, {});
}

function normalizeKeyboardKey(input: string): string | null {
  const normalized = input.trim().toLowerCase();
  const key = Array.from(normalized).find((character) => /^[a-z]$/.test(character));

  return key ?? null;
}

function getKeyHeatStyle(count: number, maxCount: number): CSSProperties {
  if (count === 0) {
    return {};
  }

  const intensity = count / maxCount;
  const alpha = 0.18 + intensity * 0.74;

  return {
    background: `linear-gradient(145deg, rgba(255, 107, 93, ${alpha}), rgba(116, 16, 28, ${0.2 + intensity * 0.5}))`,
    borderColor: `rgba(255, 183, 139, ${0.28 + intensity * 0.58})`,
    boxShadow: `0 12px 34px rgba(255, 74, 74, ${0.1 + intensity * 0.24})`,
  };
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function createMockTypo(
  id: string,
  targetCharacter: string,
  inputtedCharacter: string,
  contextualPreviousWord: string,
): DashboardTypoLog {
  return {
    id,
    targetCharacter,
    inputtedCharacter,
    contextualPreviousWord,
    createdAt: new Date(Date.now() - Number(id) * 120_000).toISOString(),
  };
}
