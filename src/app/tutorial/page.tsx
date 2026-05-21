import Link from "next/link";

import { TutorialTrainer } from "./TutorialTrainer";
import styles from "./page.module.css";

export const metadata = {
  title: "Enterping Tutorial",
  description: "Learn the basic romaji typing rules before playing Enterping.",
};

export default function TutorialPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span>START GUIDE</span>
          <h1>처음이라면 3분 튜토리얼부터</h1>
          <p>
            Enterping은 일본어 가사를 히라가나로 보고 로마자로 입력하는 게임입니다.
            기본 입력, 촉음, 요음, 장음 규칙만 익히면 바로 J-POP 타이핑을 시작할 수 있습니다.
          </p>
        </div>
        <Link href="/typing">튜토리얼 건너뛰기</Link>
      </section>

      <TutorialTrainer />
    </main>
  );
}
