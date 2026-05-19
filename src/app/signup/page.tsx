import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "../../lib/auth";
import styles from "../auth/auth.module.css";
import { SignupForm } from "./SignupForm";

export default async function SignupPage() {
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
          <span>START ENTERPING</span>
          <h1>회원가입</h1>
          <p>아이디와 비밀번호만으로 계정을 만들고 타이핑 기록, 로그인 streak, 보상 데이터를 이어가세요.</p>
        </div>

        <SignupForm />

        <p className={styles.switchText}>
          이미 계정이 있나요? <Link href="/login">로그인</Link>
        </p>
      </section>
    </main>
  );
}
