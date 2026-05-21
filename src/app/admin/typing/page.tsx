import { ContentCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdminUser } from "../../../lib/admin";
import { getCurrentUser } from "../../../lib/auth";
import { parseLrc } from "../../../lib/lrcParser";
import { prisma } from "../../../lib/prisma";
import { prepareLrcLyricSyncLines, prepareLyricSyncLines, type PreparedLyricSyncLine } from "../../../lib/typingContentImporter";
import { fetchYouTubeCaptionLines } from "../../../lib/youtubeCaptions";
import { parseYouTubeUrl } from "../../../lib/youtube";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

interface AdminTypingPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

interface AdminTypingContentViewModel {
  id: string;
  youtubeVideoId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  difficulty: number;
  syncOffsetMs: number;
  durationMs: number;
  playCount: number;
  isPublished: boolean;
  isUgc: boolean;
  lyricLineCount: number;
  updatedAt: string;
}

export default async function AdminTypingPage({ searchParams }: AdminTypingPageProps) {
  const currentUser = await getCurrentUser();

  if (!isAdminUser(currentUser)) {
    redirect("/typing");
  }

  const [contents, resolvedSearchParams] = await Promise.all([
    getAdminTypingContents(),
    searchParams,
  ]);
  const notice = getSearchParam(resolvedSearchParams.notice);
  const error = getSearchParam(resolvedSearchParams.error);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span>ADMIN TYPING</span>
        <h1>J-POP 타이핑 곡 관리</h1>
        <p>
          YouTube 영상 정보, LRC 가사, YouTube 일본어 자막 가져오기, 공개/비공개 상태를 한 곳에서 관리합니다.
          공개된 곡만 사용자 타이핑 라이브러리에 노출됩니다.
        </p>
        <div className={styles.linkRow}>
          <Link href="/typing">타이핑 목록 확인</Link>
          <Link href="/play">플레이 화면 확인</Link>
          <Link href="/admin/quiz">퀴즈 관리</Link>
        </div>
        {notice ? <p className={styles.noticeMessage}>{notice}</p> : null}
        {error ? <p className={styles.errorMessage}>{error}</p> : null}
      </section>

      <section className={styles.layout}>
        <aside className={styles.editorPanel}>
          <div className={styles.sectionTitle}>
            <span>CREATE</span>
            <h2>새 타이핑 곡 등록</h2>
          </div>
          <TypingContentForm action={createTypingContent} submitLabel="곡 등록" />
        </aside>

        <section className={styles.contentPanel}>
          <div className={styles.sectionTitle}>
            <span>MANAGE</span>
            <h2>등록된 J-POP 타이핑 곡</h2>
          </div>

          <div className={styles.contentList}>
            {contents.map((content) => (
              <article className={styles.contentCard} key={content.id}>
                <div className={styles.cardHeader}>
                  <div className={styles.contentIdentity}>
                    <img alt="" src={content.thumbnailUrl} />
                    <div>
                      <strong>{content.title}</strong>
                      <span>{content.artist}</span>
                    </div>
                  </div>
                  <div className={styles.statusStack}>
                    <strong className={content.isPublished ? styles.published : styles.draft}>
                      {content.isPublished ? "공개" : "비공개"}
                    </strong>
                    <time dateTime={content.updatedAt}>{formatDateTime(content.updatedAt)}</time>
                  </div>
                </div>

                <dl className={styles.summaryGrid}>
                  <div>
                    <dt>{content.lyricLineCount}</dt>
                    <dd>LRC 라인</dd>
                  </div>
                  <div>
                    <dt>Lv. {content.difficulty}</dt>
                    <dd>난이도</dd>
                  </div>
                  <div>
                    <dt>{content.playCount.toLocaleString()}</dt>
                    <dd>플레이</dd>
                  </div>
                  <div>
                    <dt>{content.syncOffsetMs}ms</dt>
                    <dd>싱크 보정</dd>
                  </div>
                </dl>

                <details className={styles.detailBox}>
                  <summary>곡 정보 수정</summary>
                  <TypingContentForm
                    action={updateTypingContent}
                    content={content}
                    submitLabel="곡 정보 저장"
                  />
                </details>

                <div className={styles.toolGrid}>
                  <form action={uploadLrcForContent} className={styles.toolCard}>
                    <input name="contentId" type="hidden" value={content.id} />
                    <h3>LRC 업로드</h3>
                    <p>[mm:ss.xx]원문|히라가나 형식을 붙여넣거나 .lrc 파일을 업로드합니다.</p>
                    <input accept=".lrc,text/plain" name="lrcFile" type="file" />
                    <textarea
                      name="lrcText"
                      placeholder="[00:08.50]夢ならばどれほどよかったでしょう|ゆめならばどれほどよかったでしょう"
                      rows={5}
                    />
                    <button type="submit">LRC를 DB에 반영</button>
                  </form>

                  <form action={importYoutubeCaptionsForContent} className={styles.toolCard}>
                    <input name="contentId" type="hidden" value={content.id} />
                    <h3>YouTube 자막 가져오기</h3>
                    <p>영상에 공개 일본어 자막/자동자막이 있으면 타임스탬프를 가져와 LRC 라인으로 변환합니다.</p>
                    <label>
                      자막 언어 코드
                      <input name="languageCode" defaultValue="ja" />
                    </label>
                    <button type="submit">자막에서 LRC 생성</button>
                  </form>
                </div>

                <div className={styles.cardActions}>
                  <form action={toggleTypingContentPublished}>
                    <input name="contentId" type="hidden" value={content.id} />
                    <button type="submit">
                      {content.isPublished ? "비공개로 전환" : "공개로 전환"}
                    </button>
                  </form>
                  <Link href={`/play?contentId=${content.id}`}>미리보기</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function TypingContentForm({
  action,
  content,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  content?: AdminTypingContentViewModel;
  submitLabel: string;
}) {
  return (
    <form action={action} className={styles.contentForm}>
      {content ? <input name="existingId" type="hidden" value={content.id} /> : null}

      <div className={styles.twoColumns}>
        <label>
          콘텐츠 ID
          <input name="contentId" placeholder="jpop-new-song" defaultValue={content?.id ?? ""} />
        </label>
        <label>
          난이도
          <input min={1} max={5} name="difficulty" type="number" defaultValue={content?.difficulty ?? 3} />
        </label>
      </div>

      <label>
        YouTube URL 또는 ID
        <input name="youtubeInput" required defaultValue={content?.youtubeVideoId ?? ""} />
      </label>

      <div className={styles.twoColumns}>
        <label>
          곡명
          <input name="title" required defaultValue={content?.title ?? ""} />
        </label>
        <label>
          아티스트
          <input name="artist" defaultValue={content?.artist ?? ""} />
        </label>
      </div>

      <label>
        썸네일 URL
        <input name="thumbnailUrl" defaultValue={content?.thumbnailUrl ?? ""} />
      </label>

      <div className={styles.threeColumns}>
        <label>
          싱크 보정(ms)
          <input name="syncOffsetMs" type="number" defaultValue={content?.syncOffsetMs ?? 0} />
        </label>
        <label>
          영상 길이(ms)
          <input name="durationMs" type="number" defaultValue={content?.durationMs ?? 0} />
        </label>
        <label>
          플레이 수
          <input name="playCount" type="number" defaultValue={content?.playCount ?? 0} />
        </label>
      </div>

      <label className={styles.checkboxLabel}>
        <input name="isPublished" type="checkbox" defaultChecked={content?.isPublished ?? false} />
        공개 상태로 저장
      </label>

      <button type="submit">{submitLabel}</button>
    </form>
  );
}

async function getAdminTypingContents(): Promise<AdminTypingContentViewModel[]> {
  const contents = await prisma.content.findMany({
    where: {
      category: ContentCategory.JPOP,
    },
    include: {
      _count: {
        select: {
          lyricSyncs: true,
        },
      },
    },
    orderBy: [
      { updatedAt: "desc" },
      { createdAt: "desc" },
    ],
  });

  return contents.map((content) => ({
    id: content.id,
    youtubeVideoId: content.youtubeVideoId,
    title: content.title,
    artist: content.artist ?? "Unknown Artist",
    thumbnailUrl: content.thumbnailUrl ?? `https://i.ytimg.com/vi/${content.youtubeVideoId}/hqdefault.jpg`,
    difficulty: content.difficulty,
    syncOffsetMs: content.syncOffsetMs,
    durationMs: content.durationMs ?? 0,
    playCount: content.playCount,
    isPublished: content.isPublished,
    isUgc: content.isUgc,
    lyricLineCount: content._count.lyricSyncs,
    updatedAt: content.updatedAt.toISOString(),
  }));
}

async function createTypingContent(formData: FormData): Promise<void> {
  "use server";

  await assertAdmin();
  const data = safeParseTypingContentFormData(formData);
  const id = normalizeOptionalText(formData.get("contentId")) || buildContentId(data.title, data.youtubeVideoId);

  await prisma.content.upsert({
    where: { id },
    update: data,
    create: {
      id,
      ...data,
      category: ContentCategory.JPOP,
      isUgc: false,
    },
  });

  revalidateTypingPaths();
  redirectWithMessage("notice", `${data.title} 곡 정보가 저장되었습니다.`);
}

async function updateTypingContent(formData: FormData): Promise<void> {
  "use server";

  await assertAdmin();
  const existingId = normalizeRequiredText(formData.get("existingId"));
  const data = safeParseTypingContentFormData(formData);

  await prisma.content.update({
    where: { id: existingId },
    data,
  });

  revalidateTypingPaths();
  redirectWithMessage("notice", `${data.title} 곡 정보가 수정되었습니다.`);
}

async function uploadLrcForContent(formData: FormData): Promise<void> {
  "use server";

  await assertAdmin();
  const contentId = normalizeRequiredText(formData.get("contentId"));
  const lrcText = await readLrcTextFromFormData(formData);

  if (!lrcText) {
    redirectWithMessage("error", "업로드할 LRC 파일 또는 텍스트를 입력해주세요.");
  }

  const parsedLines = parseLrc(lrcText);

  if (parsedLines.length === 0) {
    redirectWithMessage("error", "LRC 타임스탬프가 포함된 가사 라인을 찾지 못했습니다.");
  }

  const preparedLines = await prepareLrcLyricSyncLines(parsedLines);
  await replaceLyricSyncs(contentId, preparedLines);

  revalidateTypingPaths();
  redirectWithMessage("notice", `${preparedLines.length}개 LRC 라인을 DB에 반영했습니다.`);
}

async function importYoutubeCaptionsForContent(formData: FormData): Promise<void> {
  "use server";

  await assertAdmin();
  const contentId = normalizeRequiredText(formData.get("contentId"));
  const languageCode = normalizeOptionalText(formData.get("languageCode")) || "ja";
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: {
      youtubeVideoId: true,
      title: true,
    },
  });

  if (!content) {
    redirectWithMessage("error", "자막을 가져올 곡을 찾지 못했습니다.");
  }

  let noticeMessage = "";

  try {
    const captionResult = await fetchYouTubeCaptionLines(content.youtubeVideoId, languageCode);
    const preparedLines = await prepareLyricSyncLines(captionResult.lines);
    await replaceLyricSyncs(contentId, preparedLines);

    revalidateTypingPaths();
    noticeMessage = `${content.title}에 ${preparedLines.length}개 YouTube 자막 라인을 반영했습니다. (${captionResult.trackName})`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "YouTube 자막을 가져오지 못했습니다.";
    redirectWithMessage("error", message);
  }

  redirectWithMessage("notice", noticeMessage);
}

async function toggleTypingContentPublished(formData: FormData): Promise<void> {
  "use server";

  await assertAdmin();
  const contentId = normalizeRequiredText(formData.get("contentId"));
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: {
      isPublished: true,
      title: true,
    },
  });

  if (!content) {
    redirectWithMessage("error", "공개 상태를 변경할 곡을 찾지 못했습니다.");
  }

  await prisma.content.update({
    where: { id: contentId },
    data: {
      isPublished: !content.isPublished,
    },
  });

  revalidateTypingPaths();
  redirectWithMessage("notice", `${content.title}을 ${content.isPublished ? "비공개" : "공개"}로 변경했습니다.`);
}

