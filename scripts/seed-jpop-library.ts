import { promises as fs } from "node:fs";
import path from "node:path";

import { ContentCategory, PrismaClient } from "@prisma/client";

import { JPOP_SONGS } from "../src/lib/jpopSongs";
import { parseLrc, withEndTimes } from "../src/lib/lrcParser";
import { getAcceptedInputs, TypingInputMode } from "../src/lib/typingEngine";

const prisma = new PrismaClient();
const lyricsDir = path.join(process.cwd(), "data", "jpop-lyrics");

async function main() {
  for (const song of JPOP_SONGS) {
    const lrcContent = await fs.readFile(path.join(lyricsDir, `${song.id}.lrc`), "utf8");
    const lyricLines = withEndTimes(parseLrc(lrcContent));

    await prisma.content.upsert({
      where: { id: song.id },
      update: {
        youtubeVideoId: song.youtubeVideoId,
        title: song.title,
        artist: song.artist,
        category: ContentCategory.JPOP,
        thumbnailUrl: song.thumbnailUrl,
        syncOffsetMs: song.syncOffsetMs ?? 0,
        difficulty: song.difficulty,
        isPublished: true,
        isUgc: false,
        playCount: song.playCount,
      },
      create: {
        id: song.id,
        youtubeVideoId: song.youtubeVideoId,
        title: song.title,
        artist: song.artist,
        category: ContentCategory.JPOP,
        thumbnailUrl: song.thumbnailUrl,
        syncOffsetMs: song.syncOffsetMs ?? 0,
        difficulty: song.difficulty,
        isPublished: true,
        isUgc: false,
        playCount: song.playCount,
      },
    });

    await prisma.lyricSync.deleteMany({
      where: { contentId: song.id },
    });

    await prisma.lyricSync.createMany({
      data: lyricLines.map((line, index) => ({
        id: `${song.id}-line-${index}`,
        contentId: song.id,
        lineIndex: index,
        startMs: line.startMs,
        endMs: line.endMs,
        japaneseText: line.typingText,
        romajiText: getAcceptedInputs(line.typingText, TypingInputMode.Romaji)[0] ?? "",
        koreanPronunciationText: getAcceptedInputs(line.typingText, TypingInputMode.Hangul)[0] ?? "",
      })),
    });

    console.log(`[Enterping][Seed] ${song.id}: ${lyricLines.length} lyric lines inserted.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
