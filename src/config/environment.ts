/**
 * Environment configuration module.
 *
 * Provides two modes:
 *
 *  • Runtime / development  (validateEnv)
 *    — Soft validation: logs warnings but never crashes the server.
 *      This lets the dev server start even with missing vars so the
 *      developer sees the warning in the console rather than a hard crash.
 *
 *  • Build-time  (validateEnvStrict)
 *    — Hard validation: throws an Error if any required variable is
 *      missing or malformed. Called from next.config.ts so that
 *      `next build` fails immediately with a clear message.
 *
 * The `env` proxy gives type-safe access to all config values at runtime.
 */

import { z } from "zod";

// ─── Zod schema ────────────────────────────────────────────────────────────

const envSchema = z.object({
  // ── Required ──────────────────────────────────────────────────────────
  /** Soroban RPC endpoint, e.g. https://soroban-testnet.stellar.org */
  NEXT_PUBLIC_SOROBAN_RPC_URL: z.string().url(),

  /** Stellar network passphrase (identifies mainnet / testnet) */
  NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE: z.string().min(1),

  /** Stellar Horizon REST endpoint, e.g. https://horizon-testnet.stellar.org */
  NEXT_PUBLIC_STELLAR_HORIZON_URL: z.string().url(),

  /** Deployed ProofStell Soroban contract address */
  NEXT_PUBLIC_PROOFSTELL_CONTRACT_ID: z.string().min(1),

  // ── Optional ──────────────────────────────────────────────────────────
  /** Deployed Issuer Soroban contract address (required for issuer portal) */
  NEXT_PUBLIC_ISSUER_CONTRACT_ID: z.string().optional(),

  /** Comma-separated list of enabled wallet providers, e.g. "freighter,xbull" */
  NEXT_PUBLIC_WALLET_PROVIDERS: z.string().optional(),

  /** Base URL of the ProofStell REST API (falls back to mock data if absent) */
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .url()
    .optional()
    .or(z.literal("")),

  /**
   * Read-only public API key for the REST API.
   * ⚠ NEXT_PUBLIC_* variables are bundled into client-side JavaScript.
   *   Only set this if the key is intentionally public / read-only.
   */
  NEXT_PUBLIC_API_KEY: z.string().optional(),

  /** Deployment environment tag. Controls feature flags and error reporting. */
  NEXT_PUBLIC_APP_ENV: z
    .enum(["development", "staging", "production"])
    .optional(),

  /** Minimum log level emitted to the browser console. */
  NEXT_PUBLIC_LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error"])
    .optional(),

  /**
   * Set to "true" to serve bundled mock data instead of live API calls.
   * Must NOT be "true" in production builds.
   */
  NEXT_PUBLIC_ENABLE_MOCK_DATA: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

// ─── Types ─────────────────────────────────────────────────────────────────

export type Env = z.infer<typeof envSchema>;

// ─── Constants ─────────────────────────────────────────────────────────────

const REQUIRED_KEYS: (keyof Env)[] = [
  "NEXT_PUBLIC_SOROBAN_RPC_URL",
  "NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE",
  "NEXT_PUBLIC_STELLAR_HORIZON_URL",
  "NEXT_PUBLIC_PROOFSTELL_CONTRACT_ID",
];

const WARN_LABEL = "[env]";

// ─── Internal helpers ──────────────────────────────────────────────────────

function logDiagnostics(result: ReturnType<typeof envSchema.safeParse>) {
  if (typeof console === "undefined") return;
  if (result.success) return;

  const flat = result.error.flatten();
  const fieldErrors = flat.fieldErrors as Record<string, string[]>;
  const missing = REQUIRED_KEYS.filter((k) => !process.env[k]);

  if (missing.length) {
    console.warn(
      `${WARN_LABEL} Missing required env vars: ${missing.join(", ")}`
    );
    console.warn(
      `${WARN_LABEL} The app will start in degraded mode. Some features will be unavailable.`
    );
  }

  const optionalErrors = Object.entries(fieldErrors)
    .filter(([k]) => !REQUIRED_KEYS.includes(k as keyof Env))
    .filter(([, v]) => v && v.length > 0);

  if (optionalErrors.length) {
    console.warn(
      `${WARN_LABEL} Optional env vars with invalid values: ${optionalErrors
        .map(([k]) => k)
        .join(", ")}`
    );
  }
}

function buildErrorMessage(result: ReturnType<typeof envSchema.safeParse>): string {
  if (result.success) return "";

  const flat = result.error.flatten();
  const fieldErrors = flat.fieldErrors as Record<string, string[]>;
  const lines: string[] = ["Environment validation failed:"];

  const missing = REQUIRED_KEYS.filter((k) => !process.env[k]);
  if (missing.length) {
    lines.push(`  Missing required variables: ${missing.join(", ")}`);
  }

  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (!messages?.length) continue;
    for (const msg of messages) {
      lines.push(`  ${field}: ${msg}`);
    }
  }

  lines.push(
    "",
    "  See .env.example for all supported variables and their descriptions.",
    "  Copy .env.example to .env.local and fill in the required values."
  );

  return lines.join("\n");
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Soft validation — used at runtime (dev server, SSR).
 *
 * Logs warnings when required variables are missing but returns a partial
 * env object so the app can start in degraded mode rather than crashing.
 */
export function validateEnv(): Partial<Env> {
  const result = envSchema.safeParse(process.env);
  logDiagnostics(result);
  if (result.success) return result.data;
  return process.env as unknown as Partial<Env>;
}

/**
 * Strict validation — used at build time (next.config.ts).
 *
 * Throws an Error with a clear diagnostic message if any required variable
 * is missing or malformed, causing `next build` to fail immediately.
 * This ensures misconfigured builds never reach production.
 *
 * @throws {Error} if validation fails
 */
export function validateEnvStrict(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    throw new Error(buildErrorMessage(result));
  }

  // Additional runtime sanity checks that Zod can't easily express
  const data = result.data;

  if (
    data.NEXT_PUBLIC_APP_ENV === "production" &&
    data.NEXT_PUBLIC_ENABLE_MOCK_DATA === true
  ) {
    throw new Error(
      [
        "Environment validation failed:",
        "  NEXT_PUBLIC_ENABLE_MOCK_DATA must not be 'true' in a production build.",
        "  Set it to 'false' or remove it from your .env file.",
      ].join("\n")
    );
  }

  return data;
}

// ─── Singleton accessor ────────────────────────────────────────────────────

let _env: Partial<Env> | null = null;

/** Returns the cached validated environment (soft mode). */
export function getEnv(): Partial<Env> {
  if (!_env) _env = validateEnv();
  return _env;
}

/**
 * Proxy-based accessor for type-safe environment variable access.
 *
 * @example
 * import { env } from "@/config/environment";
 * const rpcUrl = env.NEXT_PUBLIC_SOROBAN_RPC_URL;
 */
export const env = new Proxy({} as Partial<Env>, {
  get(_target, prop) {
    return getEnv()[prop as keyof Env];
  },
});
