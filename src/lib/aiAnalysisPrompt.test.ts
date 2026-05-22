import {
  buildTypingAnalysisPrompt,
  formatTypoAnalysisUserPrompt,
  getPronunciationTrainingRecommendations,
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
            japaneseText: "\u307e\u3063\u3066",
            romajiText: "matte",
            koreanPronunciationText: "\ub9db\ud14c",
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
    expect(prompt).toContain("Precomputed pronunciation diagnostics");
    expect(prompt).toContain("trainingRecommendations");
  });
});

describe("getTopTypoPatterns", () => {
  it("summarizes the top Japanese typo patterns", () => {
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
      expect.arrayContaining([
        "\ucd09\uc74c(\u3063) \uc785\ub825 \ud0c0\uc774\ubc0d",
        "\u3057/\u3061/\u3064 \uacc4\uc5f4 \uad6c\ubd84",
      ]),
    );
  });

  it("generates pronunciation-pattern training recommendations", () => {
    const recommendations = getPronunciationTrainingRecommendations([
      {
        id: "1",
        targetCharacter: "t",
        inputtedCharacter: "r",
        contextualPreviousWord: "ma",
        createdAt: new Date(),
        lyricSync: {
          japaneseText: "\u307e\u3063\u3066",
          romajiText: "matte",
        },
      },
      {
        id: "2",
        targetCharacter: "u",
        inputtedCharacter: "i",
        contextualPreviousWord: "ts",
        createdAt: new Date(),
        lyricSync: {
          japaneseText: "\u3064\u3088\u304f",
          romajiText: "tsuyoku",
        },
      },
      {
        id: "3",
        targetCharacter: "o",
        inputtedCharacter: "p",
        contextualPreviousWord: "ry",
        createdAt: new Date(),
        lyricSync: {
          japaneseText: "\u308a\u3087",
          romajiText: "ryo",
        },
      },
      {
        id: "4",
        targetCharacter: "u",
        inputtedCharacter: "i",
        contextualPreviousWord: "ko",
        createdAt: new Date(),
        lyricSync: {
          japaneseText: "\u3053\u3046",
          romajiText: "kou",
        },
      },
    ]);

    expect(recommendations.map((recommendation) => recommendation.patternId)).toEqual(
      expect.arrayContaining(["sokuon", "shi-chi-tsu", "youon", "long-vowel"]),
    );
    expect(recommendations[0]).toHaveProperty("drill");
    expect(recommendations[0].samplePrompts.length).toBeGreaterThan(0);
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

    expect(prompt).toContain("Top missed characters/patterns");
    expect(prompt).toContain("Recommended pronunciation-pattern drills");
    expect(prompt).toContain("weakness");
    expect(prompt).toContain("sokuon");
  });
});

describe("normalizeAiErrorFeedback", () => {
  it("accepts enhanced AI feedback JSON shape", () => {
    expect(
      normalizeAiErrorFeedback({
        weakness: "\ucd09\uc74c(\u3063) \uc785\ub825 \ud0c0\uc774\ubc0d",
        tip: "\ub2e4\uc74c \uc790\uc74c\uc744 \ud55c \ubc88 \ub354 \uc785\ub825\ud558\uc138\uc694.",
        encouragement: "\uc88b\uc740 \ub9ac\ub4ec\uc774\uc5d0\uc694.",
        trainingRecommendations: [
          {
            patternId: "sokuon",
            label: "\ucd09\uc74c(\u3063) \uc785\ub825 \ud0c0\uc774\ubc0d",
            count: 3,
            severity: "medium",
            focusKana: ["\u3063"],
            reason: "\uc790\uc74c \ubc18\ubcf5 \ud0c0\uc774\ubc0d\uc774 \ud754\ub4e4\ub9bd\ub2c8\ub2e4.",
            drill: "matte, kitto\ub97c \ub290\ub9ac\uac8c \ubc18\ubcf5\ud558\uc138\uc694.",
            samplePrompts: ["\u307e\u3063\u3066 / matte"],
          },
        ],
      }),
    ).toEqual({
      weakness: "\ucd09\uc74c(\u3063) \uc785\ub825 \ud0c0\uc774\ubc0d",
      tip: "\ub2e4\uc74c \uc790\uc74c\uc744 \ud55c \ubc88 \ub354 \uc785\ub825\ud558\uc138\uc694.",
      encouragement: "\uc88b\uc740 \ub9ac\ub4ec\uc774\uc5d0\uc694.",
      trainingRecommendations: [
        {
          patternId: "sokuon",
          label: "\ucd09\uc74c(\u3063) \uc785\ub825 \ud0c0\uc774\ubc0d",
          count: 3,
          severity: "medium",
          focusKana: ["\u3063"],
          reason: "\uc790\uc74c \ubc18\ubcf5 \ud0c0\uc774\ubc0d\uc774 \ud754\ub4e4\ub9bd\ub2c8\ub2e4.",
          drill: "matte, kitto\ub97c \ub290\ub9ac\uac8c \ubc18\ubcf5\ud558\uc138\uc694.",
          samplePrompts: ["\u307e\u3063\u3066 / matte"],
        },
      ],
    });
  });

  it("keeps backwards compatibility with the previous feedback shape", () => {
    expect(
      normalizeAiErrorFeedback({
        weakness: "\ucd09\uc74c(\u3063) \uc785\ub825 \ud0c0\uc774\ubc0d",
        tip: "\ub2e4\uc74c \uc790\uc74c\uc744 \ud55c \ubc88 \ub354 \uc785\ub825\ud558\uc138\uc694.",
        encouragement: "\uc88b\uc740 \ub9ac\ub4ec\uc774\uc5d0\uc694.",
      }),
    ).toMatchObject({
      trainingRecommendations: [],
    });
  });

  it("rejects malformed feedback", () => {
    expect(() => normalizeAiErrorFeedback({ weakness: "missing fields" })).toThrow(
      "expected JSON shape",
    );
  });
});
