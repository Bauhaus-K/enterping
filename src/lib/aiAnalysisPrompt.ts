export interface TypingAnalysisTypoLog {
  id: string;
  targetCharacter: string;
  inputtedCharacter: string;
  contextualPreviousWord?: string | null;
  contextualNextWord?: string | null;
  targetTextPosition?: number | null;
  videoTimestampMs?: number | null;
  sessionTimestampMs?: number | null;
  createdAt: string | Date;
  lyricSync?: {
    japaneseText?: string | null;
    romajiText?: string | null;
    koreanPronunciationText?: string | null;
    lineIndex?: number | null;
    content?: {
      title?: string | null;
      artist?: string | null;
    } | null;
  } | null;
}

export interface BuildTypingAnalysisPromptInput {
  userId: string;
  username?: string | null;
  typoLogs: TypingAnalysisTypoLog[];
}

export interface TypoPatternSummary {
  label: string;
  count: number;
  explanation: string;
  examples: Array<{
    targetCharacter: string;
    inputtedCharacter: string;
    previousContext?: string | null;
    lyricLine?: string | null;
    romaji?: string | null;
  }>;
}

export type PronunciationPatternId =
  | "sokuon"
  | "shi-chi-tsu"
  | "long-vowel"
  | "youon"
  | "kana-romaji";

export interface PronunciationTrainingRecommendation {
  patternId: PronunciationPatternId;
  label: string;
  count: number;
  severity: "low" | "medium" | "high";
  focusKana: string[];
  reason: string;
  drill: string;
  samplePrompts: string[];
}

export interface AiErrorFeedback {
  weakness: string;
  tip: string;
  encouragement: string;
  trainingRecommendations?: PronunciationTrainingRecommendation[];
}

const PATTERN_DEFINITIONS: Record<
  PronunciationPatternId,
  {
    label: string;
    explanation: string;
    focusKana: string[];
    reason: string;
    drill: string;
    samplePrompts: string[];
  }
> = {
  sokuon: {
    label: "촉음(っ) 입력 타이밍",
    explanation: "작은 っ은 다음 자음을 한 번 더 누르는 리듬이 필요합니다.",
    focusKana: ["っ"],
    reason: "촉음이 있는 단어에서 doubled consonant를 빠뜨리거나 한 박자 늦게 입력하는 경향이 보입니다.",
    drill: "metronome을 70BPM 정도로 켜고 ma-t-te, ki-t-te, zu-t-to처럼 자음이 두 번 닿는 박자를 소리 내며 입력하세요.",
    samplePrompts: ["まって / matte", "きっと / kitto", "ずっと / zutto"],
  },
  "shi-chi-tsu": {
    label: "し/ち/つ 계열 구분",
    explanation: "shi, chi, tsu는 si/ti/tu와 섞이기 쉬운 로마자 입력 패턴입니다.",
    focusKana: ["し", "ち", "つ"],
    reason: "s, t, c, h, u 주변 입력에서 혼동이 반복되어 し/ち/つ 계열을 따로 분리해 연습할 필요가 있습니다.",
    drill: "shi-chi-tsu를 한 세트로 묶어 천천히 입력한 뒤, sh/ch/ts 덩어리를 한 글자처럼 보는 습관을 만드세요.",
    samplePrompts: ["しる / shiru", "ちかい / chikai", "つよく / tsuyoku"],
  },
  "long-vowel": {
    label: "장음/긴 모음 유지",
    explanation: "장음은 모음을 유지하거나 ー, ou, ei 같은 긴 소리 표기를 놓치지 않는 것이 핵심입니다.",
    focusKana: ["ー", "おう", "えい"],
    reason: "모음 입력이 짧게 끊기거나 장음 표기 주변에서 오타가 발생하고 있습니다.",
    drill: "소리를 길게 읽은 뒤 romaji도 길게 입력하세요. 예: kou, sou, ei, aa를 별도 덩어리로 확인합니다.",
    samplePrompts: ["こう / kou", "せい / sei", "メロディー / merodii"],
  },
  youon: {
    label: "요음(ゃ/ゅ/ょ) 결합",
    explanation: "요음은 kya, shu, ryo처럼 작은 ゃ/ゅ/ょ가 앞 음절과 붙어서 하나의 박자를 만듭니다.",
    focusKana: ["ゃ", "ゅ", "ょ"],
    reason: "y가 들어가는 결합음이나 작은 kana 주변에서 입력 흐름이 흔들리는 패턴이 보입니다.",
    drill: "kya, kyu, kyo / sha, shu, sho / rya, ryu, ryo를 3개씩 묶어 반복하세요.",
    samplePrompts: ["きゃ / kya", "しゅ / shu", "りょ / ryo"],
  },
  "kana-romaji": {
    label: "기본 kana-romaji 매칭",
    explanation: "특정 발음 패턴보다 개별 키와 kana 대응에서 반복 오타가 보입니다.",
    focusKana: [],
    reason: "같은 target/input 조합이 반복되어 기본 매핑 자동화가 아직 완전히 안정되지 않았습니다.",
    drill: "자주 틀린 글자 3개만 뽑아 30초씩 느린 속도로 정확도 100%를 목표로 반복하세요.",
    samplePrompts: ["ゆめ / yume", "ひかり / hikari", "こころ / kokoro"],
  },
};

