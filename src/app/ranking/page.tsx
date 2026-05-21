import Link from "next/link";

import { getCurrentUser } from "../../lib/auth";
import { JPOP_SONGS } from "../../lib/jpopSongs";
import { prisma } from "../../lib/prisma";
import { getContentScoreLeaderboard, getGlobalAverageSpmLeaderboard } from "../../lib/social";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

interface JpopRankingBlock {
  id: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  playCount: number;
  rows: Awaited<ReturnType<typeof getContentScoreLeaderboard>>;
}

export default async function RankingPage() {
  const currentUser = await getCurrentUser();
  const [globalRows, jpopRankings] = await Promise.all([
    getGlobalAverageSpmLeaderboard(10),
    getJpopRankingBlocks(),
  ]);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span>Enterping Ranking</span>
        <h1>전체 랭킹과 J-POP 곡별 랭킹</h1>
        <p>
          전체 사용자 기준 평균 타/분 랭킹과, 각 J-POP 타이핑 곡에서 가장 높은 점수를 기록한
          플레이어를 확인할 수 있습니다.
        </p>
      </section>

      <section className={styles.globalSection} aria-labelledby="global-ranking-title">
        <div className={styles.sectionHeader}>
          <div>
            <span>Global</span>
            <h2 id="global-ranking-title">전체 사용자 랭킹</h2>
          </div>
          <p>완료된 게임 세션의 평균 타/분 기준 Top 10입니다.</p>
        </div>

        <ol className={styles.globalList}>
          {globalRows.length > 0 ? (
            globalRows.map((row) => (
              <li
                className={row.userId === currentUser?.id ? styles.currentUserRow : styles.globalRow}
                key={row.userId}
              >
                <RankBadge rank={row.rank} />
                <div className={styles.userIdentity}>
                  <Avatar name={row.displayName ?? row.username} avatarUrl={row.avatarUrl} />
                  <div>
                    <strong>{row.displayName ?? row.username}</strong>
                    <span>@{row.username}</span>
                  </div>
                </div>
                <div className={styles.globalMetric}>
                  <strong>{row.averageStrokesPerMinute.toFixed(1)}</strong>
                  <span>평균 타/분</span>
                </div>
                <div className={styles.globalDetails}>
                  <span>{row.sessionCount}회 플레이</span>
                  <span>{row.averageWordsPerMinute.toFixed(1)} WPM</span>
                </div>
              </li>
            ))
          ) : (
            <li className={styles.emptyRow}>아직 전체 랭킹 데이터가 없습니다. 첫 플레이어가 왕관을 가져갈 차례입니다.</li>
          )}
        </ol>
      </section>

      <section className={styles.songSection} aria-labelledby="jpop-ranking-title">
        <div className={styles.sectionHeader}>
          <div>
            <span>J-POP Songs</span>
            <h2 id="jpop-ranking-title">J-POP 노래별 랭킹</h2>
          </div>
          <p>곡을 선택해 연습하고 최고 점수에 도전해보세요.</p>
        </div>

        <div className={styles.songGrid}>
          {jpopRankings.map((song) => (
            <article className={styles.songCard} key={song.id}>
              <div className={styles.songCover}>
                <img src={song.thumbnailUrl} alt={`${song.title} album art`} />
                <span>{song.rows[0] ? `#1 ${song.rows[0].score}점` : "기록 대기"}</span>
              </div>
              <div className={styles.songBody}>
                <div className={styles.songTitleRow}>
                  <div>
                    <p>{song.artist}</p>
                    <h3>{song.title}</h3>
                  </div>
                  <Link href={`/play?contentId=${song.id}`}>도전</Link>
                </div>

                <ol className={styles.songRankList}>
                  {song.rows.length > 0 ? (
                    song.rows.slice(0, 5).map((row) => (
                      <li
                        className={row.userId === currentUser?.id ? styles.currentSongRank : undefined}
                        key={`${song.id}-${row.rank}-${row.userId}`}
                      >
                        <span>{row.rank}</span>
                        <strong>{row.displayName ?? row.username}</strong>
                        <em>{row.score}점</em>
                        <small>{row.accuracy.toFixed(1)}% · {row.strokesPerMinute.toFixed(0)}타/분</small>
                      </li>
                    ))
                  ) : (
                    <li className={styles.emptySongRank}>
                      <strong>아직 기록이 없습니다</strong>
                      <small>이 곡의 첫 랭커가 되어보세요.</small>
                    </li>
                  )}
                </ol>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

async function getJpopRankingBlocks(): Promise<JpopRankingBlock[]> {
  const dbContents = await prisma.content.findMany({
    where: {
      isPublished: true,
      category: "JPOP",
    },
    select: {
      id: true,
      title: true,
      artist: true,
      thumbnailUrl: true,
      playCount: true,
    },
    orderBy: [{ playCount: "desc" }, { createdAt: "desc" }],
  });

  const dbContentIds = new Set(dbContents.map((content) => content.id));
  const staticOnlySongs = JPOP_SONGS.filter((song) => !dbContentIds.has(song.id)).map((song) => ({
    id: song.id,
    title: song.title,
    artist: song.artist,
    thumbnailUrl: song.thumbnailUrl,
    playCount: song.playCount,
  }));
  const songs = [...dbContents, ...staticOnlySongs]
    .sort((left, right) => right.playCount - left.playCount)
    .slice(0, 12);

  return Promise.all(
    songs.map(async (song) => ({
      id: song.id,
      title: song.title,
      artist: song.artist ?? "Unknown Artist",
      thumbnailUrl: song.thumbnailUrl ?? `https://i.ytimg.com/vi/${song.id}/hqdefault.jpg`,
      playCount: song.playCount,
      rows: await getContentScoreLeaderboard(song.id, 5),
    })),
  );
}

function RankBadge({ rank }: { rank: number }) {
  return <div className={styles.rankBadge}>{rank}</div>;
}

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return <img className={styles.avatar} src={avatarUrl} alt="" />;
  }

  return <div className={styles.avatarFallback}>{getInitial(name)}</div>;
}

function getInitial(value: string): string {
  return Array.from(value.trim())[0]?.toUpperCase() ?? "E";
}
