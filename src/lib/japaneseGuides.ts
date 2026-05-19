import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";

export interface PronunciationGuide {
  japaneseText: string;
  hiraganaText: string;
  romajiText: string;
  koreanPronunciationText: string;
}

type KanaMap = Record<string, string>;

let kuroshiroPromise: Promise<Kuroshiro> | null = null;

const HANGUL_BASE = 0xac00;
const HANGUL_LAST = 0xd7a3;
const HANGUL_FINAL_COUNT = 28;
const HANGUL_FINAL_N = 4;
const HANGUL_FINAL_S = 19;

const HANGUL_SINGLE: KanaMap = {
  あ: "아",
  い: "이",
  う: "우",
  え: "에",
  お: "오",
  ぁ: "아",
  ぃ: "이",
  ぅ: "우",
  ぇ: "에",
  ぉ: "오",
  か: "카",
  き: "키",
  く: "쿠",
  け: "케",
  こ: "코",
  が: "가",
  ぎ: "기",
  ぐ: "구",
  げ: "게",
  ご: "고",
  さ: "사",
  し: "시",
  す: "스",
  せ: "세",
  そ: "소",
  ざ: "자",
  じ: "지",
  ず: "즈",
  ぜ: "제",
  ぞ: "조",
  た: "타",
  ち: "치",
  つ: "츠",
  て: "테",
  と: "토",
  だ: "다",
  ぢ: "지",
  づ: "즈",
  で: "데",
  ど: "도",
  な: "나",
  に: "니",
  ぬ: "누",
  ね: "네",
  の: "노",
  は: "하",
  ひ: "히",
  ふ: "후",
  へ: "헤",
  ほ: "호",
  ば: "바",
  び: "비",
  ぶ: "부",
  べ: "베",
  ぼ: "보",
  ぱ: "파",
  ぴ: "피",
  ぷ: "푸",
  ぺ: "페",
  ぽ: "포",
  ま: "마",
  み: "미",
  む: "무",
  め: "메",
  も: "모",
  や: "야",
  ゆ: "유",
  よ: "요",
  ゃ: "야",
  ゅ: "유",
  ょ: "요",
  ら: "라",
  り: "리",
  る: "루",
  れ: "레",
  ろ: "로",
  わ: "와",
  ゐ: "위",
  ゑ: "웨",
  を: "오",
  ゔ: "브",
};

const HANGUL_DIGRAPHS: KanaMap = {
  きゃ: "캬",
  きゅ: "큐",
  きょ: "쿄",
  ぎゃ: "갸",
  ぎゅ: "규",
  ぎょ: "교",
  しゃ: "샤",
  しゅ: "슈",
  しょ: "쇼",
  じゃ: "자",
  じゅ: "주",
  じょ: "조",
  ちゃ: "차",
  ちゅ: "추",
  ちょ: "초",
  ぢゃ: "자",
  ぢゅ: "주",
  ぢょ: "조",
  にゃ: "냐",
  にゅ: "뉴",
  にょ: "뇨",
  ひゃ: "햐",
  ひゅ: "휴",
  ひょ: "효",
  びゃ: "뱌",
  びゅ: "뷰",
  びょ: "뵤",
  ぴゃ: "퍄",
  ぴゅ: "퓨",
  ぴょ: "표",
  みゃ: "먀",
  みゅ: "뮤",
  みょ: "묘",
  りゃ: "랴",
  りゅ: "류",
  りょ: "료",
  てぃ: "티",
  でぃ: "디",
  とぅ: "투",
  どぅ: "두",
  ふぁ: "파",
  ふぃ: "피",
  ふぇ: "페",
  ふぉ: "포",
  うぃ: "위",
  うぇ: "웨",
  うぉ: "워",
  ゔぁ: "바",
  ゔぃ: "비",
  ゔぇ: "베",
  ゔぉ: "보",
};

export async function generatePronunciationGuides(lines: string[]): Promise<PronunciationGuide[]> {
  const kuroshiro = await getKuroshiro();

  return Promise.all(
    lines.map(async (line) => {
      const japaneseText = line.trim();
      const hiraganaText = await kuroshiro.convert(japaneseText, {
        to: "hiragana",
        mode: "normal",
      });
      const romajiText = normalizeRomaji(
        await kuroshiro.convert(japaneseText, {
          to: "romaji",
          mode: "normal",
          romajiSystem: "hepburn",
        }),
      );

      return {
        japaneseText,
        hiraganaText,
        romajiText,
        koreanPronunciationText: hiraganaToHangulPronunciation(hiraganaText),
      };
    }),
  );
}

export function hiraganaToHangulPronunciation(input: string): string {
  const hiragana = katakanaToHiragana(input.normalize("NFKC"));
  const chars = Array.from(hiragana);
  let output = "";

  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];

    if (char === "っ") {
      output = addHangulFinal(output, HANGUL_FINAL_S, "ㅅ");
      continue;
    }

    if (char === "ん") {
      output = addHangulFinal(output, HANGUL_FINAL_N, "ㄴ");
      continue;
    }

    if (char === "ー") {
      continue;
    }

    const twoCharToken = `${char}${chars[index + 1] ?? ""}`;
    if (HANGUL_DIGRAPHS[twoCharToken]) {
      output += HANGUL_DIGRAPHS[twoCharToken];
      index += 1;
      continue;
    }

    output += HANGUL_SINGLE[char] ?? char;
  }

  return output;
}

function getKuroshiro(): Promise<Kuroshiro> {
  if (!kuroshiroPromise) {
    kuroshiroPromise = (async () => {
      const kuroshiro = new Kuroshiro();
      await kuroshiro.init(new KuromojiAnalyzer());
      return kuroshiro;
    })();
  }

  return kuroshiroPromise;
}

function normalizeRomaji(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function katakanaToHiragana(value: string): string {
  return Array.from(value)
    .map((char) => {
      const code = char.charCodeAt(0);
      return code >= 0x30a1 && code <= 0x30f6 ? String.fromCharCode(code - 0x60) : char;
    })
    .join("");
}

function addHangulFinal(value: string, finalIndex: number, fallbackJamo: string): string {
  if (!value) {
    return fallbackJamo;
  }

  const chars = Array.from(value);
  const lastChar = chars[chars.length - 1];
  const lastCharCode = lastChar.charCodeAt(0);

  if (lastCharCode < HANGUL_BASE || lastCharCode > HANGUL_LAST) {
    return `${value}${fallbackJamo}`;
  }

  const syllableIndex = lastCharCode - HANGUL_BASE;
  const currentFinalIndex = syllableIndex % HANGUL_FINAL_COUNT;

  if (currentFinalIndex !== 0) {
    return `${value}${fallbackJamo}`;
  }

  chars[chars.length - 1] = String.fromCharCode(lastCharCode + finalIndex);
  return chars.join("");
}
