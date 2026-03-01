import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-utils";
import { authenticateApiKey } from "@/lib/api-auth";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { searchBookmarks, searchParamsSchema } from "@/lib/search";

function toMarkdown(bookmarks: { content: string; authorHandle: string; url: string; createdAt: Date }[]): string {
  return bookmarks
    .map(
      (b) =>
        `## ${b.authorHandle}\n\n${b.content}\n\n[Original](${b.url}) | ${new Date(b.createdAt).toISOString()}\n\n---`,
    )
    .join("\n\n");
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  const userId = await authenticateApiKey(req);
  rateLimit(getRateLimitIdentifier(req, userId));

  const raw: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((value, key) => {
    raw[key] = value;
  });
  const format = raw.format ?? "json";
  delete raw.format;

  const params = searchParamsSchema.parse(raw);
  const result = await searchBookmarks(userId, params);

  if (format === "md") {
    const md = toMarkdown(result.bookmarks);
    return new NextResponse(md, {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }

  return NextResponse.json(result);
});
