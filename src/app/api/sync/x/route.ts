import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withErrorHandler } from "@/lib/api-utils";
import { AuthError, ConflictError } from "@/lib/errors";
import { enqueueSyncJob } from "@/lib/jobs/sync-bookmarks";

export const POST = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) throw new AuthError();

  try {
    const syncJobId = await enqueueSyncJob(session.user.id, "x");
    return NextResponse.json({ syncJobId }, { status: 202 });
  } catch (error) {
    if (error instanceof Error && error.message === "SYNC_ALREADY_RUNNING") {
      throw new ConflictError("A sync is already in progress for this source");
    }
    throw error;
  }
});
