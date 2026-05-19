import { getAcceptedInputs, TypingInputMode } from "./typingEngine";

export interface LemonDemoLyricLine {
  japaneseText: string;
  typingText: string;
}

const LINE_BLOCK_MS = 4500;
const LINE_ACTIVE_MS = 4200;

export const LEMON_DEMO_LYRIC_LINES: LemonDemoLyricLine[] = [
  { japaneseText: "夢ならばどれほど", typingText: "ゆめならばどれほど" },
  { japaneseText: "よかったでしょう", typingText: "よかったでしょう" },
  { japaneseText: "未だにあなたの", typingText: "いまだにあなたの" },
  { japaneseText: "ことを夢にみる", typingText: "ことをゆめにみる" },
  { japaneseText: "忘れた物を取りに", typingText: "わすれたものをとりに" },
  { japaneseText: "歸るように", typingText: "かえるように" },
  { japaneseText: "古びた思い出の埃を拂う", typingText: "ふるびたおもいでのほこりをはらう" },
  { japaneseText: "戾らない幸せがあることを", typingText: "もどらないしあわせがあることを" },
  { japaneseText: "最後にあなたが敎えてくれた", typingText: "さいごにあなたがおしえてくれた" },
  { japaneseText: "言えずに隱してた", typingText: "いえずにかくしてた" },
  { japaneseText: "昏い過去も", typingText: "くらいかこも" },
  { japaneseText: "あなたがいなきゃ永遠に", typingText: "あなたがいなきゃえいえんに" },
  { japaneseText: "昏いまま", typingText: "くらいまま" },
  { japaneseText: "きっともうこれ以上", typingText: "きっともうこれいじょう" },
  { japaneseText: "傷つくことなど", typingText: "きずつくことなど" },
  { japaneseText: "ありはしないとわかっている", typingText: "ありはしないとわかっている" },
  { japaneseText: "あの日の悲しみさえ", typingText: "あのひのかなしみさえ" },
  { japaneseText: "あの日の苦しみさえ", typingText: "あのひのくるしみさえ" },
  { japaneseText: "そのすべてを愛してた", typingText: "そのすべてをあいしてた" },
  { japaneseText: "あなたとともに", typingText: "あなたとともに" },
  { japaneseText: "胸に殘り離れない", typingText: "むねにのこりはなれない" },
  { japaneseText: "苦いレモンのにおい", typingText: "にがいれもんのにおい" },
  { japaneseText: "雨が降り止むまでは歸れない", typingText: "あめがふりやむまではかえれない" },
  { japaneseText: "今でもあなたはわたしの光", typingText: "いまでもあなたはわたしのひかり" },
  { japaneseText: "暗闇であなたの背をなぞった", typingText: "くらやみであなたのせをなぞった" },
  { japaneseText: "その輪郭を鮮明に覺えている", typingText: "そのりんかくをせんめいにおぼえている" },
  { japaneseText: "受け止めきれないものと", typingText: "うけとめきれないものと" },
  { japaneseText: "出會うたび", typingText: "であうたび" },
  { japaneseText: "溢れてやまないのは淚だけ", typingText: "あふれてやまないのはなみだだけ" },
  { japaneseText: "何をしていたの", typingText: "なにをしていたの" },
  { japaneseText: "何を見ていたの", typingText: "なにをみていたの" },
  { japaneseText: "わたしの知らない橫顔で", typingText: "わたしのしらないよこがおで" },
  { japaneseText: "どこかであなたが今", typingText: "どこかであなたがいま" },
  { japaneseText: "わたしと同じ樣な", typingText: "わたしとおなじような" },
  { japaneseText: "淚にくれ　淋しさの中にいるなら", typingText: "なみだにくれさびしさのなかにいるなら" },
  { japaneseText: "わたしのことなどどうか", typingText: "わたしのことなどどうか" },
  { japaneseText: "忘れてください", typingText: "わすれてください" },
  { japaneseText: "そんなことを心から願うほどに", typingText: "そんなことをこころからねがうほどに" },
  { japaneseText: "今でもあなたはわたしの光", typingText: "いまでもあなたはわたしのひかり" },
  { japaneseText: "自分が思うより", typingText: "じぶんがおもうより" },
  { japaneseText: "戀をしていたあなたに", typingText: "こいをしていたあなたに" },
  { japaneseText: "あれから思うように", typingText: "あれからおもうように" },
  { japaneseText: "息ができない", typingText: "いきができない" },
  { japaneseText: "あんなに側にいたのに", typingText: "あんなにそばにいたのに" },
  { japaneseText: "まるで噓みたい", typingText: "まるでうそみたい" },
  { japaneseText: "とても忘れられない", typingText: "とてもわすれられない" },
  { japaneseText: "それだけが確か", typingText: "それだけがたしか" },
  { japaneseText: "あの日の悲しみさえ", typingText: "あのひのかなしみさえ" },
  { japaneseText: "あの日の苦しみさえ", typingText: "あのひのくるしみさえ" },
  { japaneseText: "そのすべてを愛してた", typingText: "そのすべてをあいしてた" },
  { japaneseText: "あなたとともに", typingText: "あなたとともに" },
  { japaneseText: "胸に殘り離れない", typingText: "むねにのこりはなれない" },
  { japaneseText: "苦いレモンのにおい", typingText: "にがいれもんのにおい" },
  { japaneseText: "雨が降り止むまでは歸れない", typingText: "あめがふりやむまではかえれない" },
  { japaneseText: "切り分けた果實の片方の樣に", typingText: "きりわけたかじつのかたほうのように" },
  { japaneseText: "今でもあなたはわたしの光", typingText: "いまでもあなたはわたしのひかり" },
];

export function buildLemonDemoLyricSyncData() {
  return LEMON_DEMO_LYRIC_LINES.map((line, index) => ({
    id: `demo-content-jpop-lemon-line-${index}`,
    contentId: "demo-content-jpop-lemon",
    lineIndex: index,
    startMs: index * LINE_BLOCK_MS,
    endMs: index * LINE_BLOCK_MS + LINE_ACTIVE_MS,
    japaneseText: line.japaneseText,
    typingText: line.typingText,
    romajiText: getAcceptedInputs(line.typingText, TypingInputMode.Romaji)[0] ?? "",
    koreanPronunciationText: null,
    koreanTranslationText: null,
  }));
}
