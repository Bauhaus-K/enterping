"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { loginAction } from "../auth/actions";
import styles from "../auth/auth.module.css";

const initialAuthState = { message: "" };

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialAuthState);

  return (
    <form action={formAction} className={styles.form}>
      <label>
        아이디
        <input name="username" autoComplete="username" placeholder="enterping_user" required />
      </label>

      <label>
        비밀번호
        <input name="password" autoComplete="current-password" placeholder="8자 이상" required type="password" />
      </label>

      {state.message ? <p className={styles.error}>{state.message}</p> : null}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button disabled={pending} type="submit">
      {pending ? "로그인 중..." : "로그인"}
    </button>
  );
}