export const JAPANESE_TUTOR_SYSTEM_PROMPT = [
  "You are an expert Japanese language tutor and typing coach for Enterping, a Japanese culture typing game.",
  "Analyze typo logs beyond simple key mistakes. Diagnose Japanese pronunciation and romaji-input patterns.",
  "Prioritize these training categories when supported by data: sokuon (っ), shi/chi/tsu (し/ち/つ), long vowels (ー, おう, えい), and youon (ゃ/ゅ/ょ).",
  "Respond in Korean by default, while preserving Japanese kana and common romanization terms where helpful.",
  "Return only strict JSON with exactly these keys: weakness, tip, encouragement, trainingRecommendations.",
  "trainingRecommendations must be an array of 1 to 4 items. Each item must include patternId, label, count, severity, focusKana, reason, drill, and samplePrompts.",
  "Do not include markdown, explanations outside JSON, or additional keys.",
].join("\n");

export function buildTypingAnalysisPrompt({
  userId,
  username,
  typoLogs,
}: BuildTypingAnalysisPromptInput): string {
  const targetFrequencies = countBy(typoLogs, (log) => log.targetCharacter);
  const inputFrequencies = countBy(typoLogs, (log) => log.inputtedCharacter);
  const confusionPairs = countBy(
    typoLogs,
    (log) => `${log.targetCharacter || "?"} -> ${log.inputtedCharacter || "?"}`,
  );
  const contextualPatterns = countBy(
    typoLogs.filter((log) => log.contextualPreviousWord),
    (log) => `${log.contextualPreviousWord} + ${log.targetCharacter || "?"}`,
  );
  const topPatterns = getTopTypoPatterns(typoLogs, 5);
  const trainingRecommendations = getPronunciationTrainingRecommendations(typoLogs, 4);

  const recentExamples = typoLogs.slice(0, 20).map((log) => ({
    targetCharacter: log.targetCharacter,
    inputtedCharacter: log.inputtedCharacter,
    previousContext: log.contextualPreviousWord ?? null,
    nextContext: log.contextualNextWord ?? null,
    targetTextPosition: log.targetTextPosition ?? null,
    videoTimestampMs: log.videoTimestampMs ?? null,
    sessionTimestampMs: log.sessionTimestampMs ?? null,
    lyricLine: log.lyricSync?.japaneseText ?? null,
    romaji: log.lyricSync?.romajiText ?? null,
    koreanPronunciation: log.lyricSync?.koreanPronunciationText ?? null,
    contentTitle: log.lyricSync?.content?.title ?? null,
  }));

  return [
    "You are Enterping's Japanese typing coach.",
    "Generate a concise, personalized feedback report for the learner.",
    "Use the precomputed pronunciation diagnostics first, then explain the likely cause and the next drill.",
    "Only mention sokuon, shi/chi/tsu, long vowels, youon, or Korean-pronunciation interference when the data supports it.",
    "Avoid shaming language. Be specific, encouraging, and actionable.",
    "",
    "User:",
    JSON.stringify(
      {
        userId,
        username: username ?? null,
        analyzedTypoCount: typoLogs.length,
      },
      null,
      2,
    ),
    "",
    "Aggregates:",
    JSON.stringify(
      {
        mostMissedTargets: topEntries(targetFrequencies, 12),
        mostPressedWrongKeys: topEntries(inputFrequencies, 12),
        commonConfusions: topEntries(confusionPairs, 12),
        contextualPatterns: topEntries(contextualPatterns, 12),
      },
      null,
      2,
    ),
    "",
    "Precomputed pronunciation diagnostics:",
    JSON.stringify(
      {
        topPatterns,
        recommendedTraining: trainingRecommendations,
      },
      null,
      2,
    ),
    "",
    "Recent typo examples:",
    JSON.stringify(recentExamples, null, 2),
    "",
    "Return JSON with this exact shape:",
    JSON.stringify(
      {
        weakness: "short Korean phrase naming the main weak point",
        tip: "one practical Korean tip or drill for the next session",
        encouragement: "one short motivating Korean sentence",
        trainingRecommendations: [
          {
            patternId: "sokuon",
            label: "촉음(っ) 입력 타이밍",
            count: 3,
            severity: "medium",
            focusKana: ["っ"],
            reason: "why this pattern matters for this learner",
            drill: "concrete drill",
            samplePrompts: ["まって / matte", "きっと / kitto"],
          },
        ],
      },
      null,
      2,
    ),
  ].join("\n");
}

