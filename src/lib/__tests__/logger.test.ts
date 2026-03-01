import { describe, it, expect } from "vitest";
import { logger, createChildLogger } from "@/lib/logger";

describe("logger", () => {
  it("exports a pino logger instance", () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.debug).toBe("function");
  });

  it("creates child loggers with context", () => {
    const child = createChildLogger({ requestId: "abc-123" });
    expect(child).toBeDefined();
    expect(typeof child.info).toBe("function");
  });
});
