export enum TypingInputMode {
  Romaji = "ROMAJI",
  Hangul = "KOREAN_PRONUNCIATION",
}

export enum InputValidationState {
  Correct = "Correct",
  Incorrect = "Incorrect",
  Incomplete = "Incomplete",
}

export type ValidateInputMode =
  | TypingInputMode
  | "romaji"
  | "hangul"
  | "korean"
  | "korean_pronunciation";

export interface ValidateInputOptions {
  mode?: ValidateInputMode;
}

export interface ValidateInputResult {
  state: InputValidationState;
  mode: TypingInputMode;
  normalizedInput: string;
  expectedInputs: string[];
  matchedInput?: string;
  progress: number;
}

type TokenMap = Record<string, string[]>;

const MAX_CANDIDATES = 2048;
const HANGUL_BASE = 0xac00;
const HANGUL_LAST = 0xd7a3;
const HANGUL_VOWEL_COUNT = 21;
const HANGUL_FINAL_COUNT = 28;
const HANGUL_FINAL_N = 4;
const HANGUL_FINAL_S = 19;

const ROMAJI_SINGLE: TokenMap = {
  あ: ["a"],
  い: ["i"],
  う: ["u"],
  え: ["e"],
  お: ["o"],
  ぁ: ["xa", "la", "a"],
  ぃ: ["xi", "li", "i"],
  ぅ: ["xu", "lu", "u"],
  ぇ: ["xe", "le", "e"],
  ぉ: ["xo", "lo", "o"],

  か: ["ka"],
  き: ["ki"],
  く: ["ku"],
  け: ["ke"],
  こ: ["ko"],
  が: ["ga"],
  ぎ: ["gi"],
  ぐ: ["gu"],
  げ: ["ge"],
  ご: ["go"],

  さ: ["sa"],
  し: ["shi", "si"],
  す: ["su"],
  せ: ["se"],
  そ: ["so"],
  ざ: ["za"],
  じ: ["ji", "zi"],
  ず: ["zu"],
  ぜ: ["ze"],
  ぞ: ["zo"],

  た: ["ta"],
  ち: ["chi", "ti"],
  つ: ["tsu", "tu"],
  て: ["te"],
  と: ["to"],
  だ: ["da"],
  ぢ: ["ji", "di"],
  づ: ["zu", "du"],
  で: ["de"],
  ど: ["do"],

  な: ["na"],
  に: ["ni"],
  ぬ: ["nu"],
  ね: ["ne"],
  の: ["no"],

  は: ["ha"],
  ひ: ["hi"],
  ふ: ["fu", "hu"],
  へ: ["he"],
  ほ: ["ho"],
  ば: ["ba"],
  び: ["bi"],
  ぶ: ["bu"],
  べ: ["be"],
  ぼ: ["bo"],
  ぱ: ["pa"],
  ぴ: ["pi"],
  ぷ: ["pu"],
  ぺ: ["pe"],
  ぽ: ["po"],

  ま: ["ma"],
  み: ["mi"],
  む: ["mu"],
  め: ["me"],
  も: ["mo"],

  や: ["ya"],
  ゆ: ["yu"],
  よ: ["yo"],
  ゃ: ["xya", "lya", "ya"],
  ゅ: ["xyu", "lyu", "yu"],
  ょ: ["xyo", "lyo", "yo"],

  ら: ["ra"],
  り: ["ri"],
  る: ["ru"],
  れ: ["re"],
  ろ: ["ro"],

  わ: ["wa"],
  ゐ: ["wi"],
  ゑ: ["we"],
  を: ["wo", "o"],
  ん: ["n", "nn", "n'"],

  ゔ: ["vu"],
  ゕ: ["xka", "lka", "ka"],
  ゖ: ["xke", "lke", "ke"],

  " ": [" "],
  "　": [" "],
  "、": [","],
  "。": ["."],
  "・": ["."],
  "！": ["!"],
  "？": ["?"],
  "「": ['"'],
  "」": ['"'],
};

