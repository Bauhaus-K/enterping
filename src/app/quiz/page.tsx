import Link from "next/link";

import styles from "./page.module.css";

const QUIZ_CATEGORIES = [
  {
    id: "JPOP",
    title: "JPOP",
    eyebrow: "Listen & Guess",
    description: "노래 일부를 듣거나 힌트를 보고 곡명, 아티스트를 맞히는 퀴즈입니다.",
    href: "/quiz/play?category=JPOP",
    stats: "곡명 / 아티스트 / 가사 힌트",
  },
  {
    id: "ANIME",
    title: "애니메이션",
    eyebrow: "Character & Title",
    description: "애니메이션 작품명, 캐릭터 이름, 명대사 힌트를 맞히는 퀴즈입니다.",
    href: "/quiz/play?category=ANIME",
    stats: "작품명 / 캐릭터 / 장면 힌트",
  },
] as const;

export default function QuizPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span>QUIZ MODE</span>
        <h1>어떤 퀴즈로 시작할까요?</h1>
        <p>JPOP과 애니메이션 중 하나를 고르고, 대전형 퀴즈 화면에서 빠르게 정답을 입력해 보세요.</p>
      </section>

      <section className={styles.categoryGrid} aria-label="Quiz category selection">
        {QUIZ_CATEGORIES.map((category) => (
          <Link className={styles.categoryCard} href={category.href} key={category.id}>
            <span>{category.eyebrow}</span>
            <h2>{category.title}</h2>
            <p>{category.description}</p>
            <strong>{category.stats}</strong>
            <i>플레이 시작</i>
          </Link>
        ))}
      </section>
    </main>
  );
}
