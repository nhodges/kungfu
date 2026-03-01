import { describe, it, expect } from "vitest";
import {
  AppError,
  AuthError,
  ForbiddenError,
  ValidationError,
  NotFoundError,
  ExternalApiError,
  RateLimitError,
  ConflictError,
} from "@/lib/errors";

describe("AppError", () => {
  it("serializes to JSON with code and message", () => {
    const error = new AppError("Something broke", "CUSTOM_ERROR", 500);
    expect(error.toJSON()).toEqual({
      error: { code: "CUSTOM_ERROR", message: "Something broke" },
    });
  });

  it("includes details when provided", () => {
    const error = new AppError("Bad", "BAD", 400, { field: "email" });
    expect(error.toJSON()).toEqual({
      error: { code: "BAD", message: "Bad", details: { field: "email" } },
    });
  });

  it("is an instance of Error", () => {
    const error = new AppError("test", "TEST", 500);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });
});

describe("error subclasses", () => {
  it("AuthError defaults to 401", () => {
    const error = new AuthError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("AUTH_ERROR");
    expect(error.message).toBe("Authentication required");
  });

  it("ForbiddenError defaults to 403", () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
  });

  it("ValidationError defaults to 400", () => {
    const error = new ValidationError();
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
  });

  it("NotFoundError defaults to 404", () => {
    const error = new NotFoundError();
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
  });

  it("ExternalApiError defaults to 502", () => {
    const error = new ExternalApiError();
    expect(error.statusCode).toBe(502);
    expect(error.code).toBe("EXTERNAL_API_ERROR");
  });

  it("RateLimitError defaults to 429 with retryAfter", () => {
    const error = new RateLimitError("Too many requests", 60);
    expect(error.statusCode).toBe(429);
    expect(error.retryAfter).toBe(60);
    expect(error.toJSON().error.details).toEqual({ retryAfter: 60 });
  });

  it("ConflictError defaults to 409", () => {
    const error = new ConflictError();
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("CONFLICT");
  });

  it("all subclasses are instances of AppError", () => {
    const errors = [
      new AuthError(),
      new ForbiddenError(),
      new ValidationError(),
      new NotFoundError(),
      new ExternalApiError(),
      new RateLimitError(),
      new ConflictError(),
    ];
    for (const error of errors) {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
    }
  });
});
