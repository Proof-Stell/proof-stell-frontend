import type { NextConfig } from "next";
import { validateEnvStrict } from "./src/config/environment";

/**
 * Run strict environment validation at build time.
 *
 * `validateEnvStrict` throws if any required variable is missing or
 * malformed, which causes `next build` to fail with a clear error message
 * before any code is compiled. This prevents misconfigured builds from
 * ever reaching staging or production.
 *
 * The validation is skipped automatically during `next dev` if the
 * SKIP_ENV_VALIDATION environment variable is set to "1", which is
 * useful for running the dev server with an incomplete .env.local.
 */
if (process.env.SKIP_ENV_VALIDATION !== "1") {
  validateEnvStrict();
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
