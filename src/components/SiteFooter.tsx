import Link from "next/link";

import styles from "./SiteFooter.module.css";

const currentYear = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <section className={styles.brandBlock} aria-label="Enterping footer brand">
          <Link className={styles.brand} href="/" aria-label="Enterping home">
            <span className={styles.logoMark} aria-hidden="true">
              <span />
            </span>
            <strong>エンターピング</strong>
          </Link>
          <p>
            일본 문화 콘텐츠를 타이핑과 퀴즈로 즐기며, 플레이 기록과 실력 분석을 함께 쌓아가는
            J-POP 및 애니메이션 학습 플랫폼입니다.
          </p>
        </section>

        <nav className={styles.navGrid} aria-label="Footer navigation">
          <div>
            <h2>Play</h2>
            <Link href="/typing">타이핑</Link>
            <Link href="/quiz">퀴즈</Link>
            <Link href="/ranking">랭킹</Link>
          </div>
          <div>
            <h2>Account</h2>
            <Link href="/profile">프로필</Link>
            <Link href="/login">로그인</Link>
            <Link href="/signup">회원가입</Link>
          </div>
          <div>
            <h2>Info</h2>
            <Link href="/notices">공지사항</Link>
            <Link href="/search">곡 검색</Link>
            <Link href="/demo">데모</Link>
          </div>
        </nav>
      </div>

      <div className={styles.bottomBar}>
        <p>© {currentYear} Enterping. All rights reserved.</p>
        <p>Lyrics and media belong to their respective rights holders. Enterping is for learning and practice.</p>
      </div>
    </footer>
  );
}
