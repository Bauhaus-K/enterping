"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

import { QuizAudioPlayer } from "../../../components/QuizAudioPlayer";
import { dispatchRewardNotifications } from "../../../components/RewardNotificationCenter";
import type { CurrentUser } from "../../../lib/auth";
import type { QuizCategory, QuizItem } from "../../../lib/quizData";
import styles from "./page.module.css";

const REVEAL_DURATION_MS = 1800;
type QuizMode = "solo" | "battle";

interface QuizBattleProps {
  category: QuizCategory;
  currentUser: CurrentUser | null;
  items: QuizItem[];
  mode?: QuizMode;
  roomCode?: string;
}

interface ChatLine {
  id: string;
  user: string;
  text: string;
  color: string;
}

interface Rival {
  name: string;
  score: number;
  colorClassName: "orangeDot" | "greenDot" | "blueDot";
}

interface BattleParticipant {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  score: number;
  correctCount: number;
  wrongCount: number;
  streak: number;
  currentQuestionIndex: number;
  isFinished: boolean;
  lastSeenAt: string;
}

interface BattleRoomState {
  code: string;
  title: string;
  category: QuizCategory;
  status: "OPEN" | "PLAYING" | "FINISHED";
  maxPlayers: number;
  participants: BattleParticipant[];
  updatedAt: string;
}

const ROUND_SECONDS = 25;
const MY_NAME = "(私)";

const RIVALS: Rival[] = [
  { name: "user1", score: 820, colorClassName: "orangeDot" },
  { name: "user2", score: 610, colorClassName: "greenDot" },
  { name: "user3", score: 470, colorClassName: "blueDot" },
];

const INITIAL_CHAT_LINES: ChatLine[] = [
  { id: "chat-1", user: "user1", text: "ヒント見えた！", color: "#f08a2d" },
  { id: "chat-2", user: "user2", text: "たぶん分かった", color: "#35b8aa" },
  { id: "chat-3", user: "user3", text: "むずかしい...", color: "#3678cf" },
  { id: "chat-4", user: "わたし", text: "準備OK", color: "#8057e8" },
];

const SOLO_LOG_LINES: ChatLine[] = [
  { id: "solo-1", user: "system", text: "솔로 모드가 시작되었습니다.", color: "#8057e8" },
  { id: "solo-2", user: "hint", text: "정답을 입력하면 다음 문제로 이동합니다.", color: "#35b8aa" },
];

