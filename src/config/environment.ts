import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SOROBAN_RPC_URL: z.string().url(),
  NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE: z.string(),
  NEXT_PUBLIC_STELLAR_HORIZON_URL: z.string().url(),

  NEXT_PUBLIC_PROOFSTELL_CONTRACT_ID: z.string().min(1),
  NEXT_PUBLIC_ISSUER_CONTRACT_ID: z.string().optional(),

  NEXT_PUBLIC_WALLET_PROVIDERS: z.string().optional(),

  NEXT_PUBLIC_API_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_KEY: z.string().optional(),

  NEXT_PUBLIC_APP_ENV: z.enum(["development", "staging", "production"]).optional(),
  NEXT_PUBLIC_LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables at runtime. Returns the parsed env on success,
 * or logs a warning and returns a partial object on failure so the app does NOT
 * crash during server-side rendering or local dev without a full .env file.
 */
export function validateEnv(): Partial<Env> {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    // Surface validation issues without crashing the process
    if (typeof console !== "undefined") {
      console.warn(
        "[env] Environment validation failed. Some features may be unavailable.\n",
        result.error.flatten().fieldErrors,
      );
    }
    // Return whatever was parseable so optional callers still work
    return (process.env as unknown) as Partial<Env>;
  }
  return result.data;
}

/**
 * Lazily-evaluated env singleton. Evaluation is deferred so SSR module
 * initialisation does NOT throw when env vars are missing.
 */
let _env: Partial<Env> | null = null;
export function getEnv(): Partial<Env> {
  if (!_env) _env = validateEnv();
  return _env;
}

// Convenience alias — safe to use anywhere; won't crash on SSR.
export const env = new Proxy({} as Partial<Env>, {
  get(_target, prop) {
    return getEnv()[prop as keyof Env];
  },
});
