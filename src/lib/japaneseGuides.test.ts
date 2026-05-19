import { hiraganaToHangulPronunciation } from "./japaneseGuides";

describe("hiraganaToHangulPronunciation", () => {
  it("converts simple hiragana to Korean pronunciation", () => {
    expect(hiraganaToHangulPronunciation("ゆめならば")).toBe("유메나라바");
  });

  it("handles sokuon, nasal n, and youon", () => {
    expect(hiraganaToHangulPronunciation("まって")).toBe("맛테");
    expect(hiraganaToHangulPronunciation("せんせい")).toBe("센세이");
    expect(hiraganaToHangulPronunciation("しゅくだい")).toBe("슈쿠다이");
  });

  it("normalizes katakana before conversion", () => {
    expect(hiraganaToHangulPronunciation("ゲーム")).toBe("게무");
  });
});