export function QuizBattle({ category, currentUser, items, mode = "solo", roomCode }: QuizBattleProps) {
  const isBattleMode = mode === "battle";
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [isFinished, setIsFinished] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [feedback, setFeedback] = useState("정답을 입력하고 보라색 버튼을 누르세요.");
  const [chatLines, setChatLines] = useState(isBattleMode ? INITIAL_CHAT_LINES : SOLO_LOG_LINES);
  const [activeRoomCode, setActiveRoomCode] = useState(roomCode);
  const [battleRoom, setBattleRoom] = useState<BattleRoomState | null>(null);
  const [battleSyncMessage, setBattleSyncMessage] = useState(
    isBattleMode ? "대전 방에 연결 중..." : "솔로 연습 중",
  );
  // 정답이 공개된 문제 (정답·시간초과·스킵 모두 포함). 앨범 아트를 잠시 보여주기 위해 사용.
  const [revealedItem, setRevealedItem] = useState<QuizItem | null>(null);
  const revealTimeoutRef = useRef<number | null>(null);
  const sessionStartedAtRef = useRef(new Date());
  const lastBattlePatchRef = useRef("");

  const currentItem = items[currentIndex] ?? items[0];
  const modeLabel = `${category === "ANIME" ? "애니" : "JPOP"} ${isBattleMode ? "대전" : "솔로"}`;
  const progressLabel = `${Math.min(currentIndex + 1, items.length)} / ${items.length}`;

  const leaderboard = useMemo(
    () => {
      if (isBattleMode && battleRoom) {
        return battleRoom.participants
          .map((participant) => ({
            name: participant.displayName ?? participant.username,
            score: participant.score,
            userId: participant.userId,
            colorClassName: "purpleDot" as const,
          }))
          .sort((left, right) => right.score - left.score)
          .map((row, index) => ({ ...row, rank: index + 1 }));
      }

      const rivals = isBattleMode ? RIVALS : [];

      return [...rivals, { name: MY_NAME, score, colorClassName: "purpleDot" as const }]
        .sort((left, right) => right.score - left.score)
        .map((row, index) => ({ ...row, rank: index + 1 }));
    },
    [battleRoom, isBattleMode, score],
  );

  const playerList = useMemo(() => {
    if (isBattleMode && battleRoom) {
      return battleRoom.participants.map((participant, index) => ({
        id: participant.userId,
        name: participant.displayName ?? participant.username,
        colorClassName: getPlayerDotClassName(index),
        score: participant.score,
      }));
    }

    return isBattleMode
      ? RIVALS.map((rival, index) => ({ id: rival.name, name: rival.name, colorClassName: getPlayerDotClassName(index), score: rival.score }))
      : [];
  }, [battleRoom, isBattleMode]);

  useEffect(() => {
    if (!isBattleMode) {
      return;
    }

    let cancelled = false;

    async function connectBattleRoom() {
      if (!currentUser) {
        setBattleSyncMessage("로그인 후 대전 방을 만들거나 참가할 수 있습니다.");
        return;
      }

      const normalizedRoomCode = roomCode?.trim().toUpperCase();
      const shouldCreateRoom = !normalizedRoomCode || normalizedRoomCode === "CREATE" || normalizedRoomCode.startsWith("NEW-");
      const url = shouldCreateRoom
        ? "/api/quiz-battle/rooms"
        : `/api/quiz-battle/rooms/${encodeURIComponent(normalizedRoomCode)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: shouldCreateRoom ? JSON.stringify({ category }) : undefined,
      });

      if (cancelled) {
        return;
      }

      if (!response.ok) {
        setBattleSyncMessage(response.status === 401 ? "로그인 후 대전에 참가할 수 있습니다." : "대전 방 연결에 실패했습니다.");
        return;
      }

      const data = (await response.json()) as { room: BattleRoomState };
      setBattleRoom(data.room);
      setActiveRoomCode(data.room.code);
      setBattleSyncMessage("실시간 점수 동기화 중");

      if (shouldCreateRoom && typeof window !== "undefined") {
        const nextUrl = `/quiz/play?category=${category}&mode=battle&room=${data.room.code}`;
        window.history.replaceState(null, "", nextUrl);
      }
    }

    connectBattleRoom().catch((error) => {
      console.error("[Enterping][QuizBattle] Failed to connect battle room", error);
      if (!cancelled) {
        setBattleSyncMessage("대전 방 연결 중 오류가 발생했습니다.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [category, currentUser, isBattleMode, roomCode]);

  useEffect(() => {
    if (!isBattleMode || !activeRoomCode || activeRoomCode === "CREATE" || activeRoomCode.startsWith("NEW-")) {
      return undefined;
    }

    let cancelled = false;
    const roomCodeToPoll = activeRoomCode;

    async function pollRoom() {
      const response = await fetch(`/api/quiz-battle/rooms/${encodeURIComponent(roomCodeToPoll)}`, {
        cache: "no-store",
      });

      if (cancelled || !response.ok) {
        return;
      }

      const data = (await response.json()) as { room: BattleRoomState };
      setBattleRoom(data.room);
    }

    pollRoom().catch(() => undefined);
    const intervalId = window.setInterval(() => {
      pollRoom().catch(() => undefined);
    }, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeRoomCode, isBattleMode]);

  useEffect(() => {
    if (!isBattleMode || !activeRoomCode || activeRoomCode === "CREATE" || activeRoomCode.startsWith("NEW-")) {
      return;
    }

    const payload = {
      score,
      correctCount,
      wrongCount,
      streak,
      currentQuestionIndex: currentIndex,
      isFinished,
    };
    const serializedPayload = JSON.stringify(payload);

    if (lastBattlePatchRef.current === serializedPayload) {
      return;
    }

    lastBattlePatchRef.current = serializedPayload;

    const timeoutId = window.setTimeout(() => {
      fetch(`/api/quiz-battle/rooms/${encodeURIComponent(activeRoomCode)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: serializedPayload,
      })
        .then(async (response) => {
          if (!response.ok) {
            return;
          }

          const data = (await response.json()) as { room: BattleRoomState };
          setBattleRoom(data.room);
        })
        .catch((error) => {
          console.error("[Enterping][QuizBattle] Failed to sync battle score", error);
        });
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [activeRoomCode, correctCount, currentIndex, isBattleMode, isFinished, score, streak, wrongCount]);

  useEffect(() => {
    if (isFinished || !currentItem || revealedItem) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setTimeLeft((previousTimeLeft) => {
        if (previousTimeLeft <= 1) {
          handleTimeout();
          return ROUND_SECONDS;
        }

        return previousTimeLeft - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [currentIndex, currentItem, isFinished, revealedItem]);

  useEffect(() => {
    if (!isFinished || sessionSaved) {
      return;
    }

    setSessionSaved(true);

    const endedAt = new Date();
    const totalQuestions = Math.max(items.length, 1);
    const accuracy = Math.round((correctCount / totalQuestions) * 10_000) / 100;
    const contentId = `quiz-${category.toLowerCase()}`;
    const contentTitle = category === "ANIME" ? "애니메이션 퀴즈" : "JPOP 퀴즈";

    fetch("/api/game-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contentId,
        content: {
          id: contentId,
          title: contentTitle,
          artist: "Enterping Quiz",
          category,
          youtubeVideoId: items[0]?.audioSnippet?.youtubeVideoId ?? `enterping-${contentId}`,
          thumbnailUrl: items[0]?.thumbnailUrl ?? null,
        },
        gameMode: "LISTEN_AND_GUESS",
        inputMode: "ROMAJI",
        score,
        accuracy,
        strokesPerMinute: 0,
        wordsPerMinute: 0,
        totalStrokes: correctCount + wrongCount,
        correctStrokes: correctCount,
        incorrectStrokes: wrongCount,
        playtimeMs: Math.max(endedAt.getTime() - sessionStartedAtRef.current.getTime(), 0),
        startedAt: sessionStartedAtRef.current.toISOString(),
        endedAt: endedAt.toISOString(),
        typoLogs: [],
      }),
    })
      .then(async (response) => {
        if (!response.ok && response.status !== 401) {
          throw new Error(`Quiz session save failed with status ${response.status}`);
        }

        if (response.status === 401) {
          setFeedback("라운드 완료! 로그인하면 기록이 프로필과 랭킹에 저장됩니다.");
          return;
        }

        const data = (await response.json()) as {
          unlockedRewards?: Parameters<typeof dispatchRewardNotifications>[0];
        };
        dispatchRewardNotifications(data.unlockedRewards ?? []);
        setFeedback("라운드 완료! 기록이 프로필에 저장되었습니다.");
      })
      .catch((error) => {
        console.error("[Enterping][Quiz] Failed to save quiz session", error);
        setFeedback("라운드 완료! 기록 저장 중 오류가 발생했습니다.");
        setSessionSaved(false);
      });
  }, [category, correctCount, isFinished, items, score, sessionSaved, wrongCount]);

  if (!currentItem) {
    return (
      <section className={styles.emptyState}>
        <h1>퀴즈 문제가 없습니다</h1>
        <p>선택한 카테고리에 등록된 문제가 없습니다.</p>
      </section>
    );
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isFinished) {
      restartGame();
      return;
    }

    // 정답이 공개된 상태에서는 새 입력을 받지 않음 (다음 문제 대기)
    if (revealedItem) {
      return;
    }

    const trimmedAnswer = answer.trim();

    if (!trimmedAnswer) {
      setFeedback("정답을 입력해 주세요.");
      return;
    }

    const isCorrect = currentItem.acceptedAnswers.some(
      (candidate) => normalizeAnswer(candidate) === normalizeAnswer(trimmedAnswer),
    );

    if (isCorrect) {
      const gainedScore = 100 + timeLeft * 4 + streak * 25 + currentItem.difficulty * 10;
      setCorrectCount((previousCount) => previousCount + 1);
      setScore((previousScore) => previousScore + gainedScore);
      setStreak((previousStreak) => previousStreak + 1);
      setFeedback(`정답! +${gainedScore}점: ${currentItem.answer}`);
      pushChatLine(isBattleMode ? "わたし" : "정답", `${trimmedAnswer} 正解!`, "#8057e8");
      revealAndAdvance(currentItem);
    } else {
      setWrongCount((previousCount) => previousCount + 1);
      setScore((previousScore) => Math.max(0, previousScore - 20));
      setStreak(0);
      setFeedback("오답입니다. 힌트를 보고 다시 입력해 보세요.");
      pushChatLine(isBattleMode ? "わたし" : "오답", `${trimmedAnswer} ...?`, "#6b7280");
    }

    setAnswer("");
  };

  const skipQuestion = () => {
    if (isFinished || revealedItem) {
      return;
    }

    setWrongCount((previousCount) => previousCount + 1);
    setStreak(0);
    setFeedback(`스킵했습니다. 정답은 ${currentItem.answer}`);
    pushChatLine("system", `정답 공개: ${currentItem.answer}`, "#e24b5f");
    setAnswer("");
    revealAndAdvance(currentItem);
  };

  function handleTimeout() {
    if (revealedItem) {
      return;
    }
    setWrongCount((previousCount) => previousCount + 1);
    setStreak(0);
    setFeedback(`시간 초과! 정답은 ${currentItem.answer}`);
    pushChatLine("system", `TIME UP: ${currentItem.answer}`, "#e24b5f");
    setAnswer("");
    revealAndAdvance(currentItem);
  }

  // 정답/오답/시간초과 모두 공통: 잠시 결과(앨범 아트)를 보여준 후 다음 문제로 진행
  function revealAndAdvance(itemToReveal: QuizItem) {
    setRevealedItem(itemToReveal);

    if (revealTimeoutRef.current !== null) {
      window.clearTimeout(revealTimeoutRef.current);
    }

    revealTimeoutRef.current = window.setTimeout(() => {
      setRevealedItem(null);
      revealTimeoutRef.current = null;
      goNextQuestion();
    }, REVEAL_DURATION_MS);
  }

  function goNextQuestion() {
    setTimeLeft(ROUND_SECONDS);

    if (currentIndex >= items.length - 1) {
      setIsFinished(true);
      return;
    }

    setCurrentIndex((previousIndex) => previousIndex + 1);
  }

  function restartGame() {
    if (revealTimeoutRef.current !== null) {
      window.clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
    setCurrentIndex(0);
    setAnswer("");
    setCorrectCount(0);
    setWrongCount(0);
    setScore(0);
    setStreak(0);
    setTimeLeft(ROUND_SECONDS);
    setIsFinished(false);
    setSessionSaved(false);
    setFeedback("새 게임을 시작했습니다.");
    setChatLines(isBattleMode ? INITIAL_CHAT_LINES : SOLO_LOG_LINES);
    setRevealedItem(null);
    sessionStartedAtRef.current = new Date();
  }

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current !== null) {
        window.clearTimeout(revealTimeoutRef.current);
      }
    };
  }, []);

  function pushChatLine(user: string, text: string, color: string) {
    setChatLines((previousLines) => [
      ...previousLines.slice(-4),
      {
        id: `chat-${Date.now()}-${Math.random()}`,
        user,
        text,
        color,
      },
    ]);
  }

  return (
    <section className={styles.quizShell}>
      <aside className={styles.statsPanel}>
        <div className={styles.panelLabel}>퀴즈 통계</div>
        <div className={styles.quizStats}>
          <article>
            <span>현재 정답수</span>
            <strong>{correctCount}</strong>
          </article>
          <article>
            <span>점수</span>
            <strong>{score}</strong>
          </article>
          <article>
            <span>남은 시간</span>
            <strong>{timeLeft}</strong>
          </article>
        </div>
      </aside>

      <section className={styles.questionPanel}>
        <div
          className={`${styles.questionCircle} ${revealedItem ? styles.revealed : ""}`}
        >
          {revealedItem ? (
            <RevealImage item={revealedItem} />
          ) : (
            <span>{isFinished ? "✓" : "?"}</span>
          )}
        </div>
        <p>
          {isFinished
            ? "라운드 완료!"
            : revealedItem
              ? revealedItem.workTitle
              : currentItem.prompt}
        </p>
        <strong className={styles.clueText}>
          {isFinished
            ? `${correctCount}문제 정답 / ${wrongCount}문제 오답`
            : revealedItem
              ? revealedItem.artistOrStudio
              : currentItem.clue}
        </strong>
        {!isFinished && !revealedItem && currentItem.audioSnippet ? (
          <QuizAudioPlayer
            snippet={currentItem.audioSnippet}
            maxPlayCount={3}
            resetKey={currentItem.id}
            showVideo={category === "ANIME"}
            playLabel={
              category === "ANIME"
                ? `짧게 보기 (${currentItem.audioSnippet.durationSeconds}s)`
                : `짧게 듣기 (${currentItem.audioSnippet.durationSeconds}s)`
            }
          />
        ) : null}
      </section>

      <aside className={styles.workPanel}>
        <div className={styles.panelLabel}>作品情報</div>
        <div className={styles.coverBox}>
          <span>{category}</span>
        </div>
        <div className={styles.workMeta}>
          <strong>作品名 :</strong>
          <span>{isFinished || correctCount > currentIndex ? currentItem.workTitle : "???"}</span>
          <p>{currentItem.artistOrStudio}</p>
        </div>
        <div className={styles.tagRow}>
          {currentItem.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </aside>

      <aside className={styles.rankPanel}>
        <div className={styles.panelLabel}>{isBattleMode ? "실시간 순위" : "개인 기록"}</div>
        <ol className={styles.rankList}>
          {leaderboard.map((row) => (
            <li
              className={getLeaderboardUserId(row) === currentUser?.id ? styles.myRank : undefined}
              key={getLeaderboardUserId(row) ?? row.name}
            >
              <span>{row.rank}</span>
              <strong>{row.name}</strong>
              <em>{row.score}</em>
            </li>
          ))}
        </ol>
      </aside>

      <main className={styles.chatPanel}>
        <div className={styles.chatHeader}>
          {isBattleMode ? "대전 채팅" : "플레이 로그"}
        </div>
        <div className={styles.answerLog}>
          {chatLines.map((line) => (
            <p key={line.id} style={{ color: line.color }}>
              <strong>{line.user}:</strong> {line.text}
            </p>
          ))}
          <span className={styles.scrollThumb} aria-hidden="true" />
        </div>
        <form className={styles.answerForm} onSubmit={handleSubmit}>
          <input
            aria-label="정답 입력"
            autoComplete="off"
            autoFocus
            disabled={isFinished}
            onChange={(event) => setAnswer(event.currentTarget.value)}
            placeholder={isFinished ? "게임 종료" : "정답을 입력하세요"}
            value={answer}
          />
          <button aria-label={isFinished ? "다시 시작" : "정답 제출"} type="submit" />
        </form>
        <div className={styles.feedbackRow}>
          <span>{feedback}</span>
          <button onClick={isFinished ? restartGame : skipQuestion} type="button">
            {isFinished ? "다시 시작" : "스킵"}
          </button>
        </div>
      </main>

      <aside className={styles.modePanel}>
        <div className={styles.modeTitle}>모드: {modeLabel}</div>
        <div className={styles.modeDivider} />
        <div className={styles.modeMeta}>
          {isBattleMode ? <span>방 코드: {activeRoomCode ?? "연결 중"}</span> : <span>집중 연습: ON</span>}
          {isBattleMode ? <span>{battleSyncMessage}</span> : null}
          <span>문제: {progressLabel}</span>
          <span>콤보: {streak}</span>
        </div>
        <ul className={styles.playerList}>
          {playerList.map((player) => (
            <li key={player.id}>
              <span className={styles[player.colorClassName]} />
              {player.name}
              {isBattleMode ? <em>{player.score}</em> : null}
            </li>
          ))}
          <li>
            <span className={styles.purpleDot} />
            {MY_NAME}
          </li>
        </ul>
      </aside>
    </section>
  );
}

