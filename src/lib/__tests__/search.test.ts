import { describe, it, expect } from "vitest";
import { searchParamsSchema } from "@/lib/search";

describe("searchParamsSchema", () => {
  it("parses valid search params", () => {
    const result = searchParamsSchema.parse({
      q: "machine learning",
      source: "x",
      limit: "10",
    });
    expect(result.q).toBe("machine learning");
    expect(result.source).toBe("x");
    expect(result.limit).toBe(10);
  });

  it("defaults limit to 20", () => {
    const result = searchParamsSchema.parse({});
    expect(result.limit).toBe(20);
  });

  it("rejects limit over 100", () => {
    expect(() => searchParamsSchema.parse({ limit: "200" })).toThrow();
  });

  it("rejects limit under 1", () => {
    expect(() => searchParamsSchema.parse({ limit: "0" })).toThrow();
  });

  it("accepts all optional params as undefined", () => {
    const result = searchParamsSchema.parse({});
    expect(result.q).toBeUndefined();
    expect(result.source).toBeUndefined();
    expect(result.author).toBeUndefined();
    expect(result.cursor).toBeUndefined();
  });
});
