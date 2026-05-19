import Link from "next/link";

import { logoutAction } from "../app/auth/actions";
import { isAdminUser } from "../lib/admin";
import { getCurrentUser } from "../lib/auth";
import styles from "./SiteHeader.module.css";

export async function SiteHeader() {
  const currentUser = await getCurrentUser();
  const canOpenAdmin = isAdminUser(currentUser);

  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label="Enterping home">
        <span className={styles.logoMark} aria-hidden="true">
          <span />
        </span>
        <strong>エンターピング</strong>
      </Link>

      <nav className={styles.nav} aria-label="Primary navigation">
        <Link href="/typing">타이핑</Link>
        <Link href="/quiz">퀴즈</Link>
        <Link href="/notices">공지</Link>
        {canOpenAdmin ? <Link href="/admin/quiz">퀴즈관리</Link> : null}
        {canOpenAdmin ? <Link href="/admin/notices">공지관리</Link> : null}
      </nav>

      <div className={styles.actions}>
        <form className={styles.search} action="/search" role="search">
          <button className={styles.searchIcon} type="submit" aria-label="검색">
            🔍
          </button>
          <input name="q" type="search" placeholder="곡명, 아티스트 검색" />
          <kbd>Enter</kbd>
        </form>

        {currentUser ? (
          <>
            <Link className={styles.userPill} href="/typing">
              {currentUser.displayName ?? currentUser.username}
            </Link>
            <form action={logoutAction}>
              <button className={styles.logoutButton} type="submit">
                로그아웃
              </button>
            </form>
          </>
        ) : (
          <>
            <Link className={styles.loginButton} href="/login">
              로그인
            </Link>
            <Link className={styles.signupButton} href="/signup">
              회원가입
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
