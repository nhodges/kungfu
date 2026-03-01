import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { xProvider } from "@/lib/sources/x";
import { withErrorHandler } from "@/lib/api-utils";
import { AuthError, ValidationError } from "@/lib/errors";
import { encrypt, decrypt } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) throw new AuthError();

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code || !state) {
    throw new ValidationError("Missing code or state parameter");
  }

  const cookieStore = await cookies();
  const oauthCookie = cookieStore.get("x_oauth_state");
  if (!oauthCookie) {
    throw new ValidationError("OAuth state cookie missing — try connecting again");
  }

  let storedData: { state: string; codeVerifier: string };
  try {
    storedData = JSON.parse(decrypt(oauthCookie.value));
  } catch {
    throw new ValidationError("Invalid OAuth state cookie");
  }

  if (state !== storedData.state) {
    throw new ValidationError("OAuth state mismatch — possible CSRF attack");
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/connections/x/callback`;
  const result = await xProvider.handleCallback(code, storedData.codeVerifier, redirectUri);

  await prisma.sourceConnection.upsert({
    where: { userId_source: { userId: session.user.id, source: "x" } },
    update: {
      sourceUserId: result.sourceUserId,
      sourceUsername: result.sourceUsername,
      accessToken: encrypt(result.accessToken),
      refreshToken: result.refreshToken ? encrypt(result.refreshToken) : null,
      tokenExpiresAt: result.expiresAt,
    },
    create: {
      userId: session.user.id,
      source: "x",
      sourceUserId: result.sourceUserId,
      sourceUsername: result.sourceUsername,
      accessToken: encrypt(result.accessToken),
      refreshToken: result.refreshToken ? encrypt(result.refreshToken) : null,
      tokenExpiresAt: result.expiresAt,
    },
  });

  // Clear the OAuth cookie
  cookieStore.delete("x_oauth_state");

  return NextResponse.redirect(`${baseUrl}/settings?connected=x`);
});
