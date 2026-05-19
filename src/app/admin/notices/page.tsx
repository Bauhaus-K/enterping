import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdminUser } from "../../../lib/admin";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

interface AdminNoticeViewModel {
  id: string;
  title: string;
  body: string;
  authorName: string;
  isPinned: boolean;
  isPublished: boolean;
  publishedAt: string;
}

export default async function AdminNoticesPage() {
  const currentUser = await getCurrentUser();

  if (!isAdminUser(currentUser)) {
    redirect("/notices");
  }

  const notices = await getAdminNotices();

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span>ADMIN NOTICE</span>
        <h1>공지사항 관리</h1>
        <p>관리자 전용 페이지에서 사용자에게 공개할 공지사항을 작성하고 게시 상태를 확인할 수 있습니다.</p>
        <Link href="/notices">사용자 공지 화면 보기</Link>
      </section>

      <section className={styles.layout}>
        <aside className={styles.editorPanel}>
          <div className={styles.sectionTitle}>
            <span>WRITE</span>
            <h2>새 공지 작성</h2>
          </div>

          <form action={createNotice} className={styles.noticeForm}>
            <label>
              제목
              <input name="title" placeholder="예: 신규 JPOP 스테이지 업데이트" required />
            </label>

            <label>
              작성자
              <input
                name="authorName"
                placeholder="Enterping Admin"
                defaultValue={currentUser?.displayName ?? currentUser?.username ?? "Enterping Admin"}
              />
            </label>

            <label>
              내용
              <textarea
                name="body"
                placeholder="사용자에게 안내할 공지 내용을 입력하세요."
                required
                rows={9}
              />
            </label>

            <div className={styles.optionRow}>
              <label>
                <input name="isPinned" type="checkbox" />
                상단 고정
              </label>
              <label>
                <input name="isPublished" type="checkbox" defaultChecked />
                즉시 공개
              </label>
            </div>

            <button type="submit">공지 등록</button>
          </form>
        </aside>

        <section className={styles.noticePanel}>
          <div className={styles.sectionTitle}>
            <span>MANAGE</span>
            <h2>등록된 공지</h2>
          </div>

          {notices.length > 0 ? (
            <div className={styles.noticeList}>
              {notices.map((notice) => (
                <article className={styles.noticeCard} key={notice.id}>
                  <div className={styles.noticeMeta}>
                    <div>
                      {notice.isPinned ? <strong>고정</strong> : null}
                      <strong className={notice.isPublished ? styles.published : styles.draft}>
                        {notice.isPublished ? "공개" : "비공개"}
                      </strong>
                    </div>
                    <time dateTime={notice.publishedAt}>{formatDateTime(notice.publishedAt)}</time>
                  </div>
                  <h3>{notice.title}</h3>
                  <p>{notice.body}</p>
                  <span className={styles.author}>작성자: {notice.authorName}</span>
                </article>
              ))}
            </div>
          ) : (
            <article className={styles.emptyNotice}>
              <h3>등록된 공지가 없습니다</h3>
              <p>왼쪽 작성 영역에서 첫 공지를 등록해주세요.</p>
            </article>
          )}
        </section>
      </section>
    </main>
  );
}

async function getAdminNotices(): Promise<AdminNoticeViewModel[]> {
  const notices = await prisma.notice.findMany({
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    take: 40,
  });

  return notices.map((notice) => ({
    id: notice.id,
    title: notice.title,
    body: notice.body,
    authorName: notice.authorName,
    isPinned: notice.isPinned,
    isPublished: notice.isPublished,
    publishedAt: notice.publishedAt.toISOString(),
  }));
}

async function createNotice(formData: FormData) {
  "use server";

  const currentUser = await getCurrentUser();

  if (!isAdminUser(currentUser)) {
    redirect("/notices");
  }

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const authorName = String(formData.get("authorName") ?? "Enterping Admin").trim() || "Enterping Admin";
  const isPinned = formData.get("isPinned") === "on";
  const isPublished = formData.get("isPublished") === "on";

  if (!title || !body) {
    return;
  }

  await prisma.notice.create({
    data: {
      title,
      body,
      authorId: currentUser?.id,
      authorName,
      isPinned,
      isPublished,
      publishedAt: new Date(),
    },
  });

  revalidatePath("/notices");
  revalidatePath("/admin/notices");
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
