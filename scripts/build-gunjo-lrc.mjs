import { promises as fs } from "node:fs";
import path from "node:path";
import KuroshiroModule from "kuroshiro";
import KuromojiAnalyzerModule from "kuroshiro-analyzer-kuromoji";

const ROOT = process.cwd();
const CAPTION_PATH = path.join(ROOT, ".tmp", "youtube-captions", "jpop-gunjo.ja.json3");
const OUTPUT_PATH = path.join(ROOT, "data", "jpop-lyrics", "jpop-gunjo.lrc");
const Kuroshiro = KuroshiroModule.default ?? KuroshiroModule;
const KuromojiAnalyzer = KuromojiAnalyzerModule.default ?? KuromojiAnalyzerModule;

const LYRICS = [
  "嗚呼いつもの様に",
  "過ぎる日々にあくびが出る",
  "さんざめく夜越え今日も",
  "渋谷の街に朝が降る",
  "どこか虚しいような",
  "そんな気持ち",
  "つまらないな",
  "でもそれでいい",
  "そんなもんさ",
  "これでいい",
  "知らず知らず隠してた",
  "本当の声を響かせてよほら",
  "見ないフリしていても",
  "確かにそこにある",
  "嗚呼 感じたままに描く",
  "自分で選んだその色で",
  "眠い空気纏う朝に",
  "訪れた青い世界",
  "好きなものを好きだと言う",
  "怖くて仕方ないけど",
  "本当の自分",
  "出会えた気がしたんだ",
  "嗚呼 手を伸ばせば伸ばすほどに",
  "遠くへゆく",
  "思うようにいかない今日も",
  "また慌ただしくもがいてる",
  "悔しい気持ちも ただ情けなくて",
  "涙が出る",
  "踏み込むほど 苦しくなる",
  "痛くもなる",
  "嗚呼 感じたままに進む",
  "自分で選んだこの道を",
  "重いまぶた擦る夜に",
  "しがみついた青い誓い",
  "好きなことを続けること",
  "それは楽しいだけじゃない",
  "本当にできる",
  "不安になるけど",
  "嗚呼 何枚でも ほら何枚でも",
  "自信がないから描いてきたんだよ",
  "嗚呼 何回でも ほら何回でも",
  "積み上げてきたことが武器になる",
  "周りを見たって 誰と比べたって",
  "僕にしかできないことはなんだ",
  "今でも自信なんかない それでも",
  "感じたことない気持ち",
  "知らずにいた想い",
  "あの日踏み出して",
  "初めて感じたこの痛みも全部",
  "好きなものと向き合うことで",
  "触れたまだ小さな光",
  "大丈夫 行こう あとは楽しむだけだ",
  "嗚呼 全てを賭けて描く",
  "自分にしか出せない色で",
  "朝も夜も走り続け",
  "見つけ出した青い光",
  "好きなものと向き合うこと",
  "今だって怖いことだけど",
  "もう今はあの日の透明な僕じゃない",
  "嗚呼 ありのままの",
  "かけがえの無い僕だ",
  "知らず知らず隠してた",
  "本当の声を響かせてよほら",
  "見ないフリしていても",
  "確かにそこに今もそこにあるよ",
  "知らず知らず隠してた",
  "本当の声を響かせてよさあ",
  "見ないフリしていても",
  "確かにそこに君の中に",
];

function parseCaptionTimes(content) {
  const data = JSON.parse(content);

  return (data.events ?? [])
    .filter((event) => event.segs && Number.isFinite(event.tStartMs))
    .map((event) => {
      const text = event.segs
        .map((segment) => segment.utf8 ?? "")
        .join("")
        .replace(/\n/g, " ")
        .trim();

      return { startMs: event.tStartMs, text };
    })
    .filter((event) => event.text && event.text !== "♪")
    .map((event) => event.startMs);
}

function formatTimestamp(milliseconds) {
  const clamped = Math.max(0, Math.round(milliseconds));
  const totalSeconds = Math.floor(clamped / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  const centiseconds = Math.floor((clamped % 1000) / 10).toString().padStart(2, "0");
  return `[${minutes}:${seconds}.${centiseconds}]`;
}

function normalizeHiragana(value) {
  return value
    .normalize("NFKC")
    .replace(/ああ/g, "ああ")
    .replace(/\s+/g, " ")
    .trim();
}

const rawCaptionTimes = parseCaptionTimes(await fs.readFile(CAPTION_PATH, "utf8"));
const captionTimes = [...rawCaptionTimes];

if (captionTimes.length === 68 && LYRICS.length === 69) {
  const combinedLineIndex = 60;
  const currentTime = captionTimes[combinedLineIndex];
  const nextTime = captionTimes[combinedLineIndex + 1] ?? currentTime + 2600;
  captionTimes.splice(combinedLineIndex + 1, 0, Math.round((currentTime + nextTime) / 2));
}

if (captionTimes.length !== LYRICS.length) {
  throw new Error(`Line count mismatch: captions=${captionTimes.length}, lyrics=${LYRICS.length}`);
}

const kuroshiro = new Kuroshiro();
await kuroshiro.init(new KuromojiAnalyzer());

const lines = [];
for (const [index, lyric] of LYRICS.entries()) {
  const hiragana = normalizeHiragana(
    await kuroshiro.convert(lyric, {
      to: "hiragana",
      mode: "normal",
    }),
  );
  lines.push(`${formatTimestamp(captionTimes[index])}${lyric}|${hiragana}`);
}

const content = [
  "[ti:群青]",
  "[ar:YOASOBI]",
  "[lang:ja]",
  "[mode:typing-hiragana]",
  "[source:user-provided-lyrics + YouTube auto-caption timings]",
  "",
  ...lines,
  "",
].join("\n");

await fs.writeFile(OUTPUT_PATH, content, "utf8");
console.log(`Wrote ${lines.length} lines to ${OUTPUT_PATH}`);