export function formatTypoAnalysisUserPrompt(typoLogs: TypingAnalysisTypoLog[]): string {
  const topPatterns = getTopTypoPatterns(typoLogs, 3);
  const trainingRecommendations = getPronunciationTrainingRecommendations(typoLogs, 4);
  const compactExamples = typoLogs.slice(0, 12).map((log) => ({
    targetCharacter: log.targetCharacter,
    inputtedCharacter: log.inputtedCharacter,
    previousContext: log.contextualPreviousWord ?? null,
    nextContext: log.contextualNextWord ?? null,
    lyricLine: log.lyricSync?.japaneseText ?? null,
    romaji: log.lyricSync?.romajiText ?? null,
    koreanPronunciation: log.lyricSync?.koreanPronunciationText ?? null,
  }));

  return [
    "Analyze this learner's recent Japanese typing mistakes and produce JSON feedback.",
    "The JSON must contain weakness, tip, encouragement, and trainingRecommendations.",
    "Base trainingRecommendations on the precomputed Japanese pronunciation patterns.",
    "",
    "Top missed characters/patterns:",
    JSON.stringify(topPatterns, null, 2),
    "",
    "Recommended pronunciation-pattern drills:",
    JSON.stringify(trainingRecommendations, null, 2),
    "",
    "Recent typo examples:",
    JSON.stringify(compactExamples, null, 2),
    "",
    "Guidance:",
    "- weakness: one short Korean phrase naming the main weak point.",
    "- tip: one practical drill or habit the learner can apply in the next session.",
    "- encouragement: one short motivating Korean sentence.",
    "- trainingRecommendations: keep 1-4 items and preserve patternId/count/severity/focusKana when possible.",
  ].join("\n");
}

export function getTopTypoPatterns(
  typoLogs: TypingAnalysisTypoLog[],
  limit = 3,
): TypoPatternSummary[] {
  const buckets = new Map<string, TypoPatternSummary>();

  for (const typoLog of typoLogs) {
    const pattern = classifyTypoPattern(typoLog);
    const current = buckets.get(pattern.label) ?? {
      label: pattern.label,
      count: 0,
      explanation: pattern.explanation,
      examples: [],
    };

    current.count += 1;

    if (current.examples.length < 5) {
      current.examples.push({
        targetCharacter: typoLog.targetCharacter,
        inputtedCharacter: typoLog.inputtedCharacter,
        previousContext: typoLog.contextualPreviousWord ?? null,
        lyricLine: typoLog.lyricSync?.japaneseText ?? null,
        romaji: typoLog.lyricSync?.romajiText ?? null,
      });
    }

    buckets.set(pattern.label, current);
  }

  return [...buckets.values()].sort((left, right) => right.count - left.count).slice(0, limit);
}

