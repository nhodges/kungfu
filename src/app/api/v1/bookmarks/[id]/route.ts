import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-utils";
import { authenticateApiKey } from "@/lib/api-auth";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest, context) => {
  const userId = await authenticateApiKey(req);
  rateLimit(getRateLimitIdentifier(req, userId));

  const params = await context!.params;
  const bookmark = await prisma.bookmark.findUnique({
    where: { id: params.id },
  });

  if (!bookmark || bookmark.userId !== userId) {
    throw new NotFoundError("Bookmark not found");
  }

  return NextResponse.json({
    id: bookmark.id,
    source: bookmark.source,
    sourceId: bookmark.sourceId,
    url: bookmark.url,
    content: bookmark.content,
    authorName: bookmark.authorName,
    authorHandle: bookmark.authorHandle,
    mediaUrls: bookmark.mediaUrls,
    createdAt: bookmark.createdAt,
    ingestedAt: bookmark.ingestedAt,
  });
});
