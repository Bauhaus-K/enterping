"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { signupAction } from "../auth/actions";
import styles from "../auth/auth.module.css";

const initialAuthState = { message: "" };

export function SignupForm() {
  const [state, formAction] = useActionState(signupAction, initialAuthState);

  return (
    <form action={formAction} className={styles.form}>
      <label>
        아이디
        <input
          name="username"
          autoComplete="username"
          pattern="[a-z0-9_]{3,24}"
          placeholder="enterping_user"
          required
        />
      </label>

      <label>
        표시 이름
        <input name="displayName" autoComplete="nickname" placeholder="예: Haru" />
      </label>

      <label>
        비밀번호
        <input name="password" autoComplete="new-password" minLength={8} required type="password" />
      </label>

      <label>
        비밀번호 확인
        <input name="passwordConfirm" autoComplete="new-password" minLength={8} required type="password" />
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
      {pending ? "가입 중..." : "회원가입"}
    </button>
  );
}
