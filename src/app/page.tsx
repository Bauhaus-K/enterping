import Link from "next/link";

import { JPOP_SONGS } from "../lib/jpopSongs";
import styles from "./page.module.css";

const featuredSongs = JPOP_SONGS.slice(0, 3).map((song, index) => ({
  title: song.title,
  artist: song.artist,
  level: `Lv.${song.difficulty}`,
  progress: [72, 54, 64][index] ?? 58,
}));

const metrics = [
  { value: `${JPOP_SONGS.length}`, label: "연습 곡" },
  { value: "34", label: "테스트 통과" },
  { value: "2", label: "플레이 모드" },
];

export default function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroCopy}>
          <div className={styles.badge}>JPOP · Anime · Typing Practice</div>
          <h1 id="home-title">
            좋아하는 일본 콘텐츠로
            <span>타이핑 감각을 키우세요</span>
          </h1>
          <p>
            JPOP과 애니메이션 음악을 들으며 히라가나와 로마자를 따라 입력해보세요.
            노래의 리듬에 맞춰 연습하다 보면 일본어 발음과 문장 흐름이 자연스럽게 익숙해집니다.
          </p>

          <div className={styles.ctaRow}>
            <Link className={styles.primaryCta} href="/tutorial">
              3분 튜토리얼 시작
            </Link>
            <Link className={styles.primaryCta} href="#jpop-library">
              곡 선택하러 내려가기
            </Link>
            <Link className={styles.secondaryCta} href="/quiz">
              퀴즈 모드 보기
            </Link>
          </div>

          <dl className={styles.stats}>
            {metrics.map((metric) => (
              <div key={metric.label}>
                <dt>{metric.value}</dt>
                <dd>{metric.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className={styles.previewWrap} aria-label="Enterping game preview">
          <div className={styles.previewTopBar}>
            <span />
            <strong>Enterping Live</strong>
            <i>Romaji</i>
          </div>

          <div className={styles.videoPreview}>
            <div className={styles.albumArt}>
              <img
                src="https://i.ytimg.com/vi/SX_ViT4Ra7k/hqdefault.jpg"
                alt="Kenshi Yonezu Lemon album art"
              />
            </div>
          </div>

          <div className={styles.typingPreview}>
            <p className={styles.japaneseLine}>ゆめならばどれほどよかったでしょう</p>
            <p className={styles.romajiLine}>
              <span>yumenaraba</span>dorehodoyokattadeshou
            </p>
            <div className={styles.inputMock}>yumenaraba</div>
            <div className={styles.progressTrack}>
              <span />
            </div>
          </div>

          <div className={styles.songList}>
            {featuredSongs.map((song) => (
              <article key={song.title}>
                <div>
                  <strong>{song.title}</strong>
                  <span>{song.artist}</span>
                </div>
                <em>{song.level}</em>
                <meter min={0} max={100} value={song.progress}>
                  {song.progress}%
                </meter>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="jpop-library" className={styles.catalog} aria-labelledby="jpop-library-title">
        <div className={styles.catalogHeader}>
          <span>Choose Your Stage</span>
          <h2 id="jpop-library-title">J-pop 타이핑 게임을 선택하세요</h2>
          <p>
            카드에서 곡을 고르면 바로 타이핑 플레이 화면으로 이동합니다.
            각 곡은 영상과 자막 타임스탬프를 기반으로 연습할 수 있습니다.
          </p>
        </div>

        <div className={styles.songGrid}>
          {JPOP_SONGS.map((song, index) => (
            <article className={styles.songCard} key={song.id}>
              <Link className={styles.cardLink} href={`/play?contentId=${song.id}`}>
                <div className={styles.cardArtwork}>
                  <img src={song.thumbnailUrl} alt={`${song.title} album art`} />
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div className={styles.cardBody}>
                  <div>
                    <p>{song.artist}</p>
                    <h3>{song.title}</h3>
                  </div>
                  <dl>
                    <div>
                      <dt>Lv.{song.difficulty}</dt>
                      <dd>난이도</dd>
                    </div>
                    <div>
                      <dt>{song.playCount.toLocaleString()}</dt>
                      <dd>플레이</dd>
                    </div>
                  </dl>
                  <span className={styles.playButton}>타이핑 시작</span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
