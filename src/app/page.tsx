import Link from "next/link";

import styles from "./page.module.css";

const featuredSongs = [
  { title: "Lemon", artist: "Kenshi Yonezu", level: "Lv.2", progress: 72 },
  { title: "Pretender", artist: "Official Hige Dandism", level: "Lv.3", progress: 54 },
  { title: "Gurenge", artist: "LiSA", level: "Lv.3", progress: 64 },
];

const metrics = [
  { value: "4", label: "LRC 연습곡" },
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
            <span>타이핑 감각을 깨우세요</span>
          </h1>
          <p>
            최애 JPOP과 애니메이션 OST를 들으며 리듬에 맞춰 키보드를 두드려보세요! 
            화면을 스치는 가사를 따라잡다 보면, 어느새 일본어가 내 손끝에서 술술 흘러나옵니다. 
            지금 바로 당신의 타이핑 한계를 시험해보세요!
          </p>

          <div className={styles.ctaRow}>
            <Link className={styles.primaryCta} href="/typing">
              바로 타이핑 시작
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
    </main>
  );
}
