import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdminUser } from "../../../lib/admin";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import type { QuizCategory } from "../../../lib/quizData";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

interface AdminQuizViewModel {
  id: string;
  slug: string;
  category: QuizCategory;
  prompt: string;
  clue: string;
  answer: string;
  acceptedAnswers: string;
  workTitle: string;
  artistOrStudio: string;
  tags: string;
  difficulty: number;
  sortOrder: number;
  youtubeVideoId: string;
  audioStartSeconds: number;
  audioDurationSeconds: number;
  thumbnailUrl: string;
  revealImageUrl: string;
  isPublished: boolean;
  updatedAt: string;
}

export default async function AdminQuizPage() {
  const currentUser = await getCurrentUser();

  if (!isAdminUser(currentUser)) {
    redirect("/quiz");
  }

  const questions = await getAdminQuizQuestions();

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span>ADMIN QUIZ</span>
        <h1>퀴즈 DB 관리</h1>
        <p>
          JPOP과 애니메이션 퀴즈를 운영 DB에서 직접 등록하고 수정합니다.
          공개된 문제는 즉시 퀴즈 플레이 화면에 반영됩니다.
        </p>
        <div className={styles.linkRow}>
          <Link href="/quiz/play?category=JPOP">JPOP 퀴즈 확인</Link>
          <Link href="/quiz/play?category=ANIME">애니메이션 퀴즈 확인</Link>
        </div>
      </section>

      <section className={styles.layout}>
        <aside className={styles.editorPanel}>
          <div className={styles.sectionTitle}>
            <span>CREATE</span>
            <h2>새 퀴즈 등록</h2>
          </div>

          <QuizForm action={createQuizQuestion} submitLabel="퀴즈 등록" />
        </aside>

        <section className={styles.questionPanel}>
          <div className={styles.sectionTitle}>
            <span>MANAGE</span>
            <h2>등록된 퀴즈</h2>
          </div>

          <div className={styles.questionList}>
            {questions.map((question) => (
              <article className={styles.questionCard} key={question.id}>
                <div className={styles.cardHeader}>
                  <div>
                    <strong>{question.category}</strong>
                    <strong className={question.isPublished ? styles.published : styles.draft}>
                      {question.isPublished ? "공개" : "비공개"}
                    </strong>
                  </div>
                  <time dateTime={question.updatedAt}>{formatDateTime(question.updatedAt)}</time>
                </div>

                <QuizForm
                  action={updateQuizQuestion}
                  question={question}
                  submitLabel="수정 저장"
                />

                <div className={styles.cardActions}>
                  <form action={toggleQuizQuestionPublished}>
                    <input name="id" type="hidden" value={question.id} />
                    <button type="submit">
                      {question.isPublished ? "비공개 전환" : "공개 전환"}
                    </button>
                  </form>
                  <form action={deleteQuizQuestion}>
                    <input name="id" type="hidden" value={question.id} />
                    <button className={styles.deleteButton} type="submit">
                      삭제
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function QuizForm({
  action,
  question,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  question?: AdminQuizViewModel;
  submitLabel: string;
}) {
  return (
    <form action={action} className={styles.quizForm}>
      {question ? <input name="id" type="hidden" value={question.id} /> : null}

      <div className={styles.twoColumns}>
        <label>
          카테고리
          <select name="category" defaultValue={question?.category ?? "JPOP"}>
            <option value="JPOP">JPOP</option>
            <option value="ANIME">ANIME</option>
          </select>
        </label>
        <label>
          정렬 순서
          <input name="sortOrder" type="number" defaultValue={question?.sortOrder ?? 0} />
        </label>
      </div>

      <label>
        슬러그
        <input name="slug" placeholder="jpop-new-song" required defaultValue={question?.slug ?? ""} />
      </label>

      <label>
        문제 문구
        <input name="prompt" placeholder="곡명을 맞혀주세요" required defaultValue={question?.prompt ?? ""} />
      </label>

      <label>
        힌트
        <textarea name="clue" rows={3} required defaultValue={question?.clue ?? ""} />
      </label>

      <div className={styles.twoColumns}>
        <label>
          정답
          <input name="answer" required defaultValue={question?.answer ?? ""} />
        </label>
        <label>
          난이도
          <input min={1} max={5} name="difficulty" type="number" defaultValue={question?.difficulty ?? 2} />
        </label>
      </div>

      <label>
        허용 답안
        <input
          name="acceptedAnswers"
          placeholder="Lemon, 레몬, 米津玄師"
          required
          defaultValue={question?.acceptedAnswers ?? ""}
        />
      </label>

      <div className={styles.twoColumns}>
        <label>
          작품명
          <input name="workTitle" required defaultValue={question?.workTitle ?? ""} />
        </label>
        <label>
          아티스트 / 스튜디오
          <input name="artistOrStudio" required defaultValue={question?.artistOrStudio ?? ""} />
        </label>
      </div>

      <label>
        태그
        <input name="tags" placeholder="JPOP, Band, 2026" required defaultValue={question?.tags ?? "JPOP"} />
      </label>

      <div className={styles.twoColumns}>
        <label>
          YouTube ID
          <input name="youtubeVideoId" defaultValue={question?.youtubeVideoId ?? ""} />
        </label>
        <label>
          썸네일 URL
          <input name="thumbnailUrl" defaultValue={question?.thumbnailUrl ?? ""} />
        </label>
      </div>

      <div className={styles.twoColumns}>
        <label>
          시작 초
          <input name="audioStartSeconds" type="number" defaultValue={question?.audioStartSeconds ?? 0} />
        </label>
        <label>
          재생 길이
          <input name="audioDurationSeconds" type="number" defaultValue={question?.audioDurationSeconds ?? 5} />
        </label>
      </div>

      <label>
        정답 공개 이미지 URL
        <input name="revealImageUrl" defaultValue={question?.revealImageUrl ?? ""} />
      </label>

      <label className={styles.checkboxLabel}>
        <input name="isPublished" type="checkbox" defaultChecked={question?.isPublished ?? true} />
        공개 상태로 저장
      </label>

      <button type="submit">{submitLabel}</button>
    </form>
  );
}

async function getAdminQuizQuestions(): Promise<AdminQuizViewModel[]> {
  const questions = await prisma.quizQuestion.findMany({
    orderBy: [
      { category: "asc" },
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
  });

  return questions.map((question) => ({
    id: question.id,
    slug: question.slug,
    category: question.category,
    prompt: question.prompt,
    clue: question.clue,
    answer: question.answer,
    acceptedAnswers: question.acceptedAnswers.join(", "),
    workTitle: question.workTitle,
    artistOrStudio: question.artistOrStudio,
    tags: question.tags.join(", "),
    difficulty: question.difficulty,
    sortOrder: question.sortOrder,
    youtubeVideoId: question.youtubeVideoId ?? "",
    audioStartSeconds: question.audioStartSeconds ?? 0,
    audioDurationSeconds: question.audioDurationSeconds ?? 5,
    thumbnailUrl: question.thumbnailUrl ?? "",
    revealImageUrl: question.revealImageUrl ?? "",
    isPublished: question.isPublished,
    updatedAt: question.updatedAt.toISOString(),
  }));
}

async function createQuizQuestion(formData: FormData): Promise<void> {
  "use server";

  await assertAdmin();
  const data = parseQuizFormData(formData);

  await prisma.quizQuestion.create({
    data,
  });

  revalidateQuizPaths();
}

async function updateQuizQuestion(formData: FormData): Promise<void> {
  "use server";

  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const data = parseQuizFormData(formData);

  if (!id) {
    return;
  }

  await prisma.quizQuestion.update({
    where: { id },
    data,
  });

  revalidateQuizPaths();
}

async function toggleQuizQuestionPublished(formData: FormData): Promise<void> {
  "use server";

  await assertAdmin();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  const question = await prisma.quizQuestion.findUnique({
    where: { id },
    select: { isPublished: true },
  });

  if (!question) {
    return;
  }

  await prisma.quizQuestion.update({
    where: { id },
    data: { isPublished: !question.isPublished },
  });

  revalidateQuizPaths();
}

async function deleteQuizQuestion(formData: FormData): Promise<void> {
  "use server";

  await assertAdmin();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  await prisma.quizQuestion.delete({
    where: { id },
  });

  revalidateQuizPaths();
}

async function assertAdmin() {
  const currentUser = await getCurrentUser();

  if (!isAdminUser(currentUser)) {
    redirect("/quiz");
  }
}

function parseQuizFormData(formData: FormData) {
  const youtubeVideoId = normalizeOptionalText(formData.get("youtubeVideoId"));
  const thumbnailUrl = normalizeOptionalText(formData.get("thumbnailUrl"));
  const revealImageUrl = normalizeOptionalText(formData.get("revealImageUrl"));

  return {
    slug: normalizeRequiredText(formData.get("slug")),
    category: parseCategory(formData.get("category")),
    prompt: normalizeRequiredText(formData.get("prompt")),
    clue: normalizeRequiredText(formData.get("clue")),
    answer: normalizeRequiredText(formData.get("answer")),
    acceptedAnswers: parseCsv(formData.get("acceptedAnswers")),
    workTitle: normalizeRequiredText(formData.get("workTitle")),
    artistOrStudio: normalizeRequiredText(formData.get("artistOrStudio")),
    tags: parseCsv(formData.get("tags")),
    difficulty: clampNumber(formData.get("difficulty"), 1, 5, 2),
    sortOrder: clampNumber(formData.get("sortOrder"), 0, 9999, 0),
    youtubeVideoId: youtubeVideoId || null,
    audioStartSeconds: youtubeVideoId ? clampNumber(formData.get("audioStartSeconds"), 0, 99999, 0) : null,
    audioDurationSeconds: youtubeVideoId ? clampNumber(formData.get("audioDurationSeconds"), 1, 60, 5) : null,
    thumbnailUrl: thumbnailUrl || null,
    revealImageUrl: revealImageUrl || null,
    isPublished: formData.get("isPublished") === "on",
  };
}

function parseCategory(value: FormDataEntryValue | null): QuizCategory {
  return String(value ?? "").toUpperCase() === "ANIME" ? "ANIME" : "JPOP";
}

function normalizeRequiredText(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

function normalizeOptionalText(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

function parseCsv(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function clampNumber(value: FormDataEntryValue | null, min: number, max: number, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

function revalidateQuizPaths() {
  revalidatePath("/quiz");
  revalidatePath("/quiz/play");
  revalidatePath("/admin/quiz");
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
