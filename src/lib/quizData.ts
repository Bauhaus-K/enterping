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
  revealImageUrl?: string;
}

export const QUIZ_ITEMS: QuizItem[] = [
  {
    id: "jpop-lemon",
    category: "JPOP",
    prompt: "곡명을 맞혀주세요",
    clue: "苦いレモンの匂い / Kenshi Yonezu",
    answer: "Lemon",
    acceptedAnswers: ["lemon", "レモン", "레몬"],
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
    clue: "君は綺麗だ / Official Hige Dandism",
    answer: "Pretender",
    acceptedAnswers: ["pretender", "プリテンダー", "프리텐더"],
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
    id: "jpop-hitonatsu",
    category: "JPOP",
    prompt: "곡명을 맞혀주세요",
    clue: "Absolute area의 여름 감성 JPOP",
    answer: "ひと夏の君へ",
    acceptedAnswers: ["ひと夏の君へ", "ひとなつのきみへ", "hitonatsu no kimi e", "한여름의 너에게"],
    workTitle: "ひと夏の君へ",
    artistOrStudio: "Absolute area",
    tags: ["JPOP", "Band", "Absolute area"],
    difficulty: 2,
    audioSnippet: {
      youtubeVideoId: "JyvKfwp9R14",
      startSeconds: 42,
      durationSeconds: 5,
    },
    thumbnailUrl: "https://i.ytimg.com/vi/JyvKfwp9R14/hqdefault.jpg",
  },
  {
    id: "jpop-walking-with-you",
    category: "JPOP",
    prompt: "곡명을 맞혀주세요",
    clue: "Novelbright의 대표 JPOP 밴드곡",
    answer: "Walking with you",
    acceptedAnswers: ["walking with you", "walkingwithyou", "워킹 위드 유", "ウォーキングウィズユー"],
    workTitle: "Walking with you",
    artistOrStudio: "Novelbright",
    tags: ["JPOP", "Band", "Novelbright"],
    difficulty: 3,
    audioSnippet: {
      youtubeVideoId: "OxzdMNTJXmg",
      startSeconds: 73,
      durationSeconds: 5,
    },
    thumbnailUrl: "https://i.ytimg.com/vi/OxzdMNTJXmg/hqdefault.jpg",
  },
  {
    id: "jpop-kaibutsu",
    category: "JPOP",
    prompt: "곡명을 맞혀주세요",
    clue: "怪物だらけの世界で / YOASOBI",
    answer: "Kaibutsu",
    acceptedAnswers: ["kaibutsu", "怪物", "かいぶつ", "괴물"],
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
    clue: "미래에서 온 로봇 고양이",
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
    revealImageUrl: "https://upload.wikimedia.org/wikipedia/en/9/9c/Doraemon_character.png",
  },
  {
    id: "anime-naruto",
    category: "ANIME",
    prompt: "작품명을 맞혀주세요",
    clue: "忍者 / 火影 / ラーメン",
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
    revealImageUrl: "https://upload.wikimedia.org/wikipedia/en/9/94/NarutoCoverTankobon1.jpg",
  },
  {
    id: "anime-kimetsu",
    category: "ANIME",
    prompt: "작품명을 맞혀주세요",
    clue: "鬼 / 呼吸 / 刀",
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
    revealImageUrl: "https://upload.wikimedia.org/wikipedia/en/0/09/Kimetsu_no_Yaiba_volume_1.jpg",
  },
  {
    id: "anime-one-piece",
    category: "ANIME",
    prompt: "작품명을 맞혀주세요",
    clue: "海賊王になる男",
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
    revealImageUrl: "https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece%2C_Volume_61_Cover_%28Japanese%29.jpg",
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
    revealImageUrl: "https://upload.wikimedia.org/wikipedia/en/d/d4/Spy_%C3%97_Family%2C_volume_1.jpg",
  },
];

export function getQuizItemsByCategory(category: QuizCategory): QuizItem[] {
  return QUIZ_ITEMS.filter((item) => item.category === category);
}

export function parseQuizCategory(value: string | string[] | undefined): QuizCategory {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  return normalizedValue?.toUpperCase() === "ANIME" ? "ANIME" : "JPOP";
}
