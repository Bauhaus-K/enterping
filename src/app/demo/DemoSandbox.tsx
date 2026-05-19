"use client";

import { useState } from "react";

import type { AiErrorFeedback } from "../../lib/aiAnalysisPrompt";
import { TypingInputMode } from "../../lib/typingEngine";
import { GamePlayer, type GamePlayerContent, type GamePlayerLyricSync } from "../../components/game/GamePlayer";
import { UserDashboard, type DashboardGameSession, type DashboardTypoLog } from "../../components/UserDashboard";
import type { DashboardReward } from "../../components/BadgeGallery";
import styles from "./demo.module.css";

type DemoTab = "game" | "dashboard";

export interface DemoSandboxProps {
  user: {
    id: string;
    username: string;
    displayName: string | null;
    isPremium: boolean;
  };
  gameContent: GamePlayerContent;
  lyricSyncs: GamePlayerLyricSync[];
  dashboard: {
    typoLogs: DashboardTypoLog[];
    sessions: DashboardGameSession[];
    rewards: DashboardReward[];
    aiFeedback: AiErrorFeedback;
  };
}

const TABS: Array<{ id: DemoTab; label: string; description: string }> = [
  { id: "game", label: "Game Player", description: "LRC lyrics + typing engine" },
  { id: "dashboard", label: "Dashboard", description: "Metrics, AI feedback, rewards" },
];

export function DemoSandbox({ user, gameContent, lyricSyncs, dashboard }: DemoSandboxProps) {
  const [activeTab, setActiveTab] = useState<DemoTab>("game");

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <span className={styles.eyebrow}>Local Sandbox</span>
        <h1>Enterping Demo Environment</h1>
        <p>
          JPOP practice data is loaded from local LRC files and mounted into the core components.
          Open the browser console to watch typing validation and YouTube sync logs flow through the app.
        </p>
      </header>

      <nav className={styles.tabs} aria-label="Demo sections">
        {TABS.map((tab) => (
          <button
            className={activeTab === tab.id ? styles.activeTab : styles.tab}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            <strong>{tab.label}</strong>
            <span>{tab.description}</span>
          </button>
        ))}
      </nav>

      <section className={styles.stage}>
        {activeTab === "game" ? (
          <GamePlayer
            userId={user.id}
            isPremium={user.isPremium}
            content={gameContent}
            lyrics={lyricSyncs}
            inputMode={TypingInputMode.Romaji}
            onLyricChange={(lyric) => console.log("[Enterping Demo] Lyric changed", lyric)}
            onValidationChange={(result) => console.log("[Enterping Demo] Validation changed", result)}
            onTypo={(typo) => console.log("[Enterping Demo] Typo logged", typo)}
            onSessionSaved={(session) => console.log("[Enterping Demo] Session saved", session)}
          />
        ) : null}

        {activeTab === "dashboard" ? (
          <UserDashboard
            username={user.displayName ?? user.username}
            typoLogs={dashboard.typoLogs}
            sessions={dashboard.sessions}
            rewards={dashboard.rewards}
            aiFeedback={dashboard.aiFeedback}
            isPremium={user.isPremium}
          />
        ) : null}
      </section>
    </main>
  );
}