export function getPronunciationTrainingRecommendations(
  typoLogs: TypingAnalysisTypoLog[],
  limit = 4,
): PronunciationTrainingRecommendation[] {
  const buckets = new Map<PronunciationPatternId, number>();

  for (const typoLog of typoLogs) {
    const pattern = classifyPronunciationPattern(typoLog);
    buckets.set(pattern, (buckets.get(pattern) ?? 0) + 1);
  }

  return [...buckets.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([patternId, count]) => {
      const definition = PATTERN_DEFINITIONS[patternId];

      return {
        patternId,
        label: definition.label,
        count,
        severity: getPatternSeverity(count, typoLogs.length),
        focusKana: definition.focusKana,
        reason: definition.reason,
        drill: definition.drill,
        samplePrompts: definition.samplePrompts,
      };
    });
}

export function normalizeAiErrorFeedback(value: unknown): AiErrorFeedback {
  if (!value || typeof value !== "object") {
    throw new Error("AI feedback response was not an object.");
  }

  const candidate = value as Partial<Record<keyof AiErrorFeedback, unknown>>;
  const feedback = {
    weakness: candidate.weakness,
    tip: candidate.tip,
    encouragement: candidate.encouragement,
    trainingRecommendations: normalizeTrainingRecommendations(candidate.trainingRecommendations),
  };

  if (
    typeof feedback.weakness !== "string" ||
    typeof feedback.tip !== "string" ||
    typeof feedback.encouragement !== "string"
  ) {
    throw new Error("AI feedback response did not match the expected JSON shape.");
  }

  return {
    weakness: feedback.weakness,
    tip: feedback.tip,
    encouragement: feedback.encouragement,
    trainingRecommendations: feedback.trainingRecommendations,
  };
}

function classifyTypoPattern(typoLog: TypingAnalysisTypoLog): {
  label: string;
  explanation: string;
} {
  const patternId = classifyPronunciationPattern(typoLog);
  const definition = PATTERN_DEFINITIONS[patternId];

  if (patternId !== "kana-romaji") {
    return {
      label: definition.label,
      explanation: definition.explanation,
    };
  }

  const target = typoLog.targetCharacter.trim();
  const input = typoLog.inputtedCharacter.trim();

  return {
    label: target ? `target "${target}"` : `input "${input}"`,
    explanation: definition.explanation,
  };
}

function classifyPronunciationPattern(typoLog: TypingAnalysisTypoLog): PronunciationPatternId {
  const context = getTypoContext(typoLog);

  if (hasSokuonSignal(context)) {
    return "sokuon";
  }

  if (hasShiChiTsuSignal(context)) {
    return "shi-chi-tsu";
  }

  if (hasLongVowelSignal(context)) {
    return "long-vowel";
  }

  if (hasYouonSignal(context)) {
    return "youon";
  }

  return "kana-romaji";
}

function getTypoContext(typoLog: TypingAnalysisTypoLog) {
  const target = typoLog.targetCharacter.trim();
  const input = typoLog.inputtedCharacter.trim();
  const previousContext = typoLog.contextualPreviousWord?.trim() ?? "";
  const nextContext = typoLog.contextualNextWord?.trim() ?? "";
  const romaji = typoLog.lyricSync?.romajiText?.toLowerCase() ?? "";
  const koreanPronunciation = typoLog.lyricSync?.koreanPronunciationText ?? "";
  const japaneseText = katakanaToHiragana(typoLog.lyricSync?.japaneseText ?? "");
  const romanContext = `${previousContext}${target}${nextContext}`.toLowerCase();
  const inputContext = `${previousContext}${input}${nextContext}`.toLowerCase();

  return {
    target,
    input,
    japaneseText,
    koreanPronunciation,
    romaji,
    romanContext,
    inputContext,
  };
}

function hasSokuonSignal(context: ReturnType<typeof getTypoContext>): boolean {
  return (
    context.japaneseText.includes("っ") &&
    (hasDoubleConsonantCue(context.romaji) ||
      hasDoubleConsonantCue(context.romanContext) ||
      /^[bcdfghjklmnpqrstvwxyz]$/i.test(context.target))
  );
}

