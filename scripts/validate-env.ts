/**
 * Pre-build environment validation script.
 *
 * Checks:
 *  1. All required environment variables are present and valid.
 *  2. Sensitive keys (API keys, private keys, secrets) are NOT exposed
 *     through NEXT_PUBLIC_* variables — which are bundled into the client.
 *
 * Run manually:   npx tsx scripts/validate-env.ts
 * Run via npm:    npm run validate:env
 * Auto-run:       Triggered as `prebuild` before `next build`.
 *
 * Exit codes:
 *  0 — All checks passed.
 *  1 — One or more checks failed (build should be aborted).
 */

import { config } from "dotenv";
import { z } from "zod";

// Load environment variables from .env.local, .env, etc.
config({ path: ".env.local" });
config({ path: ".env" });

// ─── ANSI colour helpers ───────────────────────────────────────────────────

const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

const fmt = {
  error: (s: string) => `${RED}${BOLD}${s}${RESET}`,
  warn: (s: string) => `${YELLOW}${s}${RESET}`,
  success: (s: string) => `${GREEN}${s}${RESET}`,
  info: (s: string) => `${CYAN}${s}${RESET}`,
  bold: (s: string) => `${BOLD}${s}${RESET}`,
};

// ─── Schema ────────────────────────────────────────────────────────────────

/**
 * Zod schema for every environment variable the app can consume.
 * Mirrors src/config/environment.ts but is used strictly — parse failures
 * are treated as hard errors that abort the build.
 */
const envSchema = z.object({
  // ── Required ──────────────────────────────────────────────────────────
  NEXT_PUBLIC_SOROBAN_RPC_URL: z
    .string({ required_error: "Soroban RPC URL is required" })
    .url("NEXT_PUBLIC_SOROBAN_RPC_URL must be a valid URL"),

  NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE: z
    .string({ required_error: "Soroban network passphrase is required" })
    .min(1, "NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE must not be empty"),

  NEXT_PUBLIC_STELLAR_HORIZON_URL: z
    .string({ required_error: "Stellar Horizon URL is required" })
    .url("NEXT_PUBLIC_STELLAR_HORIZON_URL must be a valid URL"),

  NEXT_PUBLIC_PROOFSTELL_CONTRACT_ID: z
    .string({ required_error: "ProofStell contract ID is required" })
    .min(1, "NEXT_PUBLIC_PROOFSTELL_CONTRACT_ID must not be empty"),

  // ── Optional ──────────────────────────────────────────────────────────
  NEXT_PUBLIC_ISSUER_CONTRACT_ID: z.string().min(1).optional(),

  NEXT_PUBLIC_WALLET_PROVIDERS: z.string().optional(),

  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .url("NEXT_PUBLIC_API_BASE_URL must be a valid URL if provided")
    .optional()
    .or(z.literal("")),

  NEXT_PUBLIC_API_KEY: z.string().optional(),

  NEXT_PUBLIC_APP_ENV: z
    .enum(["development", "staging", "production"])
    .optional(),

  NEXT_PUBLIC_LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error"])
    .optional(),

  NEXT_PUBLIC_ENABLE_MOCK_DATA: z
    .enum(["true", "false"])
    .optional()
    .or(z.literal("")),
});

// ─── Required keys (subset of schema) ─────────────────────────────────────

const REQUIRED_KEYS: (keyof z.infer<typeof envSchema>)[] = [
  "NEXT_PUBLIC_SOROBAN_RPC_URL",
  "NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE",
  "NEXT_PUBLIC_STELLAR_HORIZON_URL",
  "NEXT_PUBLIC_PROOFSTELL_CONTRACT_ID",
];

// ─── Secrets scanning ──────────────────────────────────────────────────────

/**
 * Patterns that strongly suggest a value is a secret or private key.
 * If any NEXT_PUBLIC_* variable matches one of these patterns it will
 * fail the build to prevent accidentally shipping secrets to the browser.
 */
const SECRET_VALUE_PATTERNS: RegExp[] = [
  // Private / secret / seed key indicators
  /private[\s_-]?key/i,
  /secret[\s_-]?key/i,
  /secret[\s_-]?token/i,
  /api[\s_-]?secret/i,
  // Stellar secret seed (always starts with S and is 56 chars)
  /^S[A-Z2-7]{55}$/,
];

/**
 * Variable name fragments that indicate a secret should NOT be public.
 */
