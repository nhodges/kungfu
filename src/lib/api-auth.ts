import { NextRequest } from "next/server";
import { validateApiKey } from "./api-key";
import { AuthError } from "./errors";

export async function authenticateApiKey(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    throw new AuthError("Missing Authorization header");
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw new AuthError("Invalid Authorization header format. Expected: Bearer kf_...");
  }

  const rawKey = parts[1];
  if (!rawKey.startsWith("kf_")) {
    throw new AuthError("Invalid API key format");
  }

  const userId = await validateApiKey(rawKey);
  if (!userId) {
    throw new AuthError("Invalid or revoked API key");
  }

  return userId;
}
