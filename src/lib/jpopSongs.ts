export interface JpopSongLyricLine {
  japaneseText: string;
  typingText: string;
  startMs: number;
  endMs: number;
}

export interface JpopSong {
  id: string;
  youtubeVideoId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  category: string;
  difficulty: number;
  playCount: number;
  syncOffsetMs?: number;
  lyricLines?: JpopSongLyricLine[];
}

export const JPOP_SONGS: JpopSong[] = [
  {
    id: "jpop-lemon",
    youtubeVideoId: "SX_ViT4Ra7k",
    title: "Lemon",
    artist: "Kenshi Yonezu",
    thumbnailUrl: "https://i.ytimg.com/vi/SX_ViT4Ra7k/hqdefault.jpg",
    category: "JPOP",
    difficulty: 2,
    playCount: 1820,
    syncOffsetMs: 0,
  },
  {
    id: "jpop-pretender",
    youtubeVideoId: "TQ8WlA2GXbk",
    title: "Pretender",
    artist: "Official Hige Dandism",
    thumbnailUrl: "https://i.ytimg.com/vi/TQ8WlA2GXbk/hqdefault.jpg",
    category: "JPOP",
    difficulty: 3,
    playCount: 1540,
    syncOffsetMs: 0,
  },
  {
    id: "jpop-gunjo",
    youtubeVideoId: "OxzdMNTJXmg",
    title: "Walking with you",
    artist: "Novelbright",
    thumbnailUrl: "https://i.ytimg.com/vi/OxzdMNTJXmg/hqdefault.jpg",
    category: "JPOP",
    difficulty: 4,
    playCount: 2230,
    syncOffsetMs: 0,
  },
  {
    id: "jpop-gurenge",
    youtubeVideoId: "CwkzK-F0Y00",
    title: "Gurenge",
    artist: "LiSA",
    thumbnailUrl: "https://i.ytimg.com/vi/CwkzK-F0Y00/hqdefault.jpg",
    category: "JPOP",
    difficulty: 3,
    playCount: 1980,
    syncOffsetMs: 0,
  },
];

export function getJpopSongById(id: string): JpopSong | undefined {
  return JPOP_SONGS.find((song) => song.id === id);
}

export function buildJpopSongGameContent(song: JpopSong) {
  return {
    id: song.id,
    youtubeVideoId: song.youtubeVideoId,
    title: song.title,
    artist: song.artist,
    category: song.category,
    thumbnailUrl: song.thumbnailUrl,
    syncOffsetMs: song.syncOffsetMs ?? 0,
  };
}
