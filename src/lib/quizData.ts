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

const JPOP_PROMPT = "곡명을 맞혀주세요";

export const QUIZ_ITEMS: QuizItem[] = [
  {
    id: "jpop-lemon",
    category: "JPOP",
    prompt: JPOP_PROMPT,
    clue: "Kenshi Yonezu의 대표 발라드. 드라마 언내추럴 주제가로도 유명합니다.",
    answer: "Lemon",
    acceptedAnswers: ["lemon", "레몬", "れもん"],
    workTitle: "Lemon",
    artistOrStudio: "Kenshi Yonezu",
    tags: ["JPOP", "Ballad", "Kenshi Yonezu"],
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
    prompt: JPOP_PROMPT,
    clue: "Official Hige Dandism의 히트곡. 이별 감성의 밴드 사운드가 인상적입니다.",
    answer: "Pretender",
    acceptedAnswers: ["pretender", "프리텐더", "ぷりてんだー"],
    workTitle: "Pretender",
    artistOrStudio: "Official Hige Dandism",
    tags: ["JPOP", "Band", "Official Hige Dandism"],
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
    prompt: JPOP_PROMPT,
    clue: "Absolute area의 여름 감성 JPOP. 제목에 'ひと夏'가 들어갑니다.",
    answer: "ひと夏の君へ",
    acceptedAnswers: ["ひと夏の君へ", "hitonatsu no kimi e", "한여름의 너에게"],
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
    prompt: JPOP_PROMPT,
    clue: "Novelbright의 대표적인 감성 밴드곡. 영어 제목입니다.",
    answer: "Walking with you",
    acceptedAnswers: ["walking with you", "walkingwithyou", "워킹 위드 유"],
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
    id: "jpop-sakura-mitai-na-koi-nanda",
    category: "JPOP",
    prompt: JPOP_PROMPT,
    clue: "miwa의 봄 감성 곡. 제목에 '桜'와 '恋'이 들어갑니다.",
    answer: "桜みたいな恋なんだ",
    acceptedAnswers: ["桜みたいな恋なんだ", "sakura mitai na koi nanda", "사쿠라 미타이나 코이난다"],
    workTitle: "桜みたいな恋なんだ",
    artistOrStudio: "miwa",
    tags: ["JPOP", "miwa", "Spring"],
    difficulty: 3,
    audioSnippet: {
      youtubeVideoId: "L2XFosxgzuU",
      startSeconds: 26,
      durationSeconds: 5,
    },
    thumbnailUrl: "https://i.ytimg.com/vi/L2XFosxgzuU/hqdefault.jpg",
  },
  {
    id: "jpop-kaze-to-machi",
    category: "JPOP",
    prompt: JPOP_PROMPT,
    clue: "Mrs. GREEN APPLE의 곡. 제목은 자연과 도시를 떠올리게 하는 두 단어입니다.",
    answer: "風と町",
    acceptedAnswers: ["風と町", "kaze to machi", "카제토마치", "바람과 거리"],
    workTitle: "風と町",
    artistOrStudio: "Mrs. GREEN APPLE",
    tags: ["JPOP", "Mrs. GREEN APPLE", "Band"],
    difficulty: 4,
    audioSnippet: {
      youtubeVideoId: "9NJI7cLZ2Qg",
      startSeconds: 26,
      durationSeconds: 5,
    },
    thumbnailUrl: "https://i.ytimg.com/vi/9NJI7cLZ2Qg/hqdefault.jpg",
  },
  {
    id: "jpop-iris-out",
    category: "JPOP",
    prompt: JPOP_PROMPT,
    clue: "Kenshi Yonezu의 강렬한 신곡. 제목은 영어 두 단어입니다.",
    answer: "IRIS OUT",
    acceptedAnswers: ["iris out", "irisout", "아이리스 아웃"],
    workTitle: "IRIS OUT",
    artistOrStudio: "Kenshi Yonezu",
    tags: ["JPOP", "Kenshi Yonezu", "MV"],
    difficulty: 4,
    audioSnippet: {
      youtubeVideoId: "LmZD-TU96q4",
      startSeconds: 18,
      durationSeconds: 5,
    },
    thumbnailUrl: "https://i.ytimg.com/vi/LmZD-TU96q4/hqdefault.jpg",
  },
  {
    id: "jpop-blue-jeans",
    category: "JPOP",
    prompt: JPOP_PROMPT,
    clue: "HANA의 곡. 제목은 패션 아이템을 뜻하는 영어 표현입니다.",
    answer: "Blue Jeans",
    acceptedAnswers: ["blue jeans", "bluejeans", "블루진", "블루 진"],
    workTitle: "Blue Jeans",
    artistOrStudio: "HANA",
    tags: ["JPOP", "HANA", "Dance Pop"],
    difficulty: 3,
    audioSnippet: {
      youtubeVideoId: "r_AOa3yVz8A",
      startSeconds: 26,
      durationSeconds: 5,
    },
    thumbnailUrl: "https://i.ytimg.com/vi/r_AOa3yVz8A/hqdefault.jpg",
  },
  {
    id: "jpop-kaibutsu",
    category: "JPOP",
    prompt: JPOP_PROMPT,
    clue: "YOASOBI의 애니메이션 타이업 곡. 제목은 '괴물'이라는 뜻입니다.",
    answer: "Kaibutsu",
    acceptedAnswers: ["kaibutsu", "怪物", "かいぶつ", "괴물"],
    workTitle: "Kaibutsu",
    artistOrStudio: "YOASOBI",
    tags: ["JPOP", "Anime Song", "YOASOBI"],
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
    clue: "미래에서 온 파란 로봇 고양이입니다.",
    answer: "Doraemon",
    acceptedAnswers: ["doraemon", "ドラえもん", "도라에몽"],
    workTitle: "Doraemon",
    artistOrStudio: "Fujiko F. Fujio",
    tags: ["Anime", "Character", "Classic"],
    difficulty: 1,
    audioSnippet: {
      youtubeVideoId: "PNCl4zwRtt8",
      startSeconds: 10,
      durationSeconds: 6,
    },
    thumbnailUrl: "https://i.ytimg.com/vi/PNCl4zwRtt8/hqdefault.jpg",
    revealImageUrl: "https://upload.wikimedia.org/wikipedia/en/9/9c/Doraemon_character.png",
  },
  {
    id: "anime-naruto",
    category: "ANIME",
    prompt: "작품명을 맞혀주세요",
    clue: "닌자, 호카게, 나선환이 떠오르는 소년 만화입니다.",
    answer: "NARUTO",
    acceptedAnswers: ["naruto", "ナルト", "나루토"],
    workTitle: "NARUTO",
    artistOrStudio: "Masashi Kishimoto",
    tags: ["Anime", "Shonen", "Ninja"],
    difficulty: 2,
    audioSnippet: {
      youtubeVideoId: "hIwGBOexa5w",
      startSeconds: 15,
      durationSeconds: 6,
    },
    thumbnailUrl: "https://i.ytimg.com/vi/hIwGBOexa5w/hqdefault.jpg",
    revealImageUrl: "https://upload.wikimedia.org/wikipedia/en/9/94/NarutoCoverTankobon1.jpg",
  },
  {
    id: "anime-kimetsu",
    category: "ANIME",
    prompt: "작품명을 맞혀주세요",
    clue: "귀살대와 혈귀가 등장하는 검술 액션 애니메이션입니다.",
    answer: "Kimetsu no Yaiba",
    acceptedAnswers: ["kimetsu no yaiba", "kimetsu", "鬼滅の刃", "귀멸의 칼날"],
    workTitle: "Kimetsu no Yaiba",
    artistOrStudio: "Koyoharu Gotouge",
    tags: ["Anime", "Demon", "Sword"],
    difficulty: 2,
    audioSnippet: {
      youtubeVideoId: "TkN0MKzriTY",
      startSeconds: 12,
      durationSeconds: 6,
    },
    thumbnailUrl: "https://i.ytimg.com/vi/TkN0MKzriTY/hqdefault.jpg",
    revealImageUrl: "https://upload.wikimedia.org/wikipedia/en/0/09/Kimetsu_no_Yaiba_volume_1.jpg",
  },
  {
    id: "anime-one-piece",
    category: "ANIME",
    prompt: "작품명을 맞혀주세요",
    clue: "해적왕을 꿈꾸는 루피와 밀짚모자 일당의 모험입니다.",
    answer: "ONE PIECE",
    acceptedAnswers: ["one piece", "onepiece", "ワンピース", "원피스"],
    workTitle: "ONE PIECE",
    artistOrStudio: "Eiichiro Oda",
    tags: ["Anime", "Adventure", "Pirate"],
    difficulty: 2,
    audioSnippet: {
      youtubeVideoId: "YoeP9w5UIlg",
      startSeconds: 18,
      durationSeconds: 6,
    },
    thumbnailUrl: "https://i.ytimg.com/vi/YoeP9w5UIlg/hqdefault.jpg",
    revealImageUrl: "https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece%2C_Volume_61_Cover_%28Japanese%29.jpg",
  },
  {
    id: "anime-spy-family",
    category: "ANIME",
    prompt: "캐릭터 이름을 맞혀주세요",
    clue: "SPY x FAMILY의 분홍 머리 초능력자 소녀입니다.",
    answer: "Anya",
    acceptedAnswers: ["anya", "アーニャ", "아냐"],
    workTitle: "SPY x FAMILY",
    artistOrStudio: "Tatsuya Endo",
    tags: ["Anime", "Character", "Comedy"],
    difficulty: 3,
    audioSnippet: {
      youtubeVideoId: "U_rWZK_8vUY",
      startSeconds: 20,
      durationSeconds: 6,
    },
    thumbnailUrl: "https://i.ytimg.com/vi/U_rWZK_8vUY/hqdefault.jpg",
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
