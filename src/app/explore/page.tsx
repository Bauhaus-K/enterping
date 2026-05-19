import { ContentCategory } from "@prisma/client";
import Link from "next/link";

import { Leaderboard, type LeaderboardRow } from "../../components/Leaderboard";
import {
  getGlobalAverageSpmLeaderboard,
  getUgcExplorerContent,
  type UgcExplorerItem,
  type UgcExplorerSort,
} from "../../lib/social";
import styles from "./page.module.css";

interface ExplorePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const CATEGORY_FILTERS = [
  { label: "All", value: undefined },
  { label: "J-POP", value: ContentCategory.JPOP },
  { label: "Anime", value: ContentCategory.ANIME },
] as const;

const SORT_FILTERS = [
  { label: "Newest", value: "newest" },
  { label: "Most Played", value: "mostPlayed" },
] as const;

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const resolvedSearchParams = await searchParams;
  const category = parseCategory(getSearchParam(resolvedSearchParams.category));
  const sort = parseSort(getSearchParam(resolvedSearchParams.sort));
  const currentUserId = getSearchParam(resolvedSearchParams.currentUserId);
  const [content, globalLeaderboard] = await Promise.all([
    getUgcExplorerContent({
      category,
      sort,
      currentUserId,
    }),
    getGlobalAverageSpmLeaderboard(10),
  ]);
  const leaderboardRows = globalLeaderboard.map<LeaderboardRow>((entry) => ({
    rank: entry.rank,
    userId: entry.userId,
    username: entry.username,
    displayName: entry.displayName,
    avatarUrl: entry.avatarUrl,
    value: `${Math.round(entry.averageStrokesPerMinute)}`,
    valueLabel: "avg 打/分",
    details: [`${entry.sessionCount} sessions`, `${entry.averageWordsPerMinute.toFixed(1)} WPM`],
  }));

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Community</span>
          <h1>Explore fan-made typing stages</h1>
          <p>
            Browse Japanese culture typing content created by other players, then chase the global
            speed board.
          </p>
        </div>
      </section>

      <section className={styles.filters} aria-label="UGC explorer filters">
        <div>
          <span>Category</span>
          <div className={styles.filterPills}>
            {CATEGORY_FILTERS.map((filter) => (
              <Link
                className={filter.value === category ? styles.activePill : styles.pill}
                href={buildExploreHref({ category: filter.value, sort, currentUserId })}
                key={filter.label}
              >
                {filter.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <span>Sort</span>
          <div className={styles.filterPills}>
            {SORT_FILTERS.map((filter) => (
              <Link
                className={filter.value === sort ? styles.activePill : styles.pill}
                href={buildExploreHref({ category, sort: filter.value, currentUserId })}
                key={filter.value}
              >
                {filter.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.layout}>
        <section className={styles.contentGrid} aria-label="User generated content">
          {content.length > 0 ? (
            content.map((item) => <UgcCard item={item} key={item.id} />)
          ) : (
            <div className={styles.emptyState}>
              <strong>No UGC found</strong>
              <p>Try a different filter, or publish the first stage for this category.</p>
            </div>
          )}
        </section>

        <aside>
          <Leaderboard
            title="Global Speed"
            subtitle="Top average strokes per minute across all completed sessions."
            rows={leaderboardRows}
            currentUserId={currentUserId}
          />
        </aside>
      </div>
    </main>
  );
}

function UgcCard({ item }: { item: UgcExplorerItem }) {
  return (
    <article className={styles.card}>
      <div className={styles.thumbnailFrame}>
        {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" /> : <div className={styles.thumbnailFallback} />}
        <span>{item.category}</span>
      </div>

      <div className={styles.cardBody}>
        <h2>{item.title}</h2>
        <p>{item.artist ?? "Unknown artist"}</p>
        <div className={styles.metaRow}>
          <span>{item.playCount} plays</span>
          <span>{item.lyricLineCount} lines</span>
          <span>Lv. {item.difficulty}</span>
        </div>
        <div className={styles.creatorRow}>
          <span>Created by</span>
          <strong>{item.creator?.displayName || item.creator?.username || "Anonymous"}</strong>
        </div>
      </div>
    </article>
  );
}

function buildExploreHref({
  category,
  sort,
  currentUserId,
}: {
  category?: ContentCategory;
  sort: UgcExplorerSort;
  currentUserId?: string;
}): string {
  const params = new URLSearchParams();

  if (category) {
    params.set("category", category);
  }

  if (sort !== "newest") {
    params.set("sort", sort);
  }

  if (currentUserId) {
    params.set("currentUserId", currentUserId);
  }

  const query = params.toString();
  return query ? `/explore?${query}` : "/explore";
}

function parseCategory(value?: string): ContentCategory | undefined {
  const normalizedValue = value?.toUpperCase();

  if (normalizedValue === ContentCategory.JPOP || normalizedValue === ContentCategory.ANIME) {
    return normalizedValue;
  }

  return undefined;
}

function parseSort(value?: string): UgcExplorerSort {
  return value === "mostPlayed" ? "mostPlayed" : "newest";
}

function getSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
