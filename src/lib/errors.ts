export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}

export class AuthError extends AppError {
  constructor(message = "Authentication required", details?: unknown) {
    super(message, "AUTH_ERROR", 401, details);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied", details?: unknown) {
    super(message, "FORBIDDEN", 403, details);
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details?: unknown) {
    super(message, "NOT_FOUND", 404, details);
    this.name = "NotFoundError";
  }
}

export class ExternalApiError extends AppError {
  constructor(message = "External API error", details?: unknown) {
    super(message, "EXTERNAL_API_ERROR", 502, details);
    this.name = "ExternalApiError";
  }
}

export class RateLimitError extends AppError {
  constructor(
    message = "Rate limit exceeded",
    public readonly retryAfter?: number,
  ) {
    super(message, "RATE_LIMIT_EXCEEDED", 429, { retryAfter });
    this.name = "RateLimitError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict", details?: unknown) {
    super(message, "CONFLICT", 409, details);
    this.name = "ConflictError";
  }
}
