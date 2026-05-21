import "server-only";

import { withEndTimes, type LrcLine } from "./lrcParser";
import { generatePronunciationGuides } from "./japaneseGuides";
import { getAcceptedInputs, TypingInputMode } from "./typingEngine";

export interface TimedTextLine {
  startMs: number;
  endMs?: number | null;
  displayText: string;
  typingText?: string | null;
}

export interface PreparedLyricSyncLine {
  lineIndex: number;
  startMs: number;
  endMs: number;
  japaneseText: string;
  romajiText: string;
  koreanPronunciationText: string;
}

export async function prepareLyricSyncLines(lines: TimedTextLine[]): Promise<PreparedLyricSyncLine[]> {
  const normalizedLines = lines
    .map((line) => ({
      startMs: Math.max(0, Math.round(line.startMs)),
      endMs: line.endMs == null ? null : Math.max(0, Math.round(line.endMs)),
      displayText: normalizeDisplayText(line.displayText),
      typingText: normalizeDisplayText(line.typingText || line.displayText),
    }))
    .filter((line) => line.displayText.length > 0 || line.typingText.length > 0)
    .sort((left, right) => left.startMs - right.startMs);

  const guides = await generatePronunciationGuides(
    normalizedLines.map((line) => line.typingText || line.displayText),
  );

  return normalizedLines.map((line, index) => {
    const guide = guides[index];
    const typingText = normalizeTypingText(guide?.hiraganaText || line.typingText || line.displayText);
    const fallbackEndMs =
      normalizedLines[index + 1]?.startMs != null
        ? Math.max(line.startMs + 500, normalizedLines[index + 1].startMs - 80)
        : line.startMs + 4500;
    const endMs = line.endMs == null ? fallbackEndMs : Math.max(line.startMs + 500, line.endMs);

    return {
      lineIndex: index,
      startMs: line.startMs,
      endMs,
      japaneseText: typingText,
      romajiText: getAcceptedInputs(typingText, TypingInputMode.Romaji)[0] ?? "",
      koreanPronunciationText: getAcceptedInputs(typingText, TypingInputMode.Hangul)[0] ?? "",
    };
  });
}

export async function prepareLrcLyricSyncLines(parsedLines: LrcLine[]): Promise<PreparedLyricSyncLine[]> {
  return prepareLyricSyncLines(
    withEndTimes(parsedLines).map((line) => ({
      startMs: line.startMs,
      endMs: line.endMs,
      displayText: line.displayText,
      typingText: line.typingText,
    })),
  );
}

function normalizeDisplayText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\r?\n/g, " ")
    .replace(/[♪♫♬]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTypingText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[♪♫♬]/g, "")
    .replace(/\s+/g, "")
    .trim();
}
