import { PgBoss } from "pg-boss";
import { registerSyncBookmarksHandler } from "./sync-bookmarks";
import { logger } from "@/lib/logger";

let boss: PgBoss | null = null;

export async function getBoss(): Promise<PgBoss> {
  if (boss) return boss;
  boss = new PgBoss(process.env.DATABASE_URL!);
  boss.on("error", (error) => {
    logger.error({ err: error }, "pg-boss error");
  });
  return boss;
}

export async function startWorkers(): Promise<void> {
  const instance = await getBoss();
  await instance.start();
  await registerSyncBookmarksHandler(instance);
  logger.info("pg-boss workers started");
}

export async function stopWorkers(): Promise<void> {
  if (boss) {
    await boss.stop({ graceful: true, timeout: 30000 });
    boss = null;
    logger.info("pg-boss workers stopped");
  }
}
