import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withErrorHandler } from "@/lib/api-utils";
import { AuthError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/db";

export const DELETE = withErrorHandler(async (_req: NextRequest, context) => {
  const session = await auth();
  if (!session?.user?.id) throw new AuthError();

  const params = await context!.params;
  const key = await prisma.apiKey.findUnique({
    where: { id: params.id },
  });

  if (!key || key.userId !== session.user.id) {
    throw new NotFoundError("API key not found");
  }

  await prisma.apiKey.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
});
