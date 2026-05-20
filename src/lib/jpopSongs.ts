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
    youtubeVideoId: "JyvKfwp9R14",
    title: "ひと夏の君へ",
    artist: "Absolute area",
    thumbnailUrl: "https://i.ytimg.com/vi/JyvKfwp9R14/hqdefault.jpg",
    category: "JPOP",
    difficulty: 3,
    playCount: 1980,
    syncOffsetMs: 0,
  },
  {
    id: "jpop-sakura-mitai-na-koi-nanda",
    youtubeVideoId: "L2XFosxgzuU",
    title: "桜みたいな恋なんだ",
    artist: "miwa",
    thumbnailUrl: "https://i.ytimg.com/vi/L2XFosxgzuU/hqdefault.jpg",
    category: "JPOP",
    difficulty: 3,
    playCount: 920,
    syncOffsetMs: 0,
  },
  {
    id: "jpop-kaze-to-machi",
    youtubeVideoId: "9NJI7cLZ2Qg",
    title: "風と町",
    artist: "Mrs. GREEN APPLE",
    thumbnailUrl: "https://i.ytimg.com/vi/9NJI7cLZ2Qg/hqdefault.jpg",
    category: "JPOP",
    difficulty: 4,
    playCount: 1180,
    syncOffsetMs: 0,
  },
  {
    id: "jpop-iris-out",
    youtubeVideoId: "LmZD-TU96q4",
    title: "IRIS OUT",
    artist: "Kenshi Yonezu",
    thumbnailUrl: "https://i.ytimg.com/vi/LmZD-TU96q4/hqdefault.jpg",
    category: "JPOP",
    difficulty: 4,
    playCount: 1360,
    syncOffsetMs: 0,
  },
  {
    id: "jpop-blue-jeans",
    youtubeVideoId: "r_AOa3yVz8A",
    title: "Blue Jeans",
    artist: "HANA",
    thumbnailUrl: "https://i.ytimg.com/vi/r_AOa3yVz8A/hqdefault.jpg",
    category: "JPOP",
    difficulty: 3,
    playCount: 1040,
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