const SECRET_NAME_FRAGMENTS: string[] = [
  "PRIVATE_KEY",
  "SECRET_KEY",
  "SECRET",
  "PRIVATE",
  "PASSWORD",
  "PASSWD",
  "AUTH_TOKEN",
  "JWT_SECRET",
  "SIGNING_KEY",
  "ENCRYPTION_KEY",
  "WEBHOOK_SECRET",
  "DATABASE_URL",
  "DB_PASSWORD",
  "DB_PASS",
];

/**
 * Variable names that are explicitly allowed even if they look like secrets.
 * Stellar contract IDs start with 'C' and are 56 chars (public by design).
 */
const ALLOWED_PUBLIC_VARS: string[] = [
  "NEXT_PUBLIC_PROOFSTELL_CONTRACT_ID",
  "NEXT_PUBLIC_ISSUER_CONTRACT_ID",
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function getEnvValue(key: string): string | undefined {
  return process.env[key];
}

/**
 * Collect every environment variable that starts with NEXT_PUBLIC_.
 */
function getPublicEnvVars(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      ([k, v]) => k.startsWith("NEXT_PUBLIC_") && v !== undefined
    ) as [string, string][]
  );
}

// ─── Validation steps ──────────────────────────────────────────────────────

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Step 1 — Validate required env vars exist and are non-empty.
 */
function checkRequiredVars(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const key of REQUIRED_KEYS) {
    const value = getEnvValue(key);
    if (!value || value.trim() === "") {
      errors.push(`Missing required variable: ${fmt.bold(key)}`);
    }
  }

  return { passed: errors.length === 0, errors, warnings };
}

/**
 * Step 2 — Parse the full schema using Zod.
 *          Reports each individual field error with a friendly message.
 */
function checkSchemaValidation(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Build an object with only the keys defined in the schema so Zod's
  // .strict() mode (if ever added) doesn't reject unrelated env vars.
  const knownKeys = Object.keys(envSchema.shape) as (keyof z.infer<typeof envSchema>)[];
  const subset: Record<string, string | undefined> = {};
  for (const key of knownKeys) {
    const v = getEnvValue(key);
    if (v !== undefined) subset[key] = v;
  }

  const result = envSchema.partial().safeParse(subset);
  if (!result.success) {
    const flat = result.error.flatten();
    const fieldErrors = flat.fieldErrors as Record<string, string[] | undefined>;
    for (const [field, messages] of Object.entries(fieldErrors)) {
      if (!messages) continue;
      const isRequired = REQUIRED_KEYS.includes(field as keyof z.infer<typeof envSchema>);
      for (const msg of messages) {
        if (isRequired) {
          errors.push(`${fmt.bold(field)}: ${msg}`);
        } else {
          warnings.push(`${fmt.bold(field)}: ${msg} (optional — skipping)`);
        }
      }
    }
  }

  return { passed: errors.length === 0, errors, warnings };
}

/**
 * Step 3 — Secrets scanning.
 *          Fails if any NEXT_PUBLIC_* variable has a name or value that
 *          looks like a secret/private key — these would be bundled into
 *          the browser bundle and visible to anyone.
 */
function checkSecretsNotPublic(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const publicVars = getPublicEnvVars();

  for (const [key, value] of Object.entries(publicVars)) {
    // Skip explicitly allowed public variables (e.g., contract IDs)
    if (ALLOWED_PUBLIC_VARS.includes(key)) {
      continue;
    }

    // Check variable name against secret fragments
    const nameUpper = key.toUpperCase();
    for (const fragment of SECRET_NAME_FRAGMENTS) {
      if (nameUpper.includes(fragment)) {
        errors.push(
          `${fmt.bold(key)} contains "${fragment}" in its name — secrets must NOT be exposed via NEXT_PUBLIC_* variables (they are bundled into the client-side JavaScript).`
        );
        break;
      }
    }

    // Check value against secret-looking patterns
    if (value && value.trim().length > 0) {
      for (const pattern of SECRET_VALUE_PATTERNS) {
        if (pattern.test(value.trim())) {
          errors.push(
            `${fmt.bold(key)} has a value that looks like a secret (matched pattern ${pattern}). Do not expose secrets in NEXT_PUBLIC_* variables.`
          );
          break;
        }
      }
    }
  }

  // Special check: NEXT_PUBLIC_API_KEY should warn if non-empty
  // because any API key in a public variable is accessible to users.
  const apiKey = getEnvValue("NEXT_PUBLIC_API_KEY");
  if (apiKey && apiKey.trim().length > 0) {
    warnings.push(
      `${fmt.bold("NEXT_PUBLIC_API_KEY")} is set to a non-empty value. API keys in NEXT_PUBLIC_* variables are visible to all users in the browser. Ensure this is an intentionally public/read-only key.`
    );
  }

  return { passed: errors.length === 0, errors, warnings };
}