const ROMAJI_DIGRAPHS: TokenMap = {
  きゃ: ["kya"],
  きゅ: ["kyu"],
  きょ: ["kyo"],
  ぎゃ: ["gya"],
  ぎゅ: ["gyu"],
  ぎょ: ["gyo"],

  しゃ: ["sha", "sya"],
  しゅ: ["shu", "syu"],
  しょ: ["sho", "syo"],
  じゃ: ["ja", "jya", "zya"],
  じゅ: ["ju", "jyu", "zyu"],
  じょ: ["jo", "jyo", "zyo"],

  ちゃ: ["cha", "tya", "cya"],
  ちゅ: ["chu", "tyu", "cyu"],
  ちょ: ["cho", "tyo", "cyo"],
  ぢゃ: ["ja", "dya"],
  ぢゅ: ["ju", "dyu"],
  ぢょ: ["jo", "dyo"],

  にゃ: ["nya"],
  にゅ: ["nyu"],
  にょ: ["nyo"],
  ひゃ: ["hya"],
  ひゅ: ["hyu"],
  ひょ: ["hyo"],
  びゃ: ["bya"],
  びゅ: ["byu"],
  びょ: ["byo"],
  ぴゃ: ["pya"],
  ぴゅ: ["pyu"],
  ぴょ: ["pyo"],
  みゃ: ["mya"],
  みゅ: ["myu"],
  みょ: ["myo"],
  りゃ: ["rya"],
  りゅ: ["ryu"],
  りょ: ["ryo"],

  てぃ: ["ti", "thi"],
  でぃ: ["di", "dhi"],
  とぅ: ["tu", "twu"],
  どぅ: ["du", "dwu"],
  ふぁ: ["fa"],
  ふぃ: ["fi"],
  ふぇ: ["fe"],
  ふぉ: ["fo"],
  うぃ: ["wi"],
  うぇ: ["we"],
  うぉ: ["wo"],
  ゔぁ: ["va"],
  ゔぃ: ["vi"],
  ゔぇ: ["ve"],
  ゔぉ: ["vo"],
};

const HANGUL_SINGLE: TokenMap = {
  あ: ["아"],
  い: ["이"],
  う: ["우"],
  え: ["에"],
  お: ["오"],
  ぁ: ["아"],
  ぃ: ["이"],
  ぅ: ["우"],
  ぇ: ["에"],
  ぉ: ["오"],

  か: ["카"],
  き: ["키"],
  く: ["쿠"],
  け: ["케"],
  こ: ["코"],
  が: ["가"],
  ぎ: ["기"],
  ぐ: ["구"],
  げ: ["게"],
  ご: ["고"],

  さ: ["사"],
  し: ["시"],
  す: ["스"],
  せ: ["세"],
  そ: ["소"],
  ざ: ["자"],
  じ: ["지"],
  ず: ["즈"],
  ぜ: ["제"],
  ぞ: ["조"],

  た: ["타"],
  ち: ["치"],
  つ: ["츠"],
  て: ["테"],
  と: ["토"],
  だ: ["다"],
  ぢ: ["지"],
  づ: ["즈"],
  で: ["데"],
  ど: ["도"],

  な: ["나"],
  に: ["니"],
  ぬ: ["누"],
  ね: ["네"],
  の: ["노"],

  は: ["하"],
  ひ: ["히"],
  ふ: ["후"],
  へ: ["헤"],
  ほ: ["호"],
  ば: ["바"],
  び: ["비"],
  ぶ: ["부"],
  べ: ["베"],
  ぼ: ["보"],
  ぱ: ["파"],
  ぴ: ["피"],
  ぷ: ["푸"],
  ぺ: ["페"],
  ぽ: ["포"],

  ま: ["마"],
  み: ["미"],
  む: ["무"],
  め: ["메"],
  も: ["모"],

  や: ["야"],
  ゆ: ["유"],
  よ: ["요"],
  ゃ: ["야"],
  ゅ: ["유"],
  ょ: ["요"],

  ら: ["라"],
  り: ["리"],
  る: ["루"],
  れ: ["레"],
  ろ: ["로"],

  わ: ["와"],
  ゐ: ["위"],
  ゑ: ["웨"],
  を: ["오", "워"],
  ゔ: ["부", "브"],

  " ": [" "],
  "　": [" "],
  "、": [","],
  "。": ["."],
  "・": ["."],
  "！": ["!"],
  "？": ["?"],
  "「": ['"'],
  "」": ['"'],
};

