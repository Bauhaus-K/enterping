import { ContentCategory } from "@prisma/client";
import Link from "next/link";

import { JPOP_SONGS } from "../../lib/jpopSongs";
import { countJpopSongLines } from "../../lib/loadSongLyrics";
import { prisma } from "../../lib/prisma";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

interface JpopStage {
  id: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  difficulty: number;
  playCount: number;
  lineCount: number;
  href: string;
  hasLyrics: boolean;
}

export default async function TypingPage() {
  const [staticStages, databaseStages] = await Promise.all([
    getStaticStages(),
    getDatabaseStages(),
  ]);
  const stages = mergeStages(staticStages, databaseStages);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span>JPOP Typing Library</span>
        <h1>연습할 곡을 선택해주세요</h1>
        <p>
          좋아하는 JPOP과 애니메이션 곡을 고르고, 히라가나와 로마자를 따라 입력하며
          자연스럽게 일본어 리듬과 발음을 익혀보세요.
        </p>
      </section>

      <section className={styles.stageGrid} aria-label="JPOP typing stages">
        {stages.map((stage) => (
          <article className={styles.stageCard} key={stage.id}>
            <div className={styles.thumbnail} style={getThumbnailStyle(stage.thumbnailUrl)}>
              <span>Lv. {stage.difficulty}</span>
            </div>
            <div className={styles.cardBody}>
              <div>
                <p>{stage.artist}</p>
                <h2>{stage.title}</h2>
              </div>
              <dl>
                <div>
                  <dt>{stage.playCount.toLocaleString()}</dt>
                  <dd>플레이 수</dd>
                </div>
                <div>
                  <dt>{stage.lineCount}</dt>
                  <dd>가사 라인</dd>
                </div>
              </dl>
              <Link
                aria-disabled={!stage.hasLyrics}
                className={stage.hasLyrics ? styles.selectButton : styles.disabledButton}
                href={stage.hasLyrics ? stage.href : "/typing"}
              >
                {stage.hasLyrics ? "이 곡으로 타이핑 시작" : "가사 데이터 준비 중"}
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

async function getStaticStages(): Promise<JpopStage[]> {
  return Promise.all(
    JPOP_SONGS.map(async (song): Promise<JpopStage> => {
      const lineCount = await countJpopSongLines(song);

      return {
        id: song.id,
        title: song.title,
        artist: song.artist,
        thumbnailUrl: song.thumbnailUrl,
        difficulty: song.difficulty,
        playCount: song.playCount,
        lineCount,
        href: `/play?contentId=${song.id}`,
        hasLyrics: lineCount > 0,
      };
    }),
  );
}

async function getDatabaseStages(): Promise<JpopStage[]> {
  try {
    const contents = await prisma.content.findMany({
      where: {
        category: ContentCategory.JPOP,
        isPublished: true,
      },
      include: {
        _count: {
          select: {
            lyricSyncs: true,
          },
        },
      },
      orderBy: [
        { playCount: "desc" },
        { createdAt: "desc" },
      ],
    });

    return contents.map((content) => {
      const lineCount = content._count.lyricSyncs;

      return {
        id: content.id,
        title: content.title,
        artist: content.artist ?? "Unknown Artist",
        thumbnailUrl: content.thumbnailUrl ?? `https://i.ytimg.com/vi/${content.youtubeVideoId}/hqdefault.jpg`,
        difficulty: content.difficulty,
        playCount: content.playCount,
        lineCount,
        href: `/play?contentId=${content.id}`,
        hasLyrics: lineCount > 0,
      };
    });
  } catch (error) {
    console.warn("[Enterping][Typing] Failed to load DB stages. Falling back to bundled songs.", error);
    return [];
  }
}

function mergeStages(staticStages: JpopStage[], databaseStages: JpopStage[]): JpopStage[] {
  const stagesById = new Map(staticStages.map((stage) => [stage.id, stage]));
  const staticThumbnailUrls = new Set(staticStages.map((stage) => stage.thumbnailUrl));

  for (const stage of databaseStages) {
    if (!stagesById.has(stage.id) && staticThumbnailUrls.has(stage.thumbnailUrl)) {
      continue;
    }

    stagesById.set(stage.id, stage);
  }

  return Array.from(stagesById.values()).sort((left, right) => right.playCount - left.playCount);
}

function getThumbnailStyle(thumbnailUrl: string) {
  return {
    backgroundImage: `linear-gradient(180deg, rgba(18, 26, 39, 0.1), rgba(18, 26, 39, 0.48)), url(${thumbnailUrl})`,
  };
}
