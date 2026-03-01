import { describe, it, expect, vi, beforeEach } from "vitest";

describe("env validation", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("throws on missing required vars", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const { env } = await import("@/lib/env");
    expect(() => env()).toThrow("Environment validation failed");
  });

  it("throws on invalid ENCRYPTION_KEY length", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");
    vi.stubEnv("NEXTAUTH_SECRET", "secret");
    vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("ENCRYPTION_KEY", "too-short");
    vi.stubEnv("X_CLIENT_ID", "id");
    vi.stubEnv("X_CLIENT_SECRET", "secret");
    const { env } = await import("@/lib/env");
    expect(() => env()).toThrow("Environment validation failed");
  });

  it("parses valid env successfully", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");
    vi.stubEnv("NEXTAUTH_SECRET", "secret");
    vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv(
      "ENCRYPTION_KEY",
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    );
    vi.stubEnv("X_CLIENT_ID", "id");
    vi.stubEnv("X_CLIENT_SECRET", "secret");
    vi.stubEnv("LOG_LEVEL", "debug");
    const { env } = await import("@/lib/env");
    const result = env();
    expect(result.DATABASE_URL).toBe("postgresql://localhost:5432/test");
    expect(result.LOG_LEVEL).toBe("debug");
  });

  it("defaults LOG_LEVEL to info", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");
    vi.stubEnv("NEXTAUTH_SECRET", "secret");
    vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv(
      "ENCRYPTION_KEY",
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    );
    vi.stubEnv("X_CLIENT_ID", "id");
    vi.stubEnv("X_CLIENT_SECRET", "secret");
    delete process.env.LOG_LEVEL;
    const { env } = await import("@/lib/env");
    const result = env();
    expect(result.LOG_LEVEL).toBe("info");
  });
});
