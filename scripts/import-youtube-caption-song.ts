import { promises as fs } from "node:fs";
import path from "node:path";

import { ContentCategory, PrismaClient } from "@prisma/client";
import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";

import { getAcceptedInputs, TypingInputMode } from "../src/lib/typingEngine";

interface CaptionEvent {
  tStartMs?: number;
  dDurationMs?: number;
  segs?: Array<{ utf8?: string }>;
}

interface ImportOptions {
  id: string;
  video: string;
  title: string;
  artist: string;
  caption: string;
  difficulty: number;
  playCount: number;
  thumbnailUrl?: string;
  syncOffsetMs: number;
}

interface CaptionLine {
  startMs: number;
  endMs: number;
  displayText: string;
  typingText: string;
}

const prisma = new PrismaClient();
const lyricsDir = path.join(process.cwd(), "data", "jpop-lyrics");

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const lines = await buildCaptionLines(options.caption);

  if (lines.length === 0) {
    throw new Error(`No usable Japanese caption lines found in ${options.caption}`);
  }

  await fs.mkdir(lyricsDir, { recursive: true });
  await fs.writeFile(path.join(lyricsDir, `${options.id}.lrc`), buildLrc(options, lines), "utf8");

  await prisma.content.upsert({
    where: { id: options.id },
    update: {
      youtubeVideoId: options.video,
      title: options.title,
      artist: options.artist,
      category: ContentCategory.JPOP,
      thumbnailUrl: options.thumbnailUrl ?? `https://i.ytimg.com/vi/${options.video}/hqdefault.jpg`,
      syncOffsetMs: options.syncOffsetMs,
      difficulty: options.difficulty,
      isPublished: true,
      isUgc: false,
      playCount: options.playCount,
    },
    create: {
      id: options.id,
      youtubeVideoId: options.video,
      title: options.title,
      artist: options.artist,
      category: ContentCategory.JPOP,
      thumbnailUrl: options.thumbnailUrl ?? `https://i.ytimg.com/vi/${options.video}/hqdefault.jpg`,
      syncOffsetMs: options.syncOffsetMs,
      difficulty: options.difficulty,
      isPublished: true,
      isUgc: false,
      playCount: options.playCount,
    },
  });

  await prisma.lyricSync.deleteMany({
    where: { contentId: options.id },
  });

  await prisma.lyricSync.createMany({
    data: lines.map((line, index) => ({
      id: `${options.id}-line-${index}`,
      contentId: options.id,
      lineIndex: index,
      startMs: line.startMs,
      endMs: line.endMs,
      japaneseText: line.typingText,
      romajiText: getAcceptedInputs(line.typingText, TypingInputMode.Romaji)[0] ?? "",
      koreanPronunciationText: getAcceptedInputs(line.typingText, TypingInputMode.Hangul)[0] ?? "",
    })),
  });

  console.log(
    JSON.stringify(
      {
        id: options.id,
        title: options.title,
        video: options.video,
        lines: lines.length,
        lrcPath: path.join("data", "jpop-lyrics", `${options.id}.lrc`),
      },
      null,
      2,
    ),
  );
}

async function buildCaptionLines(captionPath: string): Promise<CaptionLine[]> {
  const kuroshiro = new Kuroshiro();
  await kuroshiro.init(new KuromojiAnalyzer());

  const captionJson = JSON.parse(await fs.readFile(captionPath, "utf8")) as { events?: CaptionEvent[] };
  const rawLines = (captionJson.events ?? [])
    .map((event) => {
      const displayText = normalizeCaptionText(
        (event.segs ?? [])
          .map((segment) => segment.utf8 ?? "")
          .join(""),
      );

      if (!displayText || !Number.isFinite(event.tStartMs)) {
        return null;
      }

      return {
        startMs: event.tStartMs ?? 0,
        durationMs: event.dDurationMs ?? null,
        displayText,
      };
    })
    .filter((line): line is { startMs: number; durationMs: number | null; displayText: string } => line !== null)
    .filter((line, index, lines) => index === 0 || line.displayText !== lines[index - 1].displayText);

  const captionLines: CaptionLine[] = [];

  for (let index = 0; index < rawLines.length; index += 1) {
    const line = rawLines[index];
    const nextLine = rawLines[index + 1];
    const converted = await kuroshiro.convert(line.displayText, {
      to: "hiragana",
      mode: "normal",
    });
    const typingText = normalizeTypingText(converted);
    const endMs = nextLine
      ? Math.max(line.startMs + 500, nextLine.startMs - 80)
      : line.startMs + Math.max(line.durationMs ?? 4500, 2500);

    if (!typingText) {
      continue;
    }

    captionLines.push({
      startMs: line.startMs,
      endMs,
      displayText: line.displayText,
      typingText,
    });
  }

  return captionLines;
}

function normalizeCaptionText(value: string): string {
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
    .replace(/\s+/g, "")
    .trim();
}

function buildLrc(options: ImportOptions, lines: CaptionLine[]): string {
  const body = lines.map((line) => {
    const text = line.displayText === line.typingText ? line.displayText : `${line.displayText}|${line.typingText}`;
    return `${formatTimestamp(line.startMs)}${text}`;
  });

  return [
    `[ti:${options.title}]`,
    `[ar:${options.artist}]`,
    "[lang:ja]",
    "[mode:typing]",
    "[sync:youtube-caption]",
    `[youtube:${options.video}]`,
    "",
    ...body,
    "",
  ].join("\n");
}

function formatTimestamp(milliseconds: number): string {
  const clamped = Math.max(0, Math.round(milliseconds));
  const totalSeconds = Math.floor(clamped / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  const centiseconds = Math.floor((clamped % 1000) / 10)
    .toString()
    .padStart(2, "0");

  return `[${minutes}:${seconds}.${centiseconds}]`;
}

function parseArgs(args: string[]): ImportOptions {
  const values = new Map<string, string>();

  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    const value = args[index + 1];

    if (!key?.startsWith("--") || value === undefined || value.startsWith("--")) {
      continue;
    }

    values.set(key.slice(2), value);
    index += 1;
  }

  return {
    id: required(values, "id"),
    video: required(values, "video"),
    title: required(values, "title"),
    artist: required(values, "artist"),
    caption: required(values, "caption"),
    difficulty: parseInteger(values.get("difficulty"), 1, 5, 3),
    playCount: parseInteger(values.get("play-count"), 0, 999999, 0),
    thumbnailUrl: values.get("thumbnail-url"),
    syncOffsetMs: parseInteger(values.get("sync-offset-ms"), -30000, 30000, 0),
  };
}

function required(values: Map<string, string>, key: string): string {
  const value = values.get(key)?.trim();

  if (!value) {
    throw new Error(`Missing required --${key}`);
  }

  return value;
}

function parseInteger(value: string | undefined, min: number, max: number, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
