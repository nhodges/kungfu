import { describe, it, expect } from "vitest";

describe("authenticateApiKey", () => {
  it("module exports authenticateApiKey function", async () => {
    const mod = await import("@/lib/api-auth");
    expect(typeof mod.authenticateApiKey).toBe("function");
  });
});
