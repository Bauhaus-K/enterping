export type QuizCategory = "JPOP" | "ANIME";

export interface QuizAudioSnippet {
  youtubeVideoId: string;
  startSeconds: number;
  durationSeconds: number;
}

export interface QuizItem {
  id: string;
  category: QuizCategory;
  prompt: string;
  clue: string;
  answer: string;
  acceptedAnswers: string[];
  workTitle: string;
  artistOrStudio: string;
  tags: string[];
  difficulty: number;
  audioSnippet?: QuizAudioSnippet;
  thumbnailUrl?: string;
  // 정답 공개 시 보여줄 작품 관련 이미지(포스터/캐릭터 등).
  // 비어 있으면 thumbnailUrl로 fallback 됨.
  revealImageUrl?: string;
}

export const QUIZ_ITEMS: QuizItem[] = [
  {
    id: "jpop-lemon",
    category: "JPOP",
    prompt: "곡명을 맞혀주세요",
    clue: "苦いレモンの匂い / Kenshi Yonezu",
    answer: "Lemon",
    acceptedAnswers: ["lemon", "レモン", "れもん"],
    workTitle: "Lemon",
    artistOrStudio: "Kenshi Yonezu",
    tags: ["JPOP", "Ballad", "2018"],
    difficulty: 2,
    audioSnippet: {
      youtubeVideoId: "SX_ViT4Ra7k",
      startSeconds: 60,
      durationSeconds: 5,
    },
    thumbnailUrl: "https://i.ytimg.com/vi/SX_ViT4Ra7k/hqdefault.jpg",
  },
  {
    id: "jpop-pretender",
    category: "JPOP",
    prompt: "곡명을 맞혀주세요",
    clue: "君の運命のヒトは僕じゃない",
    answer: "Pretender",
    acceptedAnswers: ["pretender", "プリテンダー", "ぷりてんだー"],
    workTitle: "Pretender",
    artistOrStudio: "Official Hige Dandism",
    tags: ["JPOP", "Band", "2019"],
    difficulty: 3,
    audioSnippet: {
      youtubeVideoId: "TQ8WlA2GXbk",
      startSeconds: 55,
      durationSeconds: 5,
    },
    thumbnailUrl: "https://i.ytimg.com/vi/TQ8WlA2GXbk/hqdefault.jpg",
  },
  {
    id: "jpop-gurenge",
    category: "JPOP",
    prompt: "곡명을 맞혀주세요",
    clue: "強くなれる理由を知った",
    answer: "Gurenge",
    acceptedAnswers: ["gurenge", "紅蓮華", "ぐれんげ"],
    workTitle: "Gurenge",
    artistOrStudio: "LiSA",
    tags: ["JPOP", "Anime Song", "LiSA"],
    difficulty: 2,
    audioSnippet: {
      youtubeVideoId: "CwkzK-F0Y00",
      startSeconds: 48,
      durationSeconds: 5,
    },
    thumbnailUrl: "https://i.ytimg.com/vi/CwkzK-F0Y00/hqdefault.jpg",
  },
  {
    id: "jpop-gunjo",
    category: "JPOP",
    prompt: "아티스트를 맞혀주세요",
    clue: "夜に駆ける",
    answer: "YOASOBI",
    acceptedAnswers: ["yoasobi", "ヨアソビ", "よあそび"],
    workTitle: "Gunjo",
    artistOrStudio: "YOASOBI",
    tags: ["JPOP", "Vocal", "2020"],
    difficulty: 3,
    audioSnippet: {
      youtubeVideoId: "Y4nEEZwckuU",
      startSeconds: 52,
      durationSeconds: 5,
    },
    thumbnailUrl: "https://i.ytimg.com/vi/Y4nEEZwckuU/hqdefault.jpg",
  },
  {
    id: "jpop-kaibutsu",
    category: "JPOP",
    prompt: "곡명을 맞혀주세요",
    clue: "素晴らしき世界に今日も乾杯",
    answer: "Kaibutsu",
    acceptedAnswers: ["kaibutsu", "怪物", "かいぶつ"],
    workTitle: "Kaibutsu",
    artistOrStudio: "YOASOBI",
    tags: ["JPOP", "Anime Song", "Beastars"],
    difficulty: 4,
    audioSnippet: {
      youtubeVideoId: "dy90tA3TT1c",
      startSeconds: 50,
      durationSeconds: 5,
    },
    thumbnailUrl: "https://i.ytimg.com/vi/dy90tA3TT1c/hqdefault.jpg",
  },
  {
    id: "anime-doraemon",
    category: "ANIME",
    prompt: "캐릭터 이름을 맞혀주세요",
    clue: "미래에서 온 로봇 고양이 / どこでもドア",
    answer: "Doraemon",
    acceptedAnswers: ["doraemon", "ドラえもん", "도라에몽"],
    workTitle: "Doraemon",
    artistOrStudio: "Fujiko F. Fujio",
    tags: ["Anime", "Character", "Classic"],
    difficulty: 1,
    audioSnippet: {
      youtubeVideoId: "p1bjnyDqI9k",
      startSeconds: 10,
      durationSeconds: 6,
    },
    thumbnailUrl: "https://i.ytimg.com/vi/p1bjnyDqI9k/hqdefault.jpg",
    revealImageUrl:
      "https://upload.wikimedia.org/wikipedia/en/9/9c/Doraemon_character.png",
  },
  {
    id: "anime-naruto",
    category: "ANIME",
    prompt: "작품명을 맞혀주세요",
    clue: "忍者 / 螺旋丸",
    answer: "NARUTO",
    acceptedAnswers: ["naruto", "ナルト", "나루토"],
    workTitle: "NARUTO",
    artistOrStudio: "Masashi Kishimoto",
    tags: ["Anime", "Shonen", "Ninja"],
    difficulty: 2,
    audioSnippet: {
      youtubeVideoId: "SRn99oN1p_c",
      startSeconds: 15,
      durationSeconds: 6,
    },
    thumbnailUrl: "https://i.ytimg.com/vi/SRn99oN1p_c/hqdefault.jpg",
    revealImageUrl:
      "https://upload.wikimedia.org/wikipedia/en/9/94/NarutoCoverTankobon1.jpg",
  },
  {
    id: "anime-kimetsu",
    category: "ANIME",
    prompt: "작품명을 맞혀주세요",
    clue: "鬼殺隊 / 呼吸 / 刀",
    answer: "Kimetsu no Yaiba",
    acceptedAnswers: ["kimetsu no yaiba", "kimetsu", "鬼滅の刃", "귀멸의 칼날"],
    workTitle: "Kimetsu no Yaiba",
    artistOrStudio: "Koyoharu Gotouge",
    tags: ["Anime", "Demon", "Sword"],
    difficulty: 2,
    audioSnippet: {
      youtubeVideoId: "ucIVYK_v5MI",
      startSeconds: 12,
      durationSeconds: 6,
    },
    thumbnailUrl: "https://i.ytimg.com/vi/ucIVYK_v5MI/hqdefault.jpg",
    revealImageUrl:
      "https://upload.wikimedia.org/wikipedia/en/0/09/Kimetsu_no_Yaiba_volume_1.jpg",
  },
  {
    id: "anime-one-piece",
    category: "ANIME",
    prompt: "작품명을 맞혀주세요",
    clue: "海賊王に俺はなる",
    answer: "ONE PIECE",
    acceptedAnswers: ["one piece", "onepiece", "ワンピース", "원피스"],
    workTitle: "ONE PIECE",
    artistOrStudio: "Eiichiro Oda",
    tags: ["Anime", "Adventure", "Pirate"],
    difficulty: 2,
    audioSnippet: {
      youtubeVideoId: "lJ-CL3RPyZ4",
      startSeconds: 18,
      durationSeconds: 6,
    },
    thumbnailUrl: "https://i.ytimg.com/vi/lJ-CL3RPyZ4/hqdefault.jpg",
    revealImageUrl:
      "https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece%2C_Volume_61_Cover_%28Japanese%29.jpg",
  },
  {
    id: "anime-spy-family",
    category: "ANIME",
    prompt: "캐릭터 이름을 맞혀주세요",
    clue: "ピーナッツが好き / わくわく",
    answer: "Anya",
    acceptedAnswers: ["anya", "アーニャ", "아냐"],
    workTitle: "SPY x FAMILY",
    artistOrStudio: "Tatsuya Endo",
    tags: ["Anime", "Character", "Comedy"],
    difficulty: 3,
    audioSnippet: {
      youtubeVideoId: "h6QImWPwJTk",
      startSeconds: 20,
      durationSeconds: 6,
    },
    thumbnailUrl: "https://i.ytimg.com/vi/h6QImWPwJTk/hqdefault.jpg",
    revealImageUrl:
      "https://upload.wikimedia.org/wikipedia/en/d/d4/Spy_%C3%97_Family%2C_volume_1.jpg",
  },
];

export function getQuizItemsByCategory(category: QuizCategory): QuizItem[] {
  return QUIZ_ITEMS.filter((item) => item.category === category);
}

export function parseQuizCategory(value: string | string[] | undefined): QuizCategory {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  return normalizedValue?.toUpperCase() === "ANIME" ? "ANIME" : "JPOP";
}
