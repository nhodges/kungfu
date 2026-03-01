import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withErrorHandler } from "@/lib/api-utils";
import { AuthError } from "@/lib/errors";
import { searchBookmarks, searchParamsSchema } from "@/lib/search";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) throw new AuthError();

  const raw: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((value, key) => {
    raw[key] = value;
  });
  const params = searchParamsSchema.parse(raw);
  const result = await searchBookmarks(session.user.id, params);

  return NextResponse.json(result);
});