async function replaceLyricSyncs(contentId: string, lines: PreparedLyricSyncLine[]) {
  await prisma.$transaction([
    prisma.lyricSync.deleteMany({
      where: { contentId },
    }),
    prisma.lyricSync.createMany({
      data: lines.map((line) => ({
        id: `${contentId}-line-${line.lineIndex}`,
        contentId,
        lineIndex: line.lineIndex,
        startMs: line.startMs,
        endMs: line.endMs,
        japaneseText: line.japaneseText,
        romajiText: line.romajiText,
        koreanPronunciationText: line.koreanPronunciationText,
      })),
    }),
  ]);
}

async function assertAdmin() {
  const currentUser = await getCurrentUser();

  if (!isAdminUser(currentUser)) {
    redirect("/typing");
  }
}

function parseTypingContentFormData(formData: FormData) {
  const parsedYouTube = parseYouTubeUrl(normalizeRequiredText(formData.get("youtubeInput")));

  if (!parsedYouTube) {
    throw new Error("Invalid YouTube URL or video ID.");
  }

  const thumbnailUrl = normalizeOptionalText(formData.get("thumbnailUrl"));

  return {
    youtubeVideoId: parsedYouTube.videoId,
    title: normalizeRequiredText(formData.get("title")),
    artist: normalizeOptionalText(formData.get("artist")) || null,
    category: ContentCategory.JPOP,
    thumbnailUrl: thumbnailUrl || `https://i.ytimg.com/vi/${parsedYouTube.videoId}/hqdefault.jpg`,
    syncOffsetMs: clampNumber(formData.get("syncOffsetMs"), -30000, 30000, 0),
    durationMs: nullableNumber(formData.get("durationMs"), 0, 86_400_000),
    difficulty: clampNumber(formData.get("difficulty"), 1, 5, 3),
    playCount: clampNumber(formData.get("playCount"), 0, 999_999_999, 0),
    isPublished: formData.get("isPublished") === "on",
    isUgc: false,
  };
}

