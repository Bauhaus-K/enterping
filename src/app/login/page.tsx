import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "../../lib/auth";
import styles from "../auth/auth.module.css";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/typing");
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Link className={styles.brand} href="/" aria-label="Enterping home">
          <span className={styles.logoMark} aria-hidden="true">
            <span />
          </span>
          <strong>エンターピング</strong>
        </Link>

        <div className={styles.heading}>
          <span>WELCOME BACK</span>
          <h1>로그인</h1>
          <p>아이디로 로그인하고 JPOP 타이핑 연습을 이어가세요.</p>
        </div>

        <LoginForm />

        <p className={styles.switchText}>
          아직 계정이 없나요? <Link href="/signup">회원가입</Link>
        </p>
      </section>
    </main>
  );
}
