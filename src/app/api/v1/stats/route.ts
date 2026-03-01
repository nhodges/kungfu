import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-utils";
import { authenticateApiKey } from "@/lib/api-auth";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const userId = await authenticateApiKey(req);
  rateLimit(getRateLimitIdentifier(req, userId));

  const [totalCount, sourceCounts, topAuthors] = await Promise.all([
    prisma.bookmark.count({ where: { userId } }),
    prisma.bookmark.groupBy({
      by: ["source"],
      where: { userId },
      _count: true,
    }),
    prisma.bookmark.groupBy({
      by: ["authorHandle"],
      where: { userId },
      _count: true,
      orderBy: { _count: { authorHandle: "desc" } },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    total: totalCount,
    bySources: sourceCounts.map((s) => ({ source: s.source, count: s._count })),
    topAuthors: topAuthors.map((a) => ({ handle: a.authorHandle, count: a._count })),
  });
});
