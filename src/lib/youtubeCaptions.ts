import "server-only";

import type { TimedTextLine } from "./typingContentImporter";

interface YouTubePlayerResponse {
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: YouTubeCaptionTrack[];
    };
  };
}

interface YouTubeCaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
  vssId?: string;
  name?: {
    simpleText?: string;
    runs?: Array<{ text?: string }>;
  };
}

interface Json3CaptionResponse {
  events?: Array<{
    tStartMs?: number;
    dDurationMs?: number;
    segs?: Array<{ utf8?: string }>;
  }>;
}

export interface YouTubeCaptionImportResult {
  trackLanguageCode: string;
  trackName: string;
  lines: TimedTextLine[];
}

export async function fetchYouTubeCaptionLines(
  videoId: string,
  preferredLanguageCode = "ja",
): Promise<YouTubeCaptionImportResult> {
  const tracks = await fetchCaptionTracks(videoId);
  const track = chooseCaptionTrack(tracks, preferredLanguageCode);

  if (!track) {
    throw new Error(`No YouTube caption track found for "${preferredLanguageCode}".`);
  }

  const captionUrl = new URL(track.baseUrl);
  captionUrl.searchParams.set("fmt", "json3");

  const response = await fetch(captionUrl, {
    headers: {
      Accept: "application/json,text/plain,*/*",
      "User-Agent": "Mozilla/5.0 Enterping Caption Importer",
    },
  });

  if (!response.ok) {
    throw new Error(`YouTube caption request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as Json3CaptionResponse;
  const lines = parseJson3CaptionLines(payload);

  if (lines.length === 0) {
    throw new Error("The selected YouTube caption track did not contain usable text lines.");
  }

  return {
    trackLanguageCode: track.languageCode,
    trackName: getCaptionTrackName(track),
    lines,
  };
}

async function fetchCaptionTracks(videoId: string): Promise<YouTubeCaptionTrack[]> {
  const watchUrl = new URL("https://www.youtube.com/watch");
  watchUrl.searchParams.set("v", videoId);
  watchUrl.searchParams.set("hl", "ja");

  const response = await fetch(watchUrl, {
    headers: {
      Accept: "text/html",
      "Accept-Language": "ja,en;q=0.8,ko;q=0.7",
      "User-Agent": "Mozilla/5.0 Enterping Caption Importer",
    },
  });

  if (!response.ok) {
    throw new Error(`YouTube watch page request failed with status ${response.status}.`);
  }

  const html = await response.text();
  const playerResponse = extractPlayerResponse(html);
  const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

  if (tracks.length === 0) {
    throw new Error("This YouTube video does not expose caption tracks to the importer.");
  }

  return tracks;
}

function extractPlayerResponse(html: string): YouTubePlayerResponse {
  const marker = "ytInitialPlayerResponse";
  const markerIndex = html.indexOf(marker);

  if (markerIndex === -1) {
    throw new Error("Could not locate YouTube player response.");
  }

  const objectStart = html.indexOf("{", markerIndex);

  if (objectStart === -1) {
    throw new Error("Could not locate YouTube player response body.");
  }

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = objectStart; index < html.length; index += 1) {
    const char = html[index];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (char === "\\") {
      isEscaped = true;
      continue;
    }

    if (char === "\"") {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === "{") {
      depth += 1;
    }

    if (char === "}") {
      depth -= 1;
    }

    if (depth === 0) {
      return JSON.parse(html.slice(objectStart, index + 1)) as YouTubePlayerResponse;
    }
  }

  throw new Error("Could not parse YouTube player response.");
}

function chooseCaptionTrack(
  tracks: YouTubeCaptionTrack[],
  preferredLanguageCode: string,
): YouTubeCaptionTrack | null {
  const normalizedLanguage = preferredLanguageCode.trim().toLowerCase();
  const exact = tracks.find((track) => track.languageCode.toLowerCase() === normalizedLanguage);

  if (exact) {
    return exact;
  }

  const languagePrefix = tracks.find((track) => track.languageCode.toLowerCase().startsWith(normalizedLanguage));

  if (languagePrefix) {
    return languagePrefix;
  }

  const vssMatch = tracks.find((track) => (track.vssId ?? "").toLowerCase().includes(normalizedLanguage));

  if (vssMatch) {
    return vssMatch;
  }

  return tracks.find((track) => track.languageCode.toLowerCase().startsWith("ja")) ?? tracks[0] ?? null;
}

function parseJson3CaptionLines(payload: Json3CaptionResponse): TimedTextLine[] {
  const lines: TimedTextLine[] = [];

  for (const event of payload.events ?? []) {
      const displayText = normalizeCaptionText(
        (event.segs ?? [])
          .map((segment) => segment.utf8 ?? "")
          .join(""),
      );

      if (!displayText || !Number.isFinite(event.tStartMs)) {
        continue;
      }

      const startMs = Math.max(0, Math.round(event.tStartMs ?? 0));
      const durationMs = Number.isFinite(event.dDurationMs) ? Math.max(500, event.dDurationMs ?? 0) : 4500;

      const previousLine = lines[lines.length - 1];

      if (previousLine?.displayText === displayText) {
        continue;
      }

      lines.push({
        startMs,
        endMs: startMs + durationMs,
        displayText,
        typingText: displayText,
      });
  }

  return lines;
}

function normalizeCaptionText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\r?\n/g, " ")
    .replace(/[♪♫♬]/g, "")
    .replace(/^\s*[\[\(【].*?[\]\)】]\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getCaptionTrackName(track: YouTubeCaptionTrack): string {
  return (
    track.name?.simpleText ??
    track.name?.runs
      ?.map((run) => run.text ?? "")
      .join("")
      .trim() ??
    track.languageCode
  );
}
