import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rate-limit";
import { RateLimitError } from "@/lib/errors";

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    const id = `test-${Date.now()}-${Math.random()}`;
    for (let i = 0; i < 100; i++) {
      expect(() => rateLimit(id)).not.toThrow();
    }
  });

  it("throws RateLimitError when limit exceeded", () => {
    const id = `test-exceeded-${Date.now()}-${Math.random()}`;
    for (let i = 0; i < 100; i++) {
      rateLimit(id);
    }
    expect(() => rateLimit(id)).toThrow(RateLimitError);
  });

  it("includes retryAfter in error", () => {
    const id = `test-retry-${Date.now()}-${Math.random()}`;
    for (let i = 0; i < 100; i++) {
      rateLimit(id);
    }
    try {
      rateLimit(id);
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      expect((error as RateLimitError).retryAfter).toBeGreaterThan(0);
    }
  });
});
