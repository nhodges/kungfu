import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  ENCRYPTION_KEY: z
    .string()
    .length(64, "ENCRYPTION_KEY must be a 64-character hex string")
    .regex(/^[0-9a-f]+$/i, "ENCRYPTION_KEY must be a hex string"),
  X_CLIENT_ID: z.string().min(1, "X_CLIENT_ID is required"),
  X_CLIENT_SECRET: z.string().min(1, "X_CLIENT_SECRET is required"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Environment validation failed:\n${formatted}`);
  }

  return result.data;
}

let _env: Env | null = null;

export function env(): Env {
  if (!_env) {
    _env = validateEnv();
  }
  return _env;
}
