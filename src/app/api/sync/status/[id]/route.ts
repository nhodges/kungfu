import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withErrorHandler } from "@/lib/api-utils";
import { AuthError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/db";

export const GET = withErrorHandler(async (_req: NextRequest, context) => {
  const session = await auth();
  if (!session?.user?.id) throw new AuthError();

  const params = await context!.params;
  const syncJob = await prisma.syncJob.findUnique({
    where: { id: params.id },
  });

  if (!syncJob || syncJob.userId !== session.user.id) {
    throw new NotFoundError("Sync job not found");
  }

  return NextResponse.json({
    id: syncJob.id,
    source: syncJob.source,
    status: syncJob.status,
    count: syncJob.count,
    error: syncJob.error,
    rateLimitResetAt: syncJob.rateLimitResetAt,
    startedAt: syncJob.startedAt,
    completedAt: syncJob.completedAt,
    createdAt: syncJob.createdAt,
  });
});
