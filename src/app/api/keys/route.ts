import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withErrorHandler, validateBody } from "@/lib/api-utils";
import { AuthError } from "@/lib/errors";
import { createApiKey } from "@/lib/api-key";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
});

export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) throw new AuthError();

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, lastUsed: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ keys });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) throw new AuthError();

  const body = await req.json();
  const { name } = validateBody(createKeySchema, body);

  const { rawKey, id } = await createApiKey(session.user.id, name);

  return NextResponse.json({ id, name, key: rawKey }, { status: 201 });
});
