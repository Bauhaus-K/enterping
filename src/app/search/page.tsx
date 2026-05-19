import Link from "next/link";

import { JPOP_SONGS, type JpopSong } from "../../lib/jpopSongs";
import { countJpopSongLines } from "../../lib/loadSongLyrics";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

interface SearchResult {
  song: JpopSong;
  lineCount: number;
}

const SONG_ALIASES: Record<string, string[]> = {
  "jpop-lemon": ["lemon", "レモン", "れもん", "레몬", "米津玄師", "요네즈 켄시"],
  "jpop-pretender": ["pretender", "プリテンダー", "프리텐더", "official髭男dism", "higedan", "히게단"],
  "jpop-gunjo": ["gunjo", "群青", "ぐんじょう", "군청", "yoasobi"],
  "jpop-gurenge": ["gurenge", "紅蓮華", "ぐれんげ", "홍련화", "lisa"],
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = getSearchParam(resolvedSearchParams.q)?.trim() ?? "";
  const results = await getSearchResults(query);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span>SONG SEARCH</span>
        <h1>검색 결과</h1>
        <p>
          {query
            ? `"${query}"에 대한 타이핑 곡 검색 결과입니다.`
            : "상단 검색창에서 곡명이나 아티스트를 입력해 보세요."}
        </p>
      </section>

      <section className={styles.resultPanel} aria-label="곡 검색 결과">
        <div className={styles.panelHeader}>
          <div>
            <span>JPOP Library</span>
            <h2>{query ? `${results.length}곡을 찾았습니다` : "추천 연습곡"}</h2>
          </div>
          <Link href="/typing">전체 곡 보기</Link>
        </div>

        {results.length > 0 ? (
          <div className={styles.resultGrid}>
            {results.map(({ song, lineCount }) => (
              <article className={styles.songCard} key={song.id}>
                <div className={styles.thumbnail}>
                  <img src={song.thumbnailUrl} alt={`${song.title} album art`} />
                </div>
                <div className={styles.songBody}>
                  <div>
                    <p>{song.artist}</p>
                    <h3>{song.title}</h3>
                  </div>
                  <dl>
                    <div>
                      <dt>Lv.{song.difficulty}</dt>
                      <dd>난이도</dd>
                    </div>
                    <div>
                      <dt>{lineCount}</dt>
                      <dd>LRC lines</dd>
                    </div>
                  </dl>
                  <div className={styles.actions}>
                    <Link href={`/play?contentId=${song.id}`}>바로 연습</Link>
                    <Link href={`/quiz/play?category=${song.category}`}>퀴즈로 보기</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <article className={styles.emptyState}>
            <h3>검색 결과가 없습니다</h3>
            <p>예: Lemon, 레몬, YOASOBI, 紅蓮華, Pretender처럼 입력해 보세요.</p>
            <Link href="/typing">연습곡 목록으로 이동</Link>
          </article>
        )}
      </section>
    </main>
  );
}

async function getSearchResults(query: string): Promise<SearchResult[]> {
  const normalizedQuery = normalizeSearchText(query);
  const matchedSongs = normalizedQuery
    ? JPOP_SONGS.filter((song) => doesSongMatch(song, normalizedQuery))
    : JPOP_SONGS;

  return Promise.all(
    matchedSongs.map(async (song) => ({
      song,
      lineCount: await countJpopSongLines(song),
    })),
  );
}

function doesSongMatch(song: JpopSong, normalizedQuery: string): boolean {
  const searchableText = [
    song.title,
    song.artist,
    song.category,
    ...(SONG_ALIASES[song.id] ?? []),
  ]
    .map(normalizeSearchText)
    .join(" ");

  return searchableText.includes(normalizedQuery);
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function getSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
