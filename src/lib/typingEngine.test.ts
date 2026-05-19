import {
  getAcceptedInputs,
  InputValidationState,
  TypingInputMode,
  validateInput,
} from "./typingEngine";

describe("validateInput - Romaji to Kana", () => {
  it("matches a simple hiragana phrase", () => {
    const result = validateInput("ゆめならば", "yumenaraba");

    expect(result.state).toBe(InputValidationState.Correct);
    expect(result.matchedInput).toBe("yumenaraba");
  });

  it("returns Incomplete while the input is still a valid prefix", () => {
    const result = validateInput("ゆめならば", "yume");

    expect(result.state).toBe(InputValidationState.Incomplete);
    expect(result.progress).toBeGreaterThan(0);
    expect(result.progress).toBeLessThan(1);
  });

  it("returns Incorrect when the input diverges from every accepted reading", () => {
    const result = validateInput("ゆめならば", "yumes");

    expect(result.state).toBe(InputValidationState.Incorrect);
  });

  it("handles sokuon by requiring a doubled consonant", () => {
    expect(validateInput("まって", "matte").state).toBe(InputValidationState.Correct);
    expect(validateInput("まって", "mat").state).toBe(InputValidationState.Incomplete);
    expect(validateInput("まって", "mate").state).toBe(InputValidationState.Incorrect);
  });

  it("handles sokuon before k sounds", () => {
    expect(validateInput("がっこう", "gakkou").state).toBe(InputValidationState.Correct);
  });

  it("handles sokuon before cha with common romanization variants", () => {
    expect(validateInput("まっちゃ", "matcha").state).toBe(InputValidationState.Correct);
    expect(validateInput("まっちゃ", "maccha").state).toBe(InputValidationState.Correct);
  });

  it("handles youon combinations", () => {
    expect(validateInput("しゅくだい", "shukudai").state).toBe(InputValidationState.Correct);
    expect(validateInput("しゅくだい", "syukudai").state).toBe(InputValidationState.Correct);
    expect(validateInput("りょう", "ryou").state).toBe(InputValidationState.Correct);
  });

  it("handles katakana targets and long vowel marks", () => {
    expect(validateInput("ゲーム", "geemu").state).toBe(InputValidationState.Correct);
    expect(validateInput("ゲーム", "ge-mu").state).toBe(InputValidationState.Correct);
    expect(validateInput("ゲーム", "gemu").state).toBe(InputValidationState.Incorrect);
  });

  it("exposes accepted romaji candidates for debugging and previews", () => {
    const candidates = getAcceptedInputs("きゃりー", TypingInputMode.Romaji);

    expect(candidates).toEqual(expect.arrayContaining(["kyarii", "kyari-"]));
  });
});

describe("validateInput - Hangul to Kana", () => {
  const options = { mode: TypingInputMode.Hangul };

  it("matches a simple hiragana phrase with Korean pronunciation", () => {
    const result = validateInput("ゆめならば", "유메나라바", options);

    expect(result.state).toBe(InputValidationState.Correct);
    expect(result.matchedInput).toBe("유메나라바");
  });

  it("returns Incomplete while Hangul input is still a valid prefix", () => {
    const result = validateInput("ゆめならば", "유메", options);

    expect(result.state).toBe(InputValidationState.Incomplete);
  });

  it("returns Incorrect when Hangul input diverges", () => {
    const result = validateInput("ゆめならば", "유메사", options);

    expect(result.state).toBe(InputValidationState.Incorrect);
  });

  it("handles Hangul sokuon by adding a final consonant to the previous syllable", () => {
    expect(validateInput("まって", "맛테", options).state).toBe(InputValidationState.Correct);
    expect(validateInput("まって", "마테", options).state).toBe(InputValidationState.Incorrect);
  });

  it("handles Hangul youon combinations", () => {
    expect(validateInput("しゅくだい", "슈쿠다이", options).state).toBe(InputValidationState.Correct);
    expect(validateInput("きょ", "쿄", options).state).toBe(InputValidationState.Correct);
    expect(validateInput("ちゃ", "차", options).state).toBe(InputValidationState.Correct);
    expect(validateInput("ちゃ", "챠", options).state).toBe(InputValidationState.Correct);
  });

  it("handles katakana long vowel marks with strict and relaxed Hangul readings", () => {
    expect(validateInput("ゲーム", "게무", options).state).toBe(InputValidationState.Correct);
    expect(validateInput("ゲーム", "게에무", options).state).toBe(InputValidationState.Correct);
    expect(validateInput("ゲーム", "게사", options).state).toBe(InputValidationState.Incorrect);
  });

  it("handles the Japanese nasal ん as a Hangul final consonant", () => {
    expect(validateInput("せんせい", "센세이", options).state).toBe(InputValidationState.Correct);
    expect(validateInput("せんせい", "세응세이", options).state).toBe(InputValidationState.Correct);
  });
});
