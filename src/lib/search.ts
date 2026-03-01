import { z } from "zod";
import { prisma } from "./db";
import { Prisma } from "@prisma/client";

export const searchParamsSchema = z.object({
  q: z.string().optional(),
  source: z.string().optional(),
  author: z.string().optional(),
  after: z.string().datetime({ offset: true }).optional(),
  before: z.string().datetime({ offset: true }).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

export interface SearchResult {
  id: string;
  source: string;
  sourceId: string;
  url: string;
  content: string;
  authorName: string;
  authorHandle: string;
  mediaUrls: string[];
  createdAt: Date;
  ingestedAt: Date;
  rank?: number;
}

export interface SearchResponse {
  bookmarks: SearchResult[];
  nextCursor: string | null;
  total?: number;
}

export async function searchBookmarks(
  userId: string,
  params: SearchParams,
): Promise<SearchResponse> {
  const conditions: string[] = [`b."userId" = $1`];
  const values: unknown[] = [userId];
  let paramIndex = 2;

  let orderBy = `b."createdAt" DESC, b."id" DESC`;
  let selectRank = "";

  // Full-text search
  if (params.q) {
    const tsQuery = params.q
      .trim()
      .split(/\s+/)
      .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
      .filter(Boolean)
      .join(" & ");

    if (tsQuery) {
      conditions.push(`b."searchVector" @@ to_tsquery('english', $${paramIndex})`);
      selectRank = `, ts_rank(b."searchVector", to_tsquery('english', $${paramIndex})) as rank`;
      orderBy = `rank DESC, b."createdAt" DESC, b."id" DESC`;
      values.push(tsQuery);
      paramIndex++;
    }
  }

  // Source filter
  if (params.source) {
    conditions.push(`b."source" = $${paramIndex}`);
    values.push(params.source);
    paramIndex++;
  }

  // Author filter
  if (params.author) {
    conditions.push(`b."authorHandle" = $${paramIndex}`);
    values.push(params.author);
    paramIndex++;
  }

  // Date range
  if (params.after) {
    conditions.push(`b."createdAt" >= $${paramIndex}`);
    values.push(new Date(params.after));
    paramIndex++;
  }
  if (params.before) {
    conditions.push(`b."createdAt" <= $${paramIndex}`);
    values.push(new Date(params.before));
    paramIndex++;
  }

  // Cursor pagination (createdAt, id)
  if (params.cursor) {
    const [cursorDate, cursorId] = params.cursor.split("_");
    if (cursorDate && cursorId) {
      conditions.push(
        `(b."createdAt", b."id") < ($${paramIndex}, $${paramIndex + 1})`,
      );
      values.push(new Date(cursorDate), cursorId);
      paramIndex += 2;
    }
  }

  const whereClause = conditions.join(" AND ");
  const limit = params.limit + 1; // Fetch one extra to check if there's a next page
  values.push(limit);

  const query = `
    SELECT
      b."id", b."source", b."sourceId", b."url", b."content",
      b."authorName", b."authorHandle", b."mediaUrls",
      b."createdAt", b."ingestedAt"
      ${selectRank}
    FROM "Bookmark" b
    WHERE ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${paramIndex}
  `;

  const rows = await prisma.$queryRawUnsafe<SearchResult[]>(query, ...values);

  let nextCursor: string | null = null;
  if (rows.length > params.limit) {
    rows.pop();
    const last = rows[rows.length - 1];
    nextCursor = `${last.createdAt.toISOString()}_${last.id}`;
  }

  return { bookmarks: rows, nextCursor };
}
