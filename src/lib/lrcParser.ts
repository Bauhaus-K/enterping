// Parses simple LRC rows for typing practice.
// Supported examples:
//   [00:08.50]lyrics
//   [00:08.50]display text|typing text
//   [00:08.50][00:32.10]repeated line
//
// If `|` exists, the left side is displayed and the right side is used for typing.
// If it does not exist, the same text is used for both display and typing.

export interface LrcLine {
  startMs: number;
  displayText: string;
  typingText: string;
}

const TIMESTAMP_REGEX = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

export function parseLrc(content: string): LrcLine[] {
  const result: LrcLine[] = [];

  for (const rawLine of content.split(/\r?\n/)) {
    const timestamps = extractTimestamps(rawLine);
    const text = rawLine.replace(TIMESTAMP_REGEX, "").trim();

    if (!text || timestamps.length === 0) {
      continue;
    }

    const [displayRaw, typingRaw] = text.split("|").map((segment) => segment.trim());
    const displayText = displayRaw;
    const typingText = typingRaw && typingRaw.length > 0 ? typingRaw : displayRaw;

    for (const ts of timestamps) {
      result.push({ startMs: ts, displayText, typingText });
    }
  }

  return result.sort((left, right) => left.startMs - right.startMs);
}

function extractTimestamps(rawLine: string): number[] {
  const timestamps: number[] = [];
  TIMESTAMP_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = TIMESTAMP_REGEX.exec(rawLine)) !== null) {
    const minutes = Number.parseInt(match[1], 10);
    const seconds = Number.parseInt(match[2], 10);
    const fracStr = match[3] ?? "0";
    const fracDivisor = 10 ** fracStr.length;
    const fractional = Number.parseInt(fracStr, 10) / fracDivisor;
    timestamps.push(Math.round((minutes * 60 + seconds + fractional) * 1000));
  }

  return timestamps;
}

export interface TimedLyricLine {
  startMs: number;
  endMs: number;
  displayText: string;
  typingText: string;
}

// Most LRC rows only provide a start time, so infer the end time from the next row.
export function withEndTimes(
  lines: LrcLine[],
  options: { trailingMs?: number; gapMs?: number } = {},
): TimedLyricLine[] {
  const { trailingMs = 4500, gapMs = 80 } = options;

  return lines.map((line, index) => {
    const next = lines[index + 1];
    const endMs = next ? Math.max(line.startMs + 500, next.startMs - gapMs) : line.startMs + trailingMs;
    return {
      startMs: line.startMs,
      endMs,
      displayText: line.displayText,
      typingText: line.typingText,
    };
  });
}
