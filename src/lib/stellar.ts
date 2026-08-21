import { z } from "zod";
import { env } from "../config/environment";

// ─── Domain schemas ──────────────────────────────────────────────────────

export const verificationStatusSchema = z.enum([
  "valid",
  "not_found",
  "revoked",
  "expired",
]);

export type VerificationStatus = z.infer<typeof verificationStatusSchema>;

export const issuerInfoSchema = z.object({
  walletAddress: z.string(),
  name: z.string(),
  verified: z.boolean(),
  logoUrl: z.string().url().optional(),
});

export type IssuerInfo = z.infer<typeof issuerInfoSchema>;

export const verificationResultSchema = z.object({
  status: verificationStatusSchema,
  hash: z.string(),
  block: z.number().optional(),
  issuedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  issuer: issuerInfoSchema.optional(),
});

export type VerificationResult = z.infer<typeof verificationResultSchema>;

export const documentStatusSchema = z.object({
  status: verificationStatusSchema,
  hash: z.string(),
  block: z.number().optional(),
  issuedAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

export type DocumentStatus = z.infer<typeof documentStatusSchema>;

export const registerDocumentInputSchema = z.object({
  documentHash: z.string().min(1),
  issuerWallet: z.string().min(1),
  metadata: z.record(z.string()).optional(),
});

export type RegisterDocumentParams = z.infer<typeof registerDocumentInputSchema>;

export const registerResultSchema = z.object({
  success: z.boolean(),
  txId: z.string().optional(),
  block: z.number().optional(),
});

export type RegisterResult = z.infer<typeof registerResultSchema>;

export const revokeResultSchema = z.object({
  success: z.boolean(),
  txId: z.string().optional(),
});

export type RevokeResult = z.infer<typeof revokeResultSchema>;

// ─── Error classes ───────────────────────────────────────────────────────

export class SorobanRpcError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "SorobanRpcError";
  }
}

export class SorobanTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SorobanTimeoutError";
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────

type JsonRpcResponse = {
  jsonrpc: string;
  id: number | string;
  result?: unknown;
  error?: { code?: number; message?: string; data?: unknown };
};

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;

function validateResponse<T>(
  endpoint: string,
  schema: z.ZodType<T> | undefined,
  data: T,
): T {
  if (!schema) return data;
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    throw new SorobanRpcError(
      "VALIDATION_ERROR",
      `Soroban RPC response validation failed for ${endpoint}. ${details}`,
      0,
    );
  }
  return parsed.data;
}

// ─── Service ─────────────────────────────────────────────────────────────

class SorobanService {
  get rpcUrl(): string {
    return (env.NEXT_PUBLIC_SOROBAN_RPC_URL as string | undefined) ?? "";
  }

  get networkPassphrase(): string {
    return (env.NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE as string | undefined) ?? "";
  }

  async rpc(
    method: string,
    params: unknown[] = [],
    signal?: AbortSignal,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<unknown> {
    if (!this.rpcUrl) {
      throw new SorobanRpcError(
        "CONFIG_ERROR",
        "NEXT_PUBLIC_SOROBAN_RPC_URL is not set. Cannot make RPC calls.",
        0,
      );
    }

    const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method, params });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    if (signal) {
      signal.addEventListener("abort", () => controller.abort(), { once: true });
    }

    try {
      const res = await fetch(this.rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: controller.signal,
      });

      const json = (await res.json()) as JsonRpcResponse;

      if (json.error) {
        throw new SorobanRpcError(
          String(json.error.code ?? "RPC_ERROR"),
          json.error.message ?? JSON.stringify(json.error),
          res.status,
        );
      }

      return json.result;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        if (signal?.aborted) {
          throw err;
        }
        throw new SorobanTimeoutError(`Request timed out after ${timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async rpcWithRetry<T>(
    method: string,
    params: unknown[],
    schema?: z.ZodType<T>,
    signal?: AbortSignal,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await this.rpc(method, params, signal, timeoutMs);
        return validateResponse(method, schema, result as T);
      } catch (err) {
        lastError = err as Error;

        if (err instanceof SorobanTimeoutError) {
          throw err;
        }

        if (err instanceof SorobanRpcError) {
          if (err.status >= 400 && err.status < 500) throw err;
          if (err.code === "VALIDATION_ERROR") throw err;
        }

        if (attempt === MAX_RETRIES) break;

        const delay = INITIAL_BACKOFF_MS * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError ?? new SorobanRpcError("UNKNOWN", "Unknown RPC error", 0);
  }

  // ─── Typed contract methods ────────────────────────────────────────────

  async verifyDocument(
    hash: string,
    signal?: AbortSignal,
    timeoutMs?: number,
  ): Promise<VerificationResult> {
    return this.rpcWithRetry(
      "verifyDocument",
      [hash],
      verificationResultSchema,
      signal,
      timeoutMs,
    );
  }

  async getDocumentStatus(
    hash: string,
    signal?: AbortSignal,
    timeoutMs?: number,
  ): Promise<DocumentStatus> {
    return this.rpcWithRetry(
      "getDocumentStatus",
      [hash],
      documentStatusSchema,
      signal,
      timeoutMs,
    );
  }

  async registerDocument(
    params: RegisterDocumentParams,
    signal?: AbortSignal,
    timeoutMs?: number,
  ): Promise<RegisterResult> {
    const validated = registerDocumentInputSchema.parse(params);
    return this.rpcWithRetry(
      "registerDocument",
      [validated],
      registerResultSchema,
      signal,
      timeoutMs,
    );
  }

  async revokeDocument(
    hash: string,
    reason: string,
    signal?: AbortSignal,
    timeoutMs?: number,
  ): Promise<RevokeResult> {
    return this.rpcWithRetry(
      "revokeDocument",
      [hash, reason],
      revokeResultSchema,
      signal,
      timeoutMs,
    );
  }

  getHorizonUrl(): string {
    return (env.NEXT_PUBLIC_STELLAR_HORIZON_URL as string | undefined) ?? "";
  }
}

export const soroban = new SorobanService();