function getPlayerDotClassName(index: number): "orangeDot" | "greenDot" | "blueDot" | "purpleDot" {
  const classNames = ["orangeDot", "greenDot", "blueDot", "purpleDot"] as const;
  return classNames[index % classNames.length];
}

function getLeaderboardUserId(row: unknown): string | undefined {
  if (typeof row !== "object" || row === null || !("userId" in row)) {
    return undefined;
  }

  const userId = (row as { userId?: unknown }).userId;
  return typeof userId === "string" ? userId : undefined;
}

function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^_`{|}~\sー・]/g, "");
}

interface RevealImageProps {
  item: QuizItem;
}

// 정답 공개 시 작품 관련 이미지를 표시.
// revealImageUrl을 우선 사용하고, 로드 실패 시 thumbnailUrl로 자동 fallback 한다.
function RevealImage({ item }: RevealImageProps) {
  const candidates = [item.revealImageUrl, item.thumbnailUrl].filter(
    (value): value is string => Boolean(value),
  );
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(0);
  }, [item.id]);

  const currentSrc = candidates[imageIndex];

  if (!currentSrc) {
    return <span>{item.workTitle.slice(0, 1)}</span>;
  }

  return (
    <img
      src={currentSrc}
      alt={`${item.workTitle} 관련 이미지`}
      className={styles.albumArt}
      onError={() => {
        if (imageIndex < candidates.length - 1) {
          setImageIndex(imageIndex + 1);
        }
      }}
      referrerPolicy="no-referrer"
    />
  );
}
