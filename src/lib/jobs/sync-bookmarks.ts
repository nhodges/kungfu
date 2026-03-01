import type { PgBoss } from "pg-boss";
import { prisma } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/crypto";
import { XProvider } from "@/lib/sources/x";
import { ExternalApiError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { SourceConnection as SourceConnectionType } from "@/lib/sources/types";

export const SYNC_BOOKMARKS_QUEUE = "sync-bookmarks";

interface SyncBookmarksData {
  syncJobId: string;
  userId: string;
  source: string;
  cursor?: string;
}

function getProvider(source: string) {
  switch (source) {
    case "x":
      return new XProvider();
    default:
      throw new Error(`Unknown source: ${source}`);
  }
}

export async function registerSyncBookmarksHandler(boss: PgBoss) {
  await boss.work<SyncBookmarksData>(SYNC_BOOKMARKS_QUEUE, { batchSize: 1 }, async ([job]) => {
    await handleSyncBookmarks(boss, job.data);
  });
  logger.info("Registered sync-bookmarks job handler");
}

async function handleSyncBookmarks(boss: PgBoss, data: SyncBookmarksData) {
  const log = logger.child({ syncJobId: data.syncJobId, userId: data.userId, source: data.source });

  const syncJob = await prisma.syncJob.findUnique({ where: { id: data.syncJobId } });
  if (!syncJob || syncJob.status === "completed" || syncJob.status === "failed") {
    log.warn("Sync job not found or already finished, skipping");
    return;
  }

  const connection = await prisma.sourceConnection.findUnique({
    where: { userId_source: { userId: data.userId, source: data.source } },
  });

  if (!connection) {
    await prisma.syncJob.update({
      where: { id: data.syncJobId },
      data: { status: "failed", error: "Source connection not found" },
    });
    log.error("Source connection not found");
    return;
  }

  // Mark as running
  await prisma.syncJob.update({
    where: { id: data.syncJobId },
    data: { status: "running", startedAt: syncJob.startedAt ?? new Date() },
  });

  const provider = getProvider(data.source);
  const cursor = data.cursor ?? syncJob.cursor ?? undefined;

  try {
    const result = await provider.fetchBookmarks(
      connection as unknown as SourceConnectionType,
      cursor,
    );

    // Handle rate limiting
    if (result.rateLimited) {
      const delayMs = result.rateLimited.resetAt.getTime() - Date.now();
      const delaySec = Math.max(Math.ceil(delayMs / 1000), 60);

      await prisma.syncJob.update({
        where: { id: data.syncJobId },
        data: {
          status: "running",
          cursor: result.nextCursor,
          rateLimitResetAt: result.rateLimited.resetAt,
        },
      });

      // Re-enqueue with delay
      await boss.send(SYNC_BOOKMARKS_QUEUE, {
        ...data,
        cursor: result.nextCursor ?? cursor,
      }, {
        singletonKey: `${data.userId}-${data.source}`,
        startAfter: delaySec,
      });

      log.info({ delaySec, resetAt: result.rateLimited.resetAt }, "Rate limited, re-enqueued");
      return;
    }

    // Store bookmarks
    if (result.bookmarks.length > 0) {
      await prisma.bookmark.createMany({
        data: result.bookmarks.map((b) => ({
          source: data.source,
          sourceId: b.sourceId,
          url: b.url,
          content: b.content,
          authorName: b.authorName,
          authorHandle: b.authorHandle,
          mediaUrls: b.mediaUrls,
          metadata: b.metadata as Record<string, string>,
          userId: data.userId,
          createdAt: b.createdAt,
        })),
        skipDuplicates: true,
      });
    }

    const newCount = syncJob.count + result.bookmarks.length;

    // More pages?
    if (result.nextCursor) {
      await prisma.syncJob.update({
        where: { id: data.syncJobId },
        data: { cursor: result.nextCursor, count: newCount, rateLimitResetAt: null },
      });

      // Continue to next page
      await boss.send(SYNC_BOOKMARKS_QUEUE, {
        ...data,
        cursor: result.nextCursor,
      }, {
        singletonKey: `${data.userId}-${data.source}`,
      });

      log.info({ count: newCount, nextCursor: result.nextCursor }, "Page processed, continuing");
    } else {
      // Done!
      await prisma.syncJob.update({
        where: { id: data.syncJobId },
        data: {
          status: "completed",
          count: newCount,
          cursor: null,
          rateLimitResetAt: null,
          completedAt: new Date(),
        },
      });
      log.info({ totalCount: newCount }, "Sync completed");
    }
  } catch (error) {
    // Handle token expiry — try refresh once
    if (error instanceof ExternalApiError && (error.details as Record<string, unknown>)?.needsRefresh) {
      try {
        log.info("Token expired, attempting refresh");
        const newTokens = await provider.refreshToken(connection as unknown as SourceConnectionType);
        await prisma.sourceConnection.update({
          where: { id: connection.id },
          data: {
            accessToken: encrypt(newTokens.accessToken),
            refreshToken: newTokens.refreshToken ? encrypt(newTokens.refreshToken) : null,
            tokenExpiresAt: newTokens.expiresAt,
          },
        });

        // Re-enqueue to retry with new token
        await boss.send(SYNC_BOOKMARKS_QUEUE, data, {
          singletonKey: `${data.userId}-${data.source}`,
          startAfter: 5,
        });
        log.info("Token refreshed, re-enqueued");
        return;
      } catch (refreshError) {
        log.error({ err: refreshError }, "Token refresh failed");
      }
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    await prisma.syncJob.update({
      where: { id: data.syncJobId },
      data: { status: "failed", error: errorMessage },
    });
    log.error({ err: error }, "Sync job failed");
  }
}

export async function enqueueSyncJob(
  userId: string,
  source: string,
): Promise<string> {
  const { getBoss } = await import("@/lib/jobs");

  // Check for existing running sync
  const existing = await prisma.syncJob.findFirst({
    where: {
      userId,
      source,
      status: { in: ["pending", "running"] },
    },
  });

  if (existing) {
    throw new Error("SYNC_ALREADY_RUNNING");
  }

  const syncJob = await prisma.syncJob.create({
    data: { userId, source, status: "pending" },
  });

  const boss = await getBoss();
  await boss.send(SYNC_BOOKMARKS_QUEUE, {
    syncJobId: syncJob.id,
    userId,
    source,
  } satisfies SyncBookmarksData, {
    singletonKey: `${userId}-${source}`,
  });

  return syncJob.id;
}
