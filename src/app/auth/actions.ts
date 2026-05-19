"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";

import { clearAuthCookie, setAuthCookie } from "../../lib/auth";
import { hashPassword, verifyPassword } from "../../lib/password";
import { prisma } from "../../lib/prisma";
import { recordLoginAndUpdateStreak, unlockRewardsForUser } from "../../lib/rewards";

export interface AuthActionState {
  message: string;
}

const KOREA_TIMEZONE_OFFSET_MINUTES = 9 * 60;

export async function signupAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const username = normalizeUsername(formData.get("username"));
  const displayName = normalizeOptionalText(formData.get("displayName"));
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (!isValidUsername(username)) {
    return { message: "아이디는 영문 소문자, 숫자, 밑줄만 사용해 3~24자로 입력해 주세요." };
  }

  if (password.length < 8) {
    return { message: "비밀번호는 8자 이상이어야 합니다." };
  }

  if (password !== passwordConfirm) {
    return { message: "비밀번호 확인이 일치하지 않습니다." };
  }

  try {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: createInternalEmail(username),
        username,
        displayName: displayName || username,
        passwordHash,
      },
      select: {
        id: true,
      },
    });

    await afterSuccessfulLogin(user.id);
    await setAuthCookie(user.id);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { message: "이미 사용 중인 아이디입니다." };
    }

    console.error("[Enterping][Auth] Signup failed", error);
    return { message: "회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." };
  }

  redirect("/typing");
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const username = normalizeUsername(formData.get("username"));
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { message: "아이디와 비밀번호를 입력해 주세요." };
  }

  const user = await prisma.user.findUnique({
    where: {
      username,
    },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { message: "아이디 또는 비밀번호가 올바르지 않습니다." };
  }

  await afterSuccessfulLogin(user.id);
  await setAuthCookie(user.id);

  redirect("/typing");
}

export async function logoutAction(): Promise<void> {
  await clearAuthCookie();
  redirect("/");
}

async function afterSuccessfulLogin(userId: string): Promise<void> {
  try {
    await recordLoginAndUpdateStreak({
      userId,
      timezoneOffsetMinutes: KOREA_TIMEZONE_OFFSET_MINUTES,
    });
    await unlockRewardsForUser({ userId });
  } catch (error) {
    console.warn("[Enterping][Auth] Login reward/streak update failed", error);
  }
}

function normalizeUsername(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeOptionalText(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

function isValidUsername(value: string): boolean {
  return /^[a-z0-9_]{3,24}$/.test(value);
}

function createInternalEmail(username: string): string {
  return `${username}@enterping.local`;
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