const HANGUL_DIGRAPHS: TokenMap = {
  きゃ: ["캬"],
  きゅ: ["큐"],
  きょ: ["쿄"],
  ぎゃ: ["갸"],
  ぎゅ: ["규"],
  ぎょ: ["교"],

  しゃ: ["샤"],
  しゅ: ["슈"],
  しょ: ["쇼"],
  じゃ: ["자", "쟈"],
  じゅ: ["주", "쥬"],
  じょ: ["조", "죠"],

  ちゃ: ["차", "챠"],
  ちゅ: ["추", "츄"],
  ちょ: ["초", "쵸"],
  ぢゃ: ["자", "쟈"],
  ぢゅ: ["주", "쥬"],
  ぢょ: ["조", "죠"],

  にゃ: ["냐"],
  にゅ: ["뉴"],
  にょ: ["뇨"],
  ひゃ: ["햐"],
  ひゅ: ["휴"],
  ひょ: ["효"],
  びゃ: ["뱌"],
  びゅ: ["뷰"],
  びょ: ["뵤"],
  ぴゃ: ["퍄"],
  ぴゅ: ["퓨"],
  ぴょ: ["표"],
  みゃ: ["먀"],
  みゅ: ["뮤"],
  みょ: ["묘"],
  りゃ: ["랴"],
  りゅ: ["류"],
  りょ: ["료"],

  てぃ: ["티"],
  でぃ: ["디"],
  とぅ: ["투"],
  どぅ: ["두"],
  ふぁ: ["파", "화"],
  ふぃ: ["피", "휘"],
  ふぇ: ["페", "훼"],
  ふぉ: ["포", "훠"],
  うぃ: ["위"],
  うぇ: ["웨"],
  うぉ: ["워"],
  ゔぁ: ["바"],
  ゔぃ: ["비"],
  ゔぇ: ["베"],
  ゔぉ: ["보"],
};

const HANGUL_VOWEL_SYLLABLES = [
  "아",
  "애",
  "야",
  "얘",
  "어",
  "에",
  "여",
  "예",
  "오",
  "와",
  "왜",
  "외",
  "요",
  "우",
  "워",
  "웨",
  "위",
  "유",
  "으",
  "의",
  "이",
];

export function validateInput(
  targetText: string,
  currentInput: string,
  options: ValidateInputOptions = {},
): ValidateInputResult {
  const mode = resolveMode(options.mode);
  const normalizedInput =
    mode === TypingInputMode.Romaji
      ? normalizeRomajiInput(currentInput)
      : normalizeHangulInput(currentInput);
  const expectedInputs = getAcceptedInputs(targetText, mode);
  const matchedInput = expectedInputs.find((candidate) => candidate === normalizedInput);

  if (matchedInput) {
    return logValidationResult(
      {
        state: InputValidationState.Correct,
        mode,
        normalizedInput,
        expectedInputs,
        matchedInput,
        progress: 1,
      },
      targetText,
    );
  }

  const prefixMatch = expectedInputs.find((candidate) => candidate.startsWith(normalizedInput));

  if (prefixMatch) {
    return logValidationResult(
      {
        state: InputValidationState.Incomplete,
        mode,
        normalizedInput,
        expectedInputs,
        matchedInput: prefixMatch,
        progress: calculateProgress(normalizedInput, prefixMatch),
      },
      targetText,
    );
  }

  return logValidationResult(
    {
      state: InputValidationState.Incorrect,
      mode,
      normalizedInput,
      expectedInputs,
      progress: 0,
    },
    targetText,
  );
}

