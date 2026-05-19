import { NextResponse } from "next/server";

import { parseYouTubeUrl } from "../../../../lib/youtube";

interface YouTubeOEmbedResponse {
  title: string;
  author_name?: string;
  thumbnail_url?: string;
}

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const rawUrl = requestUrl.searchParams.get("url") ?? "";
  const parsedUrl = parseYouTubeUrl(rawUrl);

  if (!parsedUrl) {
    return NextResponse.json({ error: "Invalid YouTube URL." }, { status: 400 });
  }

  const oEmbedUrl = new URL("https://www.youtube.com/oembed");
  oEmbedUrl.searchParams.set("url", parsedUrl.canonicalUrl);
  oEmbedUrl.searchParams.set("format", "json");

  const response = await fetch(oEmbedUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return NextResponse.json(
      {
        error: "Could not fetch YouTube metadata.",
        videoId: parsedUrl.videoId,
      },
      { status: response.status },
    );
  }

  const metadata = (await response.json()) as YouTubeOEmbedResponse;

  return NextResponse.json({
    videoId: parsedUrl.videoId,
    youtubeUrl: parsedUrl.canonicalUrl,
    title: metadata.title,
    artist: metadata.author_name ?? null,
    thumbnailUrl: metadata.thumbnail_url ?? null,
  });
}
