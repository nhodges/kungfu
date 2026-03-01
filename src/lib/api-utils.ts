import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";
import { AppError, ValidationError } from "./errors";
import { logger } from "./logger";

type RouteHandler = (
  req: NextRequest,
  context?: { params: Promise<Record<string, string>> },
) => Promise<NextResponse>;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof AppError) {
        logger.warn({ err: error, path: req.nextUrl.pathname }, error.message);
        return NextResponse.json(error.toJSON(), { status: error.statusCode });
      }

      if (error instanceof ZodError) {
        const validationError = new ValidationError("Validation failed", error.issues);
        return NextResponse.json(validationError.toJSON(), { status: 400 });
      }

      logger.error({ err: error, path: req.nextUrl.pathname }, "Unhandled error");
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
        { status: 500 },
      );
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>, params: URLSearchParams): T {
  const raw: Record<string, string> = {};
  params.forEach((value, key) => {
    raw[key] = value;
  });
  return schema.parse(raw);
}

export function validateBody<T>(schema: ZodSchema<T>, body: unknown): T {
  return schema.parse(body);
}
