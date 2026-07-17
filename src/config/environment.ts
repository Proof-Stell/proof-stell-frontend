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
  NEXT_PUBLIC_ENABLE_MOCK_DATA: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

export type Env = z.infer<typeof envSchema>;

const REQUIRED_KEYS: (keyof Env)[] = [
  "NEXT_PUBLIC_SOROBAN_RPC_URL",
  "NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE",
  "NEXT_PUBLIC_STELLAR_HORIZON_URL",
  "NEXT_PUBLIC_PROOFSTELL_CONTRACT_ID",
];

const WARN_LABEL = "[env]";

function logDiagnostics(result: ReturnType<typeof envSchema.safeParse>) {
  if (typeof console === "undefined") return;
  if (result.success) return;

  const flat = result.error.flatten();
  const fieldErrors = flat.fieldErrors as Record<string, string[]>;
  const missing = REQUIRED_KEYS.filter((k) => !process.env[k]);

  if (missing.length) {
    console.warn(
      `${WARN_LABEL} Missing required env vars: ${missing.join(", ")}`,
    );
    console.warn(
      `${WARN_LABEL} The app will start in degraded mode. Some features will be unavailable.`,
    );
  }

  const optionalErrors = Object.entries(fieldErrors)
    .filter(([k]) => !REQUIRED_KEYS.includes(k as keyof Env))
    .filter(([, v]) => v && v.length > 0);

  if (optionalErrors.length) {
    console.warn(
      `${WARN_LABEL} Optional env vars with invalid values: ${optionalErrors.map(([k]) => k).join(", ")}`,
    );
  }
}

export function validateEnv(): Partial<Env> {
  const result = envSchema.safeParse(process.env);
  logDiagnostics(result);
  if (result.success) return result.data;
  return (process.env as unknown) as Partial<Env>;
}

let _env: Partial<Env> | null = null;

export function getEnv(): Partial<Env> {
  if (!_env) _env = validateEnv();
  return _env;
}

export const env = new Proxy({} as Partial<Env>, {
  get(_target, prop) {
    return getEnv()[prop as keyof Env];
  },
});