/**
 * Step 4 — Production-specific stricter checks.
 *          When APP_ENV=production certain optional vars become required.
 */
function checkProductionRequirements(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const appEnv = getEnvValue("NEXT_PUBLIC_APP_ENV");

  if (appEnv !== "production") {
    return { passed: true, errors, warnings };
  }

  const prodRequired: string[] = [
    "NEXT_PUBLIC_API_BASE_URL",
    "NEXT_PUBLIC_APP_ENV",
  ];

  for (const key of prodRequired) {
    const value = getEnvValue(key);
    if (!value || value.trim() === "") {
      errors.push(
        `${fmt.bold(key)} is required when NEXT_PUBLIC_APP_ENV=production`
      );
    }
  }

  // Warn if mock data is enabled in production
  if (getEnvValue("NEXT_PUBLIC_ENABLE_MOCK_DATA") === "true") {
    warnings.push(
      `${fmt.bold("NEXT_PUBLIC_ENABLE_MOCK_DATA")} is "true" in a production build. This will serve fake data to users.`
    );
  }

  return { passed: errors.length === 0, errors, warnings };
}

// ─── Runner ────────────────────────────────────────────────────────────────

function printSection(title: string) {
  console.log(`\n${fmt.info(`▶ ${title}`)}`);
}

function printResult(result: ValidationResult, stepName: string) {
  if (result.errors.length > 0) {
    console.log(`  ${fmt.error("✗")} ${stepName}`);
    result.errors.forEach((e) => console.log(`    ${fmt.error("•")} ${e}`));
  } else {
    console.log(`  ${fmt.success("✓")} ${stepName}`);
  }

  if (result.warnings.length > 0) {
    result.warnings.forEach((w) =>
      console.log(`    ${fmt.warn("⚠")}  ${w}`)
    );
  }
}

function run() {
  console.log(
    `\n${fmt.bold("┌─────────────────────────────────────────────┐")}`
  );
  console.log(
    `${fmt.bold("│  ProofStell — Environment Variable Validator  │")}`
  );
  console.log(
    `${fmt.bold("└─────────────────────────────────────────────┘")}`
  );

  const appEnv = getEnvValue("NEXT_PUBLIC_APP_ENV") ?? "unknown";
  console.log(`  Environment : ${fmt.bold(appEnv)}`);
  console.log(
    `  Node.js     : ${fmt.bold(process.version)}`
  );

  printSection("Required Variables");
  const req = checkRequiredVars();
  printResult(req, "All required variables present");

  printSection("Schema Validation");
  const schema = checkSchemaValidation();
  printResult(schema, "All variables match expected schema");

  printSection("Secrets Scanning");
  const secrets = checkSecretsNotPublic();
  printResult(secrets, "No secrets exposed in NEXT_PUBLIC_* variables");

  printSection("Production Requirements");
  const prod = checkProductionRequirements();
  printResult(prod, "Production environment checks");

  // ── Summary ─────────────────────────────────────────────────────────
  const allResults = [req, schema, secrets, prod];
  const totalErrors = allResults.reduce((n, r) => n + r.errors.length, 0);
  const totalWarnings = allResults.reduce((n, r) => n + r.warnings.length, 0);

  console.log(
    `\n${fmt.bold("─────────────────────────────────────────────")}`
  );

  if (totalErrors > 0) {
    console.log(
      fmt.error(
        `✗  Validation FAILED — ${totalErrors} error(s), ${totalWarnings} warning(s).`
      )
    );
    console.log(
      fmt.error(
        "   Fix the errors above before running `next build`."
      )
    );
    console.log(
      fmt.info(
        "   See .env.example for all supported variables and their descriptions."
      )
    );
    process.exit(1);
  } else {
    console.log(
      fmt.success(
        `✓  Validation PASSED — ${totalWarnings} warning(s).`
      )
    );
    if (totalWarnings > 0) {
      console.log(
        fmt.warn("   Review the warnings above before deploying.")
      );
    }
  }
  console.log();
}

run();
