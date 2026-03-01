import { randomBytes, createHash } from "crypto";
import { prisma } from "./db";

const PREFIX = "kf_";
const RAW_KEY_LENGTH = 32;

export function generateApiKey(): string {
  const raw = randomBytes(RAW_KEY_LENGTH).toString("hex");
  return `${PREFIX}${raw}`;
}

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export async function validateApiKey(rawKey: string): Promise<string | null> {
  if (!rawKey.startsWith(PREFIX)) return null;

  const hash = hashApiKey(rawKey);
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
  });

  if (!apiKey) return null;

  // Update lastUsed asynchronously (don't block the request)
  prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsed: new Date() },
  }).catch(() => {});

  return apiKey.userId;
}

export async function createApiKey(
  userId: string,
  name: string,
): Promise<{ rawKey: string; id: string }> {
  const rawKey = generateApiKey();
  const keyHash = hashApiKey(rawKey);

  const apiKey = await prisma.apiKey.create({
    data: { keyHash, name, userId },
  });

  return { rawKey, id: apiKey.id };
}
