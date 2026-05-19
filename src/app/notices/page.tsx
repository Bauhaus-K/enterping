import Link from "next/link";

import { isAdminUser } from "../../lib/admin";
import { getCurrentUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

interface NoticeViewModel {
  id: string;
  title: string;
  body: string;
  authorName: string;
  isPinned: boolean;
  publishedAt: string;
}

const FALLBACK_NOTICES: NoticeViewModel[] = [
  {
    id: "fallback-welcome",
    title: "Enterping 공지 페이지가 준비되었습니다",
    body: "서비스 업데이트, 신규 콘텐츠, 이벤트 안내를 이곳에서 확인할 수 있습니다.",
    authorName: "Enterping Admin",
    isPinned: true,
    publishedAt: new Date("2026-05-11T09:00:00.000Z").toISOString(),
  },
];

export default async function NoticesPage() {
  const [notices, currentUser] = await Promise.all([getNotices(), getCurrentUser()]);
  const canOpenAdmin = isAdminUser(currentUser);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span>ENTERPING NEWS</span>
        <h1>공지사항</h1>
        <p>서비스 업데이트, 신규 JPOP/애니 콘텐츠 추가 및 이벤트 소식을 확인하세요.</p>
        {canOpenAdmin ? (
          <Link className={styles.adminLink} href="/admin/notices">
            관리자 페이지로 이동
          </Link>
        ) : null}
      </section>

      <section className={styles.noticeBoard} aria-label="공지사항 목록">
        <div className={styles.boardHeader}>
          <div>
            <span>Latest</span>
            <h2>최근 공지</h2>
          </div>
          <p>{notices.length}개의 공지가 공개되어 있습니다.</p>
        </div>

        {notices.length > 0 ? (
          <div className={styles.noticeList}>
            {notices.map((notice) => (
              <article className={notice.isPinned ? styles.pinnedNotice : styles.noticeCard} key={notice.id}>
                <div className={styles.noticeMeta}>
                  <strong>{notice.isPinned ? "고정 공지" : "공지"}</strong>
                  <time dateTime={notice.publishedAt}>{formatDate(notice.publishedAt)}</time>
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
            <p>새로운 소식이 준비되면 이곳에 표시됩니다.</p>
          </article>
        )}
      </section>
    </main>
  );
}

async function getNotices(): Promise<NoticeViewModel[]> {
  try {
    const notices = await prisma.notice.findMany({
      where: {
        isPublished: true,
      },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      take: 20,
    });

    return notices.map((notice) => ({
      id: notice.id,
      title: notice.title,
      body: notice.body,
      authorName: notice.authorName,
      isPinned: notice.isPinned,
      publishedAt: notice.publishedAt.toISOString(),
    }));
  } catch (error) {
    console.warn("[Enterping][Notices] Failed to load notices. Falling back to demo notice.", error);
    return FALLBACK_NOTICES;
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
