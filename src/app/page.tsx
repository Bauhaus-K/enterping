import Link from "next/link";

import { isAdminUser } from "../lib/admin";
import { getCurrentUser } from "../lib/auth";
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

const adminCards = [
  {
    href: "/admin/operations",
    eyebrow: "OPERATIONS",
    title: "운영 현황",
    description: "DAU/WAU, 인기 곡, 실패율 높은 곡, 자막 오류 의심 라인을 확인합니다.",
  },
  {
    href: "/admin/typing",
    eyebrow: "TYPING DB",
    title: "타이핑 곡 관리",
    description: "J-pop 타이핑 곡, LRC 라인, YouTube 자막 가져오기, 공개 상태를 관리합니다.",
  },
  {
    href: "/admin/quiz",
    eyebrow: "QUIZ DB",
    title: "퀴즈 관리",
    description: "JPOP/ANIME 퀴즈 문제와 YouTube 오디오 구간을 관리합니다.",
  },
  {
    href: "/admin/notices",
    eyebrow: "NOTICE",
    title: "공지 관리",
    description: "사용자에게 노출되는 공지사항을 작성하고 공개 여부를 조정합니다.",
  },
];

export default async function HomePage() {
  const currentUser = await getCurrentUser();

  if (isAdminUser(currentUser)) {
    return <AdminHome username={currentUser?.displayName ?? currentUser?.username ?? "Admin"} />;
  }

  return <PublicHome />;
}

function AdminHome({ username }: { username: string }) {
  return (
    <main className={`${styles.page} ${styles.adminPage}`}>
      <section className={styles.adminHero} aria-labelledby="admin-home-title">
        <div>
          <span className={styles.adminBadge}>ADMIN HOME</span>
          <h1 id="admin-home-title">
            {username}님,
            <span>오늘의 운영을 시작하세요</span>
          </h1>
          <p>
            관리자 로그인 상태에서는 일반 랜딩 대신 운영 허브를 먼저 보여줍니다.
            콘텐츠 품질, 플레이 데이터, 공지, 퀴즈를 빠르게 점검하세요.
          </p>
        </div>

        <div className={styles.adminQuickStats}>
          <article>
            <strong>{JPOP_SONGS.length}</strong>
            <span>등록된 J-pop 곡</span>
          </article>
          <article>
            <strong>4</strong>
            <span>관리 메뉴</span>
          </article>
          <article>
            <strong>Live</strong>
            <span>운영 모드</span>
          </article>
        </div>
      </section>

      <section className={styles.adminGrid} aria-label="관리자 바로가기">
        {adminCards.map((card) => (
          <Link className={styles.adminCard} href={card.href} key={card.href}>
            <span>{card.eyebrow}</span>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            <strong>바로가기</strong>
          </Link>
        ))}
      </section>
    </main>
  );
}

function PublicHome() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroCopy}>
          <div className={styles.badge}>JPOP · Anime · Typing Practice</div>
          <h1 id="home-title">
            좋아하는 일본 콘텐츠로
            <span>타이핑을 즐겨라</span>
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
