import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { xProvider } from "@/lib/sources/x";
import { withErrorHandler } from "@/lib/api-utils";
import { AuthError } from "@/lib/errors";
import { encrypt } from "@/lib/crypto";
import { cookies } from "next/headers";

export const GET = withErrorHandler(async (req) => {
  const session = await auth();
  if (!session?.user?.id) throw new AuthError();

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/connections/x/callback`;
  const { url, codeVerifier, state } = await xProvider.getAuthUrl(redirectUri);

  const cookieStore = await cookies();
  cookieStore.set("x_oauth_state", encrypt(JSON.stringify({ state, codeVerifier })), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return NextResponse.redirect(url);
});

export const DELETE = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) throw new AuthError();

  const { prisma } = await import("@/lib/db");
  await prisma.sourceConnection.deleteMany({
    where: { userId: session.user.id, source: "x" },
  });

  return NextResponse.json({ success: true });
});
