import { describe, it, expect, vi, beforeAll, afterAll, afterEach, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { readFileSync } from "fs";
import { join } from "path";
import type { SourceConnection } from "../types";

const FIXTURES = join(process.cwd(), "tests/fixtures/x");
const page1 = JSON.parse(readFileSync(join(FIXTURES, "bookmarks-page-1.json"), "utf-8"));
const page2 = JSON.parse(readFileSync(join(FIXTURES, "bookmarks-page-2.json"), "utf-8"));
const empty = JSON.parse(readFileSync(join(FIXTURES, "bookmarks-empty.json"), "utf-8"));

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeConnection(overrides: Partial<SourceConnection> = {}): SourceConnection {
  // We need to import encrypt dynamically because it depends on env
  return {
    id: "conn_1",
    source: "x",
    sourceUserId: "user_123",
    sourceUsername: "testuser",
    accessToken: "", // will be set in beforeEach
    refreshToken: null,
    tokenExpiresAt: null,
    userId: "user_1",
    ...overrides,
  };
}

describe("XProvider.fetchBookmarks", () => {
  let encrypt: (s: string) => string;

  beforeEach(async () => {
    vi.stubEnv(
      "ENCRYPTION_KEY",
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    );
    vi.stubEnv("X_CLIENT_ID", "test_client_id");
    vi.stubEnv("X_CLIENT_SECRET", "test_client_secret");
    vi.resetModules();
    const crypto = await import("@/lib/crypto");
    encrypt = crypto.encrypt;
  });

  it("fetches and parses a single page of bookmarks", async () => {
    server.use(
      http.get("https://api.x.com/2/users/user_123/bookmarks", () => {
        return HttpResponse.json(page1);
      }),
    );

    const { XProvider } = await import("@/lib/sources/x");
    const provider = new XProvider();
    const conn = makeConnection({ accessToken: encrypt("test-token") });
    const result = await provider.fetchBookmarks(conn);

    expect(result.bookmarks).toHaveLength(2);
    expect(result.nextCursor).toBe("xxxxxxxx");
    expect(result.bookmarks[0].sourceId).toBe("1234567890");
    expect(result.bookmarks[0].authorHandle).toBe("@airesearcher");
    expect(result.bookmarks[0].mediaUrls).toEqual(["https://pbs.twimg.com/media/example.jpg"]);
    expect(result.bookmarks[1].sourceId).toBe("1234567891");
    expect(result.bookmarks[1].mediaUrls).toEqual([]);
  });

  it("fetches second page with cursor", async () => {
    server.use(
      http.get("https://api.x.com/2/users/user_123/bookmarks", ({ request }) => {
        const url = new URL(request.url);
        const cursor = url.searchParams.get("pagination_token");
        if (cursor === "xxxxxxxx") {
          return HttpResponse.json(page2);
        }
        return HttpResponse.json(page1);
      }),
    );

    const { XProvider } = await import("@/lib/sources/x");
    const provider = new XProvider();
    const conn = makeConnection({ accessToken: encrypt("test-token") });
    const result = await provider.fetchBookmarks(conn, "xxxxxxxx");

    expect(result.bookmarks).toHaveLength(1);
    expect(result.nextCursor).toBeNull();
    expect(result.bookmarks[0].authorHandle).toBe("@sysdesign");
  });

  it("handles empty bookmarks response", async () => {
    server.use(
      http.get("https://api.x.com/2/users/user_123/bookmarks", () => {
        return HttpResponse.json(empty);
      }),
    );

    const { XProvider } = await import("@/lib/sources/x");
    const provider = new XProvider();
    const conn = makeConnection({ accessToken: encrypt("test-token") });
    const result = await provider.fetchBookmarks(conn);

    expect(result.bookmarks).toHaveLength(0);
    expect(result.nextCursor).toBeNull();
  });

  it("handles 429 rate limiting", async () => {
    const resetTimestamp = Math.floor(Date.now() / 1000) + 900;
    server.use(
      http.get("https://api.x.com/2/users/user_123/bookmarks", () => {
        return new HttpResponse(null, {
          status: 429,
          headers: { "x-rate-limit-reset": String(resetTimestamp) },
        });
      }),
    );

    const { XProvider } = await import("@/lib/sources/x");
    const provider = new XProvider();
    const conn = makeConnection({ accessToken: encrypt("test-token") });
    const result = await provider.fetchBookmarks(conn, "some_cursor");

    expect(result.rateLimited).toBeDefined();
    expect(result.rateLimited!.resetAt.getTime()).toBeCloseTo(resetTimestamp * 1000, -3);
    expect(result.nextCursor).toBe("some_cursor");
    expect(result.bookmarks).toHaveLength(0);
  });

  it("throws on 401 token expiry", async () => {
    server.use(
      http.get("https://api.x.com/2/users/user_123/bookmarks", () => {
        return new HttpResponse(null, { status: 401 });
      }),
    );

    const { XProvider } = await import("@/lib/sources/x");
    const provider = new XProvider();
    const conn = makeConnection({ accessToken: encrypt("test-token") });

    await expect(provider.fetchBookmarks(conn)).rejects.toThrow("token expired");
  });

  it("throws on 403 permission denied", async () => {
    server.use(
      http.get("https://api.x.com/2/users/user_123/bookmarks", () => {
        return new HttpResponse(null, { status: 403 });
      }),
    );

    const { XProvider } = await import("@/lib/sources/x");
    const provider = new XProvider();
    const conn = makeConnection({ accessToken: encrypt("test-token") });

    await expect(provider.fetchBookmarks(conn)).rejects.toThrow("access denied");
  });

  it("throws on unexpected error status", async () => {
    server.use(
      http.get("https://api.x.com/2/users/user_123/bookmarks", () => {
        return new HttpResponse("Server Error", { status: 500 });
      }),
    );

    const { XProvider } = await import("@/lib/sources/x");
    const provider = new XProvider();
    const conn = makeConnection({ accessToken: encrypt("test-token") });

    await expect(provider.fetchBookmarks(conn)).rejects.toThrow("X API error: 500");
  });
});