function logValidationResult(result: ValidateInputResult, targetText: string): ValidateInputResult {
  if (typeof window !== "undefined") {
    console.log("[Enterping][TypingEngine] validateInput", {
      targetText,
      mode: result.mode,
      input: result.normalizedInput,
      state: result.state,
      progress: result.progress,
      matchedInput: result.matchedInput,
    });
  }

  return result;
}

export function getAcceptedInputs(
  targetText: string,
  mode: TypingInputMode = TypingInputMode.Romaji,
): string[] {
  const normalizedTarget = normalizeTargetText(targetText);

  if (normalizedTarget.length === 0) {
    return [""];
  }

  return mode === TypingInputMode.Romaji
    ? buildRomajiCandidates(normalizedTarget)
    : buildHangulCandidates(normalizedTarget);
}

function buildRomajiCandidates(targetText: string): string[] {
  const chars = Array.from(targetText);
  let candidates = [""];

  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];

    if (char === "っ") {
      const prefixes = getSokuonRomajiPrefixes(chars, index + 1);
      candidates = combineCandidates(candidates, prefixes.length > 0 ? prefixes : ["xtsu", "ltsu"]);
      continue;
    }

    if (char === "ー") {
      candidates = appendRomajiLongVowel(candidates);
      continue;
    }

    const token = getTokenAt(chars, index, ROMAJI_DIGRAPHS, ROMAJI_SINGLE);
    candidates = combineCandidates(candidates, token.variants);
    index += token.length - 1;
  }

  return normalizeCandidateList(candidates);
}

function buildHangulCandidates(targetText: string): string[] {
  const chars = Array.from(targetText);
  let candidates = [""];

  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];

    if (char === "っ") {
      candidates = candidates.map((candidate) => addHangulFinal(candidate, HANGUL_FINAL_S, "ㅅ"));
      continue;
    }

    if (char === "ん") {
      candidates = applyHangulNasal(candidates);
      continue;
    }

    if (char === "ー") {
      candidates = appendHangulLongVowel(candidates);
      continue;
    }

    const token = getTokenAt(chars, index, HANGUL_DIGRAPHS, HANGUL_SINGLE);
    candidates = combineCandidates(candidates, token.variants);
    index += token.length - 1;
  }

  return normalizeCandidateList(candidates);
}

function resolveMode(mode: ValidateInputMode | undefined): TypingInputMode {
  if (!mode) {
    return TypingInputMode.Romaji;
  }

  const normalizedMode = mode.toString().toLowerCase();

  if (normalizedMode === "hangul" || normalizedMode === "korean" || normalizedMode === "korean_pronunciation") {
    return TypingInputMode.Hangul;
  }

  return TypingInputMode.Romaji;
}

function normalizeTargetText(targetText: string): string {
  return katakanaToHiragana(targetText.normalize("NFKC")).replace(/\s+/g, " ").trim();
}

