import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const LYRICS_DIR = path.join(ROOT, "data", "jpop-lyrics");
const CAPTIONS_DIR = path.join(ROOT, ".tmp", "youtube-captions");

const SONGS = [
  {
    id: "jpop-lemon",
    captionPath: path.join(CAPTIONS_DIR, "jpop-lemon-ko.ko.json3"),
    source: "YouTube official Korean captions",
    buildLines: buildLemonLines,
  },
  {
    id: "jpop-pretender",
    captionPath: path.join(CAPTIONS_DIR, "jpop-pretender.ja.json3"),
    source: "YouTube official Japanese captions",
    buildLines: buildPretenderLines,
  },
];

function parseLrc(content) {
  const rows = [];
  const timestampRegex = /^\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\](.*)$/;

  for (const rawLine of content.split(/\r?\n/)) {
    const match = rawLine.match(timestampRegex);
    if (!match) continue;

    const text = match[4].trim();
    if (!text) continue;

    const [displayText, typingText = displayText] = text.split("|").map((segment) => segment.trim());
    rows.push({ displayText, typingText });
  }

  return rows;
}

function parseJson3Captions(content) {
  const data = JSON.parse(content);

  return (data.events ?? [])
    .filter((event) => event.segs && Number.isFinite(event.tStartMs))
    .map((event) => {
      const text = event.segs
        .map((segment) => segment.utf8 ?? "")
        .join("")
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      return { startMs: event.tStartMs, text };
    })
    .filter((event) => event.text && event.text !== "♪" && event.text !== "[音楽]");
}

function splitRow(row) {
  return row.displayText.split(/\s+/).filter(Boolean).map((displayText, index) => ({
    displayText,
    typingText: row.typingText.split(/\s+/).filter(Boolean)[index] ?? displayText,
  }));
}

function combineRows(rows) {
  return {
    displayText: rows.map((row) => row.displayText).join(" "),
    typingText: rows.map((row) => row.typingText).join(" "),
  };
}

function pick(rows, oneBasedIndex) {
  const row = rows[oneBasedIndex - 1];
  if (!row) throw new Error(`Missing LRC row ${oneBasedIndex}`);
  return row;
}

function buildLemonLines(rows) {
  const line11Parts = splitRow(pick(rows, 11));
  const line20Parts = splitRow(pick(rows, 20));
  const line28Parts = splitRow(pick(rows, 28));
  const line29Parts = splitRow(pick(rows, 29));
  const line30Parts = splitRow(pick(rows, 30));
  const line31Parts = splitRow(pick(rows, 31));
  const line32Parts = splitRow(pick(rows, 32));

  return [
    ...rows.slice(0, 10),
    ...line11Parts,
    pick(rows, 12),
    pick(rows, 13),
    pick(rows, 14),
    pick(rows, 15),
    pick(rows, 16),
    pick(rows, 17),
    pick(rows, 18),
    pick(rows, 19),
    ...line20Parts,
    pick(rows, 21),
    combineRows([pick(rows, 22), pick(rows, 23)]),
    pick(rows, 24),
    pick(rows, 25),
    pick(rows, 26),
    pick(rows, 27),
    ...line28Parts,
    ...line29Parts,
    ...line30Parts,
    ...line31Parts,
    ...line32Parts,
    pick(rows, 33),
    pick(rows, 34),
    pick(rows, 35),
    pick(rows, 36),
    pick(rows, 37),
  ];
}

function buildPretenderLines(rows) {
  const groups = [
    [1, 2],
    [3],
    [4, 5],
    [6, 7],
    [8],
    [9, 10],
    [11, 12],
    [13, 14],
    [15, 16],
    [17],
    [18],
    [19],
    [20],
    [21, 22],
    [23, 24],
    [25],
    [26],
    [27],
    [28, 29],
    [30],
    [31],
    [32, 33],
    [34],
    [35, 36],
    [37, 38],
    [39, 40],
    [41, 42],
    [43],
    [44],
    [45],
    [46],
    [47, 48],
    [49, 50],
    [51],
    [52],
    [53],
    [54, 55],
    [56, 57],
    [58],
    [59],
    [60],
    [61, 62],
    [63],
    [64],
    [65, 66],
    [67],
    [68],
  ];

  return groups.map((group) => combineRows(group.map((index) => pick(rows, index))));
}

function formatTimestamp(milliseconds) {
  const clamped = Math.max(0, Math.round(milliseconds));
  const totalSeconds = Math.floor(clamped / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  const centiseconds = Math.floor((clamped % 1000) / 10).toString().padStart(2, "0");
  return `[${minutes}:${seconds}.${centiseconds}]`;
}

async function applySong(song) {
  const lrcPath = path.join(LYRICS_DIR, `${song.id}.lrc`);
  const originalLrc = await fs.readFile(lrcPath, "utf8");
  const captions = parseJson3Captions(await fs.readFile(song.captionPath, "utf8"));
  const rows = song.buildLines(parseLrc(originalLrc));

  if (rows.length !== captions.length) {
    throw new Error(`${song.id}: line count mismatch, LRC ${rows.length}, captions ${captions.length}`);
  }

  await fs.copyFile(lrcPath, `${lrcPath}.bak`);

  const body = rows.map((row, index) => {
    const text = row.displayText === row.typingText
      ? row.displayText
      : `${row.displayText}|${row.typingText}`;
    return `${formatTimestamp(captions[index].startMs)}${text}`;
  });

  const content = [
    `[ti:${song.id}]`,
    "[lang:ja]",
    "[mode:typing]",
    `[sync:youtube-caption]`,
    `[source:${song.source}]`,
    "",
    ...body,
    "",
  ].join("\n");

  await fs.writeFile(lrcPath, content, "utf8");
  return { id: song.id, lines: rows.length, backup: `${lrcPath}.bak` };
}

const results = [];
for (const song of SONGS) {
  results.push(await applySong(song));
}

console.log(JSON.stringify(results, null, 2));