function safeParseTypingContentFormData(formData: FormData): ReturnType<typeof parseTypingContentFormData> {
  try {
    return parseTypingContentFormData(formData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "곡 정보를 해석하지 못했습니다.";
    redirectWithMessage("error", message);
  }
}

async function readLrcTextFromFormData(formData: FormData): Promise<string> {
  const pastedText = normalizeOptionalText(formData.get("lrcText"));
  const file = formData.get("lrcFile");

  if (file instanceof File && file.size > 0) {
    return file.text();
  }

  return pastedText;
}

function normalizeRequiredText(value: FormDataEntryValue | null): string {
  const normalized = normalizeOptionalText(value);

  if (!normalized) {
    throw new Error("Required field is empty.");
  }

  return normalized;
}

function normalizeOptionalText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function nullableNumber(value: FormDataEntryValue | null, min: number, max: number): number | null {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.min(max, Math.max(min, parsed));
}

function clampNumber(value: FormDataEntryValue | null, min: number, max: number, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

function buildContentId(title: string, videoId: string): string {
  const slug = title
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `jpop-${slug || videoId.toLowerCase()}`;
}

function getSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function redirectWithMessage(type: "notice" | "error", message: string): never {
  redirect(`/admin/typing?${type}=${encodeURIComponent(message)}`);
}

function revalidateTypingPaths() {
  revalidatePath("/");
  revalidatePath("/typing");
  revalidatePath("/play");
  revalidatePath("/search");
  revalidatePath("/admin/typing");
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