function normalizeRomajiInput(input: string): string {
  return input.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizeHangulInput(input: string): string {
  return input.normalize("NFC").replace(/\s+/g, " ").trim();
}

function katakanaToHiragana(value: string): string {
  return Array.from(value)
    .map((char) => {
      const code = char.charCodeAt(0);
      return code >= 0x30a1 && code <= 0x30f6 ? String.fromCharCode(code - 0x60) : char;
    })
    .join("");
}

function getTokenAt(
  chars: string[],
  index: number,
  digraphs: TokenMap,
  singles: TokenMap,
): { variants: string[]; length: number } {
  const twoCharToken = `${chars[index] ?? ""}${chars[index + 1] ?? ""}`;

  if (digraphs[twoCharToken]) {
    return { variants: digraphs[twoCharToken], length: 2 };
  }

  const char = chars[index];
  return { variants: singles[char] ?? [char], length: 1 };
}

function combineCandidates(current: string[], additions: string[]): string[] {
  const combined: string[] = [];

  for (const prefix of current) {
    for (const addition of additions) {
      combined.push(`${prefix}${addition}`);
    }
  }

  return normalizeCandidateList(combined);
}

function normalizeCandidateList(candidates: string[]): string[] {
  return [...new Set(candidates)].slice(0, MAX_CANDIDATES);
}

function getSokuonRomajiPrefixes(chars: string[], nextIndex: number): string[] {
  if (nextIndex >= chars.length) {
    return [];
  }

  const token = getTokenAt(chars, nextIndex, ROMAJI_DIGRAPHS, ROMAJI_SINGLE);
  const prefixes = token.variants.flatMap((variant) => {
    if (!variant || /^[aeiou]/.test(variant)) {
      return [];
    }

    if (variant.startsWith("ch")) {
      return ["t", "c"];
    }

    if (variant.startsWith("sh")) {
      return ["s"];
    }

    if (variant.startsWith("ts")) {
      return ["t"];
    }

    const firstLetter = variant[0];
    return /[bcdfghjklmnpqrstvwxyz]/.test(firstLetter) ? [firstLetter] : [];
  });

  return [...new Set(prefixes)];
}

function appendRomajiLongVowel(candidates: string[]): string[] {
  return normalizeCandidateList(
    candidates.flatMap((candidate) => {
      const vowel = findLastRomajiVowel(candidate);
      return vowel ? [`${candidate}${vowel}`, `${candidate}-`] : [`${candidate}-`];
    }),
  );
}

function findLastRomajiVowel(value: string): string | undefined {
  for (let index = value.length - 1; index >= 0; index -= 1) {
    const char = value[index];
    if (/[aeiou]/.test(char)) {
      return char;
    }
  }

  return undefined;
}

function applyHangulNasal(candidates: string[]): string[] {
  return normalizeCandidateList(
    candidates.flatMap((candidate) => [addHangulFinal(candidate, HANGUL_FINAL_N, "ㄴ"), `${candidate}응`]),
  );
}

function appendHangulLongVowel(candidates: string[]): string[] {
  return normalizeCandidateList(
    candidates.flatMap((candidate) => {
      const vowel = getLastHangulVowelSyllable(candidate);
      return vowel ? [candidate, `${candidate}${vowel}`] : [candidate];
    }),
  );
}

function addHangulFinal(value: string, finalIndex: number, fallbackJamo: string): string {
  if (value.length === 0) {
    return value;
  }

  const chars = Array.from(value);
  const lastChar = chars[chars.length - 1];
  const lastCharCode = lastChar.charCodeAt(0);

  if (!isHangulSyllable(lastCharCode)) {
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

function getLastHangulVowelSyllable(value: string): string | undefined {
  const chars = Array.from(value);

  for (let index = chars.length - 1; index >= 0; index -= 1) {
    const code = chars[index].charCodeAt(0);

    if (!isHangulSyllable(code)) {
      continue;
    }

    const syllableIndex = code - HANGUL_BASE;
    const vowelIndex = Math.floor(syllableIndex / HANGUL_FINAL_COUNT) % HANGUL_VOWEL_COUNT;
    return HANGUL_VOWEL_SYLLABLES[vowelIndex];
  }

  return undefined;
}

function isHangulSyllable(code: number): boolean {
  return code >= HANGUL_BASE && code <= HANGUL_LAST;
}

function calculateProgress(input: string, expected: string): number {
  if (expected.length === 0) {
    return input.length === 0 ? 1 : 0;
  }

  return Math.min(input.length / expected.length, 1);
}
