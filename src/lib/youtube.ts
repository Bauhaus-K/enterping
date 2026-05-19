export interface ParsedYouTubeUrl {
  videoId: string;
  canonicalUrl: string;
}

const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export function parseYouTubeUrl(input: string): ParsedYouTubeUrl | null {
  const trimmedInput = input.trim();

  if (YOUTUBE_ID_PATTERN.test(trimmedInput)) {
    return {
      videoId: trimmedInput,
      canonicalUrl: `https://www.youtube.com/watch?v=${trimmedInput}`,
    };
  }

  try {
    const url = new URL(trimmedInput);
    const host = url.hostname.replace(/^www\./, "");
    let videoId: string | null = null;

    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (host === "youtube.com" || host === "music.youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v");
      } else if (url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/")) {
        videoId = url.pathname.split("/").filter(Boolean)[1] ?? null;
      }
    }

    if (!videoId || !YOUTUBE_ID_PATTERN.test(videoId)) {
      return null;
    }

    return {
      videoId,
      canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  } catch {
    return null;
  }
}
