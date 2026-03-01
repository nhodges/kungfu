import { describe, it, expect } from "vitest";
import { generateApiKey, hashApiKey } from "@/lib/api-key";

describe("api-key", () => {
  it("generates keys with kf_ prefix", () => {
    const key = generateApiKey();
    expect(key.startsWith("kf_")).toBe(true);
    expect(key.length).toBeGreaterThan(10);
  });

  it("generates unique keys each time", () => {
    const keys = new Set(Array.from({ length: 10 }, () => generateApiKey()));
    expect(keys.size).toBe(10);
  });

  it("produces consistent hash for same key", () => {
    const key = generateApiKey();
    const h1 = hashApiKey(key);
    const h2 = hashApiKey(key);
    expect(h1).toBe(h2);
  });

  it("produces different hashes for different keys", () => {
    const k1 = generateApiKey();
    const k2 = generateApiKey();
    expect(hashApiKey(k1)).not.toBe(hashApiKey(k2));
  });

  it("hash is a 64-char hex string (SHA-256)", () => {
    const key = generateApiKey();
    const hash = hashApiKey(key);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
