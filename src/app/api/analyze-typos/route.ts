import { NextResponse } from "next/server";

import {
  formatTypoAnalysisUserPrompt,
  JAPANESE_TUTOR_SYSTEM_PROMPT,
  normalizeAiErrorFeedback,
  type AiErrorFeedback,
  type TypingAnalysisTypoLog,
} from "../../../lib/aiAnalysisPrompt";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";

interface AnalyzeTyposRequestBody {
  userId?: unknown;
  typoLogs?: unknown;
  provider?: unknown;
}

const FEEDBACK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    weakness: {
      type: "string",
      description: "Short Korean phrase explaining the learner's main weak point.",
    },
    tip: {
      type: "string",
      description: "One practical Korean tip or drill for improvement.",
    },
    encouragement: {
      type: "string",
      description: "Short motivating Korean message.",
    },
    trainingRecommendations: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      description: "Japanese pronunciation-pattern drills based on the learner's typo logs.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          patternId: {
            type: "string",
            enum: ["sokuon", "shi-chi-tsu", "long-vowel", "youon", "kana-romaji"],
          },
          label: {
            type: "string",
          },
          count: {
            type: "integer",
            minimum: 0,
          },
          severity: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
          focusKana: {
            type: "array",
            items: {
              type: "string",
            },
          },
          reason: {
            type: "string",
          },
          drill: {
            type: "string",
          },
          samplePrompts: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
        required: ["patternId", "label", "count", "severity", "focusKana", "reason", "drill", "samplePrompts"],
      },
    },
  },
  required: ["weakness", "tip", "encouragement", "trainingRecommendations"],
} as const;

export async function POST(request: Request) {
  const body = (await request.json()) as AnalyzeTyposRequestBody;
  const userId = typeof body.userId === "string" ? body.userId : undefined;
  const typoLogs = Array.isArray(body.typoLogs)
    ? (body.typoLogs as TypingAnalysisTypoLog[])
    : userId
      ? await getRecentTypoLogs(userId)
      : [];

  if (typoLogs.length === 0) {
    return NextResponse.json({ error: "No TypoLog data was provided or found." }, { status: 400 });
  }

  const systemPrompt = JAPANESE_TUTOR_SYSTEM_PROMPT;
  const userPrompt = formatTypoAnalysisUserPrompt(typoLogs);
  const provider = typeof body.provider === "string" ? body.provider : undefined;

  try {
    const feedback = await requestAiFeedback({
      systemPrompt,
      userPrompt,
      provider,
    });

    return NextResponse.json({
      feedback,
      analyzedTypoCount: typoLogs.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "AI typo analysis failed.",
      },
      { status: 500 },
    );
  }
}

async function getRecentTypoLogs(userId: string): Promise<TypingAnalysisTypoLog[]> {
  return prisma.typoLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      lyricSync: {
        select: {
          japaneseText: true,
          romajiText: true,
          koreanPronunciationText: true,
          lineIndex: true,
          content: {
            select: {
              title: true,
              artist: true,
            },
          },
        },
      },
    },
  });
}

async function requestAiFeedback({
  systemPrompt,
  userPrompt,
  provider,
}: {
  systemPrompt: string;
  userPrompt: string;
  provider?: string;
}): Promise<AiErrorFeedback> {
  if (provider === "azure" || (!provider && process.env.AZURE_OPENAI_API_KEY)) {
    return requestAzureOpenAiFeedback({ systemPrompt, userPrompt });
  }

  if (provider === "openai" || (!provider && process.env.OPENAI_API_KEY)) {
    return requestOpenAiFeedback({ systemPrompt, userPrompt });
  }

  throw new Error(
    "Missing LLM credentials. Set OPENAI_API_KEY or AZURE_OPENAI_API_KEY/AZURE_OPENAI_ENDPOINT/AZURE_OPENAI_DEPLOYMENT.",
  );
}

async function requestOpenAiFeedback({
  systemPrompt,
  userPrompt,
}: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<AiErrorFeedback> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "enterping_typo_feedback",
          strict: true,
          schema: FEEDBACK_SCHEMA,
        },
      },
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as unknown;
  return parseFeedbackJson(extractOpenAiOutputText(data));
}

async function requestAzureOpenAiFeedback({
  systemPrompt,
  userPrompt,
}: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<AiErrorFeedback> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, "");
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2024-10-21";

  if (!endpoint || !apiKey || !deployment) {
    throw new Error("Azure OpenAI is missing endpoint, api key, or deployment env vars.");
  }

  const response = await fetch(
    `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`,
    {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "enterping_typo_feedback",
            strict: true,
            schema: FEEDBACK_SCHEMA,
          },
        },
        temperature: 0.2,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Azure OpenAI request failed with status ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Azure OpenAI response did not include message content.");
  }

  return parseFeedbackJson(content);
}

function parseFeedbackJson(text: string): AiErrorFeedback {
  try {
    return normalizeAiErrorFeedback(JSON.parse(text));
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Could not parse AI feedback JSON: ${error.message}`
        : "Could not parse AI feedback JSON.",
    );
  }
}

function extractOpenAiOutputText(data: unknown): string {
  if (data && typeof data === "object" && "output_text" in data) {
    const outputText = (data as { output_text?: unknown }).output_text;

    if (typeof outputText === "string") {
      return outputText;
    }
  }

  const output = data && typeof data === "object" ? (data as { output?: unknown }).output : undefined;

  if (Array.isArray(output)) {
    for (const item of output) {
      if (!item || typeof item !== "object") {
        continue;
      }

      const content = (item as { content?: unknown }).content;

      if (!Array.isArray(content)) {
        continue;
      }

      for (const part of content) {
        if (!part || typeof part !== "object") {
          continue;
        }

        const text = (part as { text?: unknown }).text;

        if (typeof text === "string") {
          return text;
        }
      }
    }
  }

  throw new Error("OpenAI response did not include output text.");
}
