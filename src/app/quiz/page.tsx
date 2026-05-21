import Link from "next/link";

import { getOpenQuizBattleRooms } from "../../lib/quizBattle";
import type { QuizCategory } from "../../lib/quizData";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const QUIZ_CATEGORIES: Array<{
  id: QuizCategory;
  title: string;
  eyebrow: string;
  description: string;
  stats: string;
}> = [
  {
    id: "JPOP",
    title: "JPOP",
    eyebrow: "Listen & Guess",
    description: "노래 일부를 듣거나 힌트를 보고 곡명, 아티스트를 맞히는 퀴즈입니다.",
    stats: "곡명 / 아티스트 / 가사 힌트",
  },
  {
    id: "ANIME",
    title: "애니메이션",
    eyebrow: "Character & Title",
    description: "작품명, 캐릭터 이름, 장면 힌트를 맞히는 애니메이션 퀴즈입니다.",
    stats: "작품명 / 캐릭터 / 장면 힌트",
  },
];

export default async function QuizPage() {
  const battleRooms = await getOpenQuizBattleRooms();

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span>QUIZ MODE</span>
        <h1>솔로로 연습하고, 대전으로 겨뤄보세요</h1>
        <p>
          혼자 차분히 곡과 작품을 맞히거나, 방을 만들고 참가해 다른 유저와 실시간 퀴즈
          대전을 즐길 수 있습니다.
        </p>
      </section>

      <section className={styles.modeSection} aria-labelledby="solo-mode-title">
        <div className={styles.sectionHeading}>
          <span>Solo Mode</span>
          <h2 id="solo-mode-title">솔로 모드</h2>
          <p>카테고리를 선택하면 바로 혼자 플레이하는 퀴즈 화면으로 이동합니다.</p>
        </div>

        <div className={styles.categoryGrid} aria-label="Solo quiz category selection">
          {QUIZ_CATEGORIES.map((category) => (
            <Link
              className={styles.categoryCard}
              href={`/quiz/play?category=${category.id}&mode=solo`}
              key={category.id}
            >
              <span>{category.eyebrow}</span>
              <h3>{category.title}</h3>
              <p>{category.description}</p>
              <strong>{category.stats}</strong>
              <i>솔로 시작</i>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.battleSection} aria-labelledby="battle-mode-title">
        <div className={styles.sectionHeading}>
          <span>Battle Mode</span>
          <h2 id="battle-mode-title">대전 모드</h2>
          <p>방을 만들거나, 현재 열린 방에 참가하거나, 방 코드로 바로 입장할 수 있습니다.</p>
        </div>

        <div className={styles.battleGrid}>
          <article className={styles.lobbyCard}>
            <div>
              <span className={styles.cardBadge}>방 만들기</span>
              <h3>새 대전 방 생성</h3>
              <p>원하는 카테고리로 즉시 방을 만들고 퀴즈 대전을 시작합니다.</p>
            </div>
            <div className={styles.createActions}>
              {QUIZ_CATEGORIES.map((category) => (
                <Link
                  href={`/quiz/play?category=${category.id}&mode=battle&room=CREATE`}
                  key={category.id}
                >
                  {category.title} 방 만들기
                </Link>
              ))}
            </div>
          </article>

          <article className={styles.lobbyCard}>
            <span className={styles.cardBadge}>방 참가하기</span>
            <h3>방 코드로 입장</h3>
            <form action="/quiz/play" className={styles.joinForm}>
              <input name="mode" type="hidden" value="battle" />
              <label>
                카테고리
                <select name="category" defaultValue="JPOP">
                  {QUIZ_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                방 코드
                <input name="room" placeholder="예: JP-428" required />
              </label>
              <button type="submit">방 참가하기</button>
            </form>
          </article>

          <article className={`${styles.lobbyCard} ${styles.roomListCard}`}>
            <span className={styles.cardBadge}>방 리스트</span>
            <h3>현재 열린 방</h3>
            <div className={styles.roomList}>
              {battleRooms.length > 0 ? (
                battleRooms.map((room) => (
                  <Link
                    className={styles.roomItem}
                    href={`/quiz/play?category=${room.category}&mode=battle&room=${room.code}`}
                    key={room.code}
                  >
                    <div>
                      <strong>{room.title}</strong>
                      <span>
                        {room.category} · 방장 {room.host?.displayName ?? room.host?.username ?? "unknown"}
                      </span>
                    </div>
                    <em>
                      {room.participants.length} / {room.maxPlayers}
                    </em>
                    <i>{room.code}</i>
                  </Link>
                ))
              ) : (
                <div className={styles.emptyRoomList}>
                  <strong>현재 열린 방이 없습니다</strong>
                  <span>새 대전 방을 만들고 첫 참가자를 기다려보세요.</span>
                </div>
              )}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