function hasShiChiTsuSignal(context: ReturnType<typeof getTypoContext>): boolean {
  return (
    /[しちつ]/.test(context.japaneseText) ||
    /(shi|chi|tsu)/.test(context.romaji) ||
    /(sh|ch|ts|si|ti|tu)/.test(context.romanContext) ||
    /[シチツしちつ]/.test(context.koreanPronunciation)
  );
}

function hasLongVowelSignal(context: ReturnType<typeof getTypoContext>): boolean {
  return (
    context.japaneseText.includes("ー") ||
    /おう|えい|ああ|いい|うう|ええ|おお/.test(context.japaneseText) ||
    hasLongVowelCue(context.romaji) ||
    (/^[aeiou-]$/i.test(context.target) && hasLongVowelCue(context.romanContext))
  );
}

function hasYouonSignal(context: ReturnType<typeof getTypoContext>): boolean {
  return (
    /[ゃゅょ]/.test(context.japaneseText) ||
    /(kya|kyu|kyo|sha|shu|sho|cha|chu|cho|nya|nyu|nyo|hya|hyu|hyo|mya|myu|myo|rya|ryu|ryo|gya|gyu|gyo|ja|ju|jo|bya|byu|byo|pya|pyu|pyo)/.test(
      context.romaji,
    ) ||
    /(ky|sh|ch|ny|hy|my|ry|gy|j|by|py)/.test(context.romanContext)
  );
}

function normalizeTrainingRecommendations(value: unknown): PronunciationTrainingRecommendation[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      const patternId = isPronunciationPatternId(candidate.patternId)
        ? candidate.patternId
        : "kana-romaji";

      return {
        patternId,
        label: getString(candidate.label) ?? PATTERN_DEFINITIONS[patternId].label,
        count: getNonNegativeInteger(candidate.count),
        severity: isSeverity(candidate.severity) ? candidate.severity : "low",
        focusKana: getStringArray(candidate.focusKana),
        reason: getString(candidate.reason) ?? PATTERN_DEFINITIONS[patternId].reason,
        drill: getString(candidate.drill) ?? PATTERN_DEFINITIONS[patternId].drill,
        samplePrompts: getStringArray(candidate.samplePrompts),
      };
    })
    .filter((item): item is PronunciationTrainingRecommendation => item !== null)
    .slice(0, 4);
}

function countBy<T>(items: T[], getKey: (item: T) => string | null | undefined): Record<string, number> {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item)?.trim();

    if (!key) {
      return counts;
    }

    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function topEntries(counts: Record<string, number>, limit: number): Array<{ value: string; count: number }> {
  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

function getPatternSeverity(count: number, total: number): PronunciationTrainingRecommendation["severity"] {
  const ratio = total > 0 ? count / total : 0;

  if (count >= 6 || ratio >= 0.45) {
    return "high";
  }

  if (count >= 3 || ratio >= 0.25) {
    return "medium";
  }

  return "low";
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 6)
    : [];
}

function getNonNegativeInteger(value: unknown): number {
  const numberValue = Math.round(Number(value));
  return Number.isFinite(numberValue) ? Math.max(0, numberValue) : 0;
}

function isPronunciationPatternId(value: unknown): value is PronunciationPatternId {
  return (
    value === "sokuon" ||
    value === "shi-chi-tsu" ||
    value === "long-vowel" ||
    value === "youon" ||
    value === "kana-romaji"
  );
}

function isSeverity(value: unknown): value is PronunciationTrainingRecommendation["severity"] {
  return value === "low" || value === "medium" || value === "high";
}

function katakanaToHiragana(value: string): string {
  return Array.from(value)
    .map((char) => {
      const code = char.charCodeAt(0);
      return code >= 0x30a1 && code <= 0x30f6 ? String.fromCharCode(code - 0x60) : char;
    })
    .join("");
}

function hasDoubleConsonantCue(value: string): boolean {
  return /([bcdfghjklmnpqrstvwxyz])\1/.test(value);
}

function hasLongVowelCue(value: string): boolean {
  return /aa|ii|uu|ee|oo|ou|ei|-/.test(value);
}
