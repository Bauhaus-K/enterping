import Link from "next/link";

import { JPOP_SONGS } from "../../lib/jpopSongs";
import { countJpopSongLines } from "../../lib/loadSongLyrics";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

interface JpopStage {
  id: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  difficulty: number;
  playCount: number;
  lineCount: number;
  href: string;
  hasLyrics: boolean;
}

export default async function TypingPage() {
  const stages = await Promise.all(
    JPOP_SONGS.map(async (song): Promise<JpopStage> => {
      const lineCount = await countJpopSongLines(song);

      return {
        id: song.id,
        title: song.title,
        artist: song.artist,
        thumbnailUrl: song.thumbnailUrl,
        difficulty: song.difficulty,
        playCount: song.playCount,
        lineCount,
        href: `/play?contentId=${song.id}`,
        hasLyrics: lineCount > 0,
      };
    }),
  );

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span>리듬 액션 타이핑</span>
        <h1>도전할 곡을 선택해주세요</h1>
        <p>
          영상과 가사가 완벽하게 동기화된 무대 위에서 당신의 타자 실력을 뽐내보세요. 
          일본어를 몰라도 괜찮습니다. 화면에 나오는 로마자를 따라 치다 보면 자연스럽게 곡에 스며들 거예요!
        </p>
      </section>

      <section className={styles.stageGrid} aria-label="JPOP typing stages">
        {stages.map((stage) => (
          <article className={styles.stageCard} key={stage.id}>
            <div className={styles.thumbnail} style={getThumbnailStyle(stage.thumbnailUrl)}>
              <span>Lv. {stage.difficulty}</span>
            </div>
            <div className={styles.cardBody}>
              <div>
                <p>{stage.artist}</p>
                <h2>{stage.title}</h2>
              </div>
              <dl>
                <div>
                  <dt>{stage.playCount.toLocaleString()}</dt>
                  <dd>도전 횟수</dd>
                </div>
                <div>
                  <dt>{stage.lineCount}</dt>
                  <dd>가사 라인</dd>
                </div>
              </dl>
              <Link
                aria-disabled={!stage.hasLyrics}
                className={stage.hasLyrics ? styles.selectButton : styles.disabledButton}
                href={stage.hasLyrics ? stage.href : "/typing"}
              >
                {stage.hasLyrics ? "이 곡으로 타이핑 도전" : "가사 데이터 준비 중"}
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function getThumbnailStyle(thumbnailUrl: string) {
  return {
    backgroundImage: `linear-gradient(180deg, rgba(18, 26, 39, 0.1), rgba(18, 26, 39, 0.48)), url(${thumbnailUrl})`,
  };
}
