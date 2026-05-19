import { ContentCategory } from "@prisma/client";
import { NextResponse } from "next/server";

import { getUgcExplorerContent, type UgcExplorerSort } from "../../../../lib/social";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const category = parseCategory(requestUrl.searchParams.get("category"));
  const sort = parseSort(requestUrl.searchParams.get("sort"));
  const currentUserId = requestUrl.searchParams.get("currentUserId") ?? undefined;
  const content = await getUgcExplorerContent({
    category,
    sort,
    currentUserId,
  });

  return NextResponse.json({ content });
}

function parseCategory(value: string | null): ContentCategory | undefined {
  if (!value) {
    return undefined;
  }

  const normalizedValue = value.toUpperCase();

  if (normalizedValue === ContentCategory.JPOP || normalizedValue === ContentCategory.ANIME) {
    return normalizedValue;
  }

  return undefined;
}

function parseSort(value: string | null): UgcExplorerSort {
  return value === "mostPlayed" ? "mostPlayed" : "newest";
}
