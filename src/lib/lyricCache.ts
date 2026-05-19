import { get, set } from "idb-keyval";

import type { GamePlayerLyricSync } from "../components/game/types";

const LYRIC_CACHE_PREFIX = "enterping-lyrics-";

export async function getCachedLyrics(contentId: string): Promise<GamePlayerLyricSync[] | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const cached = await get<GamePlayerLyricSync[]>(`${LYRIC_CACHE_PREFIX}${contentId}`);
    return cached ?? null;
  } catch (error) {
    console.warn("[Enterping][Cache] Failed to get lyrics from IndexedDB", error);
    return null;
  }
}

export async function cacheLyrics(contentId: string, lyrics: GamePlayerLyricSync[]): Promise<void> {
  if (typeof window === "undefined" || !lyrics || lyrics.length === 0) {
    return;
  }

  try {
    await set(`${LYRIC_CACHE_PREFIX}${contentId}`, lyrics);
  } catch (error) {
    console.warn("[Enterping][Cache] Failed to cache lyrics to IndexedDB", error);
  }
}
