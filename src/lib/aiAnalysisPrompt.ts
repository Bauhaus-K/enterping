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

export interface AiErrorFeedback {
  weakness: string;
  tip: string;
  encouragement: string;
}

export const JAPANESE_TUTOR_SYSTEM_PROMPT = [
  "You are an expert Japanese language tutor and typing coach for Enterping, a Japanese culture typing game.",
  "Analyze the learner's typo patterns with special attention to Japanese phonetics, kana timing, romaji input habits, and Korean-pronunciation input interference.",
  "Be precise about Japanese concepts such as sokuon (っ), youon (ゃ/ゅ/ょ), long vowels (ー), つ/tsu, ち/chi, し/shi, and ん/n when the data supports it.",
  "Respond in Korean by default, while preserving Japanese kana and common romanization terms where helpful.",
  "Return only strict JSON with exactly these keys: weakness, tip, encouragement.",
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
    "Focus on recurring Japanese sound/typing patterns, likely causes, and 3 practical drills.",
    "Mention patterns such as tsu, chi, sokuon, youon, long vowels, or Korean-pronunciation interference only when supported by the data.",
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
    "Recent typo examples:",
    JSON.stringify(recentExamples, null, 2),
    "",
    "Return the feedback in this structure:",
    "1. Main pattern summary",
    "2. Why it may be happening",
    "3. Practice drills",
    "4. Next goal for the next 3 sessions",
  ].join("\n");
}

export function formatTypoAnalysisUserPrompt(typoLogs: TypingAnalysisTypoLog[]): string {
  const topPatterns = getTopTypoPatterns(typoLogs, 3);
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
    "The JSON must contain weakness, tip, and encouragement.",
    "",
    "Top 3 missed characters/patterns:",
    JSON.stringify(topPatterns, null, 2),
    "",
    "Recent typo examples:",
    JSON.stringify(compactExamples, null, 2),
    "",
    "Guidance:",
    "- weakness: one short phrase naming the main weak point.",
    "- tip: one practical drill or habit the learner can apply in the next session.",
    "- encouragement: one short motivating sentence.",
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

export function normalizeAiErrorFeedback(value: unknown): AiErrorFeedback {
  if (!value || typeof value !== "object") {
    throw new Error("AI feedback response was not an object.");
  }

  const candidate = value as Partial<Record<keyof AiErrorFeedback, unknown>>;
  const feedback = {
    weakness: candidate.weakness,
    tip: candidate.tip,
    encouragement: candidate.encouragement,
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
  };
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

function classifyTypoPattern(typoLog: TypingAnalysisTypoLog): {
  label: string;
  explanation: string;
} {
  const target = typoLog.targetCharacter.trim();
  const input = typoLog.inputtedCharacter.trim();
  const previousContext = typoLog.contextualPreviousWord?.trim() ?? "";
  const nextContext = typoLog.contextualNextWord?.trim() ?? "";
  const romaji = typoLog.lyricSync?.romajiText?.toLowerCase() ?? "";
  const koreanPronunciation = typoLog.lyricSync?.koreanPronunciationText ?? "";
  const japaneseText = katakanaToHiragana(typoLog.lyricSync?.japaneseText ?? "");
  const romanContext = `${previousContext}${target}${nextContext}`.toLowerCase();

  if (/[ぁ-んァ-ン]/.test(target)) {
    return {
      label: `${katakanaToHiragana(target)} kana`,
      explanation: "A specific Japanese kana is frequently missed.",
    };
  }

  if (
    japaneseText.includes("っ") &&
    (/^[bcdfghjklmnpqrstvwxyz]$/i.test(target) || hasDoubleConsonantCue(romaji))
  ) {
    return {
      label: "sokuon (っ) timing",
      explanation: "Small っ often requires a doubled consonant or tighter input timing.",
    };
  }

  if (romanContext.includes("ts") || romaji.includes("tsu") || koreanPronunciation.includes("츠") || japaneseText.includes("つ")) {
    return {
      label: "tsu (つ)",
      explanation: "The つ sound is easy to confuse with su/tu patterns during fast typing.",
    };
  }

  if (romanContext.includes("ch") || romaji.includes("chi") || koreanPronunciation.includes("치") || japaneseText.includes("ち")) {
    return {
      label: "chi (ち)",
      explanation: "The ち sound often causes ch/ti input confusion.",
    };
  }

  if (japaneseText.includes("ー") || target === "-" || /^[aeiou]$/i.test(target) && hasLongVowelCue(romaji)) {
    return {
      label: "long vowels (ー)",
      explanation: "Long vowels require sustaining the vowel or handling the long-vowel mark.",
    };
  }

  if (/[ゃゅょ]/.test(japaneseText) || romanContext.includes("y")) {
    return {
      label: "youon (ゃ/ゅ/ょ)",
      explanation: "Contracted sounds like kya, shu, and ryo need two-kana awareness.",
    };
  }

  if (romanContext.includes("sh") || romaji.includes("shi") || koreanPronunciation.includes("시") || japaneseText.includes("し")) {
    return {
      label: "shi (し)",
      explanation: "The し sound can cause si/shi input confusion.",
    };
  }

  if (japaneseText.includes("ん") || target.toLowerCase() === "n") {
    return {
      label: "n (ん)",
      explanation: "The nasal ん can be mistyped when it appears before another consonant or vowel.",
    };
  }

  return {
    label: target ? `target "${target}"` : `input "${input}"`,
    explanation: "A repeated target/input mismatch appears in the typo logs.",
  };
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
