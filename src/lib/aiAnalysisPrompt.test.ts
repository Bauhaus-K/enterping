import {
  buildTypingAnalysisPrompt,
  formatTypoAnalysisUserPrompt,
  getTopTypoPatterns,
  normalizeAiErrorFeedback,
} from "./aiAnalysisPrompt";

describe("buildTypingAnalysisPrompt", () => {
  it("formats recent typo logs into an LLM-ready coaching prompt", () => {
    const prompt = buildTypingAnalysisPrompt({
      userId: "user-1",
      username: "miku-fan",
      typoLogs: [
        {
          id: "typo-1",
          targetCharacter: "t",
          inputtedCharacter: "r",
          contextualPreviousWord: "ma",
          createdAt: new Date("2026-04-30T00:00:00.000Z"),
          lyricSync: {
            japaneseText: "まって",
            romajiText: "matte",
            koreanPronunciationText: "맛테",
            content: {
              title: "Mock Song",
              artist: "Mock Artist",
            },
          },
        },
        {
          id: "typo-2",
          targetCharacter: "t",
          inputtedCharacter: "r",
          contextualPreviousWord: "ma",
          createdAt: new Date("2026-04-30T00:01:00.000Z"),
        },
      ],
    });

    expect(prompt).toContain("Enterping's Japanese typing coach");
    expect(prompt).toContain('"analyzedTypoCount": 2');
    expect(prompt).toContain('"value": "t"');
    expect(prompt).toContain('"value": "t -> r"');
    expect(prompt).toContain("Practice drills");
  });
});

describe("getTopTypoPatterns", () => {
  it("summarizes the top three Japanese typo patterns", () => {
    const patterns = getTopTypoPatterns(
      [
        {
          id: "1",
          targetCharacter: "t",
          inputtedCharacter: "r",
          contextualPreviousWord: "ma",
          createdAt: new Date(),
          lyricSync: {
            japaneseText: "\u307e\u3063\u3066",
            romajiText: "matte",
            koreanPronunciationText: "\ub9db\ud14c",
          },
        },
        {
          id: "2",
          targetCharacter: "u",
          inputtedCharacter: "i",
          contextualPreviousWord: "ts",
          createdAt: new Date(),
          lyricSync: {
            japaneseText: "\u3064",
            romajiText: "tsu",
            koreanPronunciationText: "\uce20",
          },
        },
        {
          id: "3",
          targetCharacter: "c",
          inputtedCharacter: "x",
          contextualPreviousWord: "",
          createdAt: new Date(),
          lyricSync: {
            japaneseText: "\u3061",
            romajiText: "chi",
            koreanPronunciationText: "\uce58",
          },
        },
      ],
      3,
    );

    expect(patterns.map((pattern) => pattern.label)).toEqual(
      expect.arrayContaining(["sokuon (\u3063) timing", "tsu (\u3064)", "chi (\u3061)"]),
    );
  });

  it("formats a compact user prompt for the LLM", () => {
    const prompt = formatTypoAnalysisUserPrompt([
      {
        id: "1",
        targetCharacter: "t",
        inputtedCharacter: "r",
        createdAt: new Date(),
        lyricSync: {
          japaneseText: "\u307e\u3063\u3066",
          romajiText: "matte",
        },
      },
    ]);

    expect(prompt).toContain("Top 3 missed characters/patterns");
    expect(prompt).toContain("weakness");
    expect(prompt).toContain("sokuon");
  });
});

describe("normalizeAiErrorFeedback", () => {
  it("accepts the expected AI feedback JSON shape", () => {
    expect(
      normalizeAiErrorFeedback({
        weakness: "\ucd09\uc74c(\u3063) \uc785\ub825 \ud0c0\uc774\ubc0d",
        tip: "\ub2e4\uc74c \uc790\uc74c\uc744 \ud55c \ubc88 \ub354 \uc785\ub825\ud558\uc138\uc694.",
        encouragement: "\uc88b\uc740 \ub9ac\ub4ec\uc774\uc5d0\uc694.",
      }),
    ).toEqual({
      weakness: "\ucd09\uc74c(\u3063) \uc785\ub825 \ud0c0\uc774\ubc0d",
      tip: "\ub2e4\uc74c \uc790\uc74c\uc744 \ud55c \ubc88 \ub354 \uc785\ub825\ud558\uc138\uc694.",
      encouragement: "\uc88b\uc740 \ub9ac\ub4ec\uc774\uc5d0\uc694.",
    });
  });

  it("rejects malformed feedback", () => {
    expect(() => normalizeAiErrorFeedback({ weakness: "missing fields" })).toThrow(
      "expected JSON shape",
    );
  });
});
