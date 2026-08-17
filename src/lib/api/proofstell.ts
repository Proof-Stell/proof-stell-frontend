/**
 * ProofStell API client.
 *
 * Provides typed methods for:
 *  - Verifying a document hash against the on-chain Soroban registry
 *  - Fetching credentials linked to a wallet address
 *  - Fetching a single credential by ID
 *  - Issuing a new credential (issuer portal)
 *  - Revoking a credential (issuer portal)
 *
 * All requests flow through this module so authentication headers,
 * base-URL, and error normalisation are handled in one place.
 */

import { z } from "zod";

import { env } from "@/config/environment";

// ─── Domain types & schemas ────────────────────────────────────────────────
//
// Every API response type is defined as a Zod schema so the client can
// validate payloads at runtime before they reach components. The TypeScript
// types are derived from the schemas (`z.infer`), keeping the two always in
// sync.

/** Status of an on-chain verification record. */
export const verificationStatusSchema = z.enum([
  "valid",
  "not_found",
  "revoked",
  "expired",
]);

/** Status of an on-chain verification record. */
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;

/**
 * Zod schema for the issuer of a credential.
 *
 * @example
 * const result = issuerInfoSchema.safeParse(payload);
 */
export const issuerInfoSchema = z.object({
  walletAddress: z.string().describe("Stellar wallet address of the issuer"),
  name: z.string().describe("Display name of the issuing entity"),
  verified: z.boolean().describe("Whether the issuer identity is verified"),
  logoUrl: z.string().url().optional().describe("URL of the issuer logo"),
});

/** Issuer of a credential. */
export type IssuerInfo = z.infer<typeof issuerInfoSchema>;

/**
 * Zod schema for a summary of a credential listed on the dashboard.
 *
 * @example
 * const result = credentialSummarySchema.safeParse(payload);
 */
export const credentialSummarySchema = z.object({
  id: z.string().describe("Unique credential identifier"),
  title: z.string().describe("Human-readable title of the credential"),
  type: z.string().describe("Credential type, e.g. 'Academic Degree'"),
  hash: z.string().describe("SHA-256 hash of the underlying document"),
  status: verificationStatusSchema,
  issuedAt: z.string().describe("ISO-8601 timestamp of issuance"),
  expiresAt: z.string().optional().describe("ISO-8601 expiry timestamp"),
  issuer: issuerInfoSchema,
  txId: z.string().optional().describe("Stellar Horizon transaction ID"),
  block: z.number().optional().describe("On-chain block number"),
});

/** Summary of a credential listed on the dashboard. */
export type CredentialSummary = z.infer<typeof credentialSummarySchema>;

/**
 * Zod schema for a detailed credential view.
 *
 * @example
 * const result = credentialDetailSchema.safeParse(payload);
 */
export const credentialDetailSchema = credentialSummarySchema.extend({
  recipientWallet: z
    .string()
    .describe("Stellar wallet address of the recipient"),
  metadata: z
    .record(z.string())
    .describe("Arbitrary key/value metadata attached to the credential"),
  description: z.string().optional().describe("Long-form description"),
  ipfsCid: z.string().optional().describe("IPFS CID for off-chain metadata"),
});

/** Detailed credential view. */
export type CredentialDetail = z.infer<typeof credentialDetailSchema>;

/**
 * Zod schema for a verification lookup result.
 *
 * @example
 * const result = verificationResultSchema.safeParse(payload);
 */
export const verificationResultSchema = z.object({
  status: verificationStatusSchema,
  hash: z.string().describe("Document hash that was verified"),
  block: z.number().optional().describe("On-chain block number of the record"),
  issuedAt: z
    .string()
    .optional()
    .describe("ISO-8601 timestamp of the on-chain record"),
  expiresAt: z
    .string()
    .optional()
    .describe("ISO-8601 expiry timestamp, if set by the issuer"),
  issuer: issuerInfoSchema.optional(),
  credential: credentialSummarySchema.optional(),
});

/** Verification lookup result. */
export type VerificationResult = z.infer<typeof verificationResultSchema>;

/**
 * Zod schema for the payload used to issue a new credential.
 *
 * @example
 * const result = issueCredentialInputSchema.safeParse(payload);
 */
export const issueCredentialInputSchema = z.object({
  recipientWallet: z
    .string()
    .describe("Stellar wallet address of the recipient"),
  title: z.string().describe("Title of the credential"),
  type: z.string().describe("Credential type, e.g. 'Academic Degree'"),
  description: z.string().optional().describe("Long-form description"),
  documentHash: z.string().describe("SHA-256 hash of the document"),
  metadata: z
    .record(z.string())
    .optional()
    .describe("Arbitrary key/value metadata"),
  expiresAt: z
    .string()
    .optional()
    .describe("ISO-8601 expiry date, if any"),
});

/** Payload used to issue a new credential. */
export type IssueCredentialInput = z.infer<typeof issueCredentialInputSchema>;

/**
 * Zod schema for the revoke endpoint response.
 *
 * @example
 * const result = revokeResultSchema.safeParse(payload);
 */
export const revokeResultSchema = z.object({
  success: z.boolean().describe("Whether the credential was revoked"),
});

// ─── HTTP helper ──────────────────────────────────────────────────────────

class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Thrown when an API response fails runtime validation against its Zod
 * schema. Carries the Zod issues so callers can surface a descriptive,
 * field-level error message.
 */
export class ResponseValidationError extends Error {
  /** Zod issues describing every field that failed validation. */
  public readonly issues: z.ZodIssue[];

  constructor(public readonly endpoint: string, error: z.ZodError) {
    const details = error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    super(
      `API response validation failed for ${endpoint}. Details: ${details}`,
    );
    this.name = "ResponseValidationError";
    this.issues = error.issues;
  }
}

/**
 * Validates `data` against `schema` and returns it, or throws a descriptive
 * `ResponseValidationError` when the payload does not match the expected
 * contract.
 */
function validateResponse<T>(
  endpoint: string,
  schema: z.ZodType<T> | undefined,
  data: T,
): T {
  if (!schema) return data;
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ResponseValidationError(endpoint, parsed.error);
  }
  return parsed.data;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  schema?: z.ZodType<T>,
): Promise<T> {
  const base = env.NEXT_PUBLIC_API_BASE_URL ?? "/api";
  const url = `${base}${path}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(env.NEXT_PUBLIC_API_KEY
      ? { "X-API-Key": env.NEXT_PUBLIC_API_KEY }
      : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(url, { ...options, headers });

  // Try to parse JSON body for error details
  let body: Record<string, unknown> | null;
  try {
    body = await res.json() as Record<string, unknown>;
  } catch {
    body = null;
  }

  if (!res.ok) {
    const errBody = body as { error?: { code?: string; message?: string } } | null;
    const code = errBody?.error?.code ?? "API_ERROR";
    const message =
      errBody?.error?.message ?? `Request failed with status ${res.status}`;
    throw new ApiError(code, message, res.status);
  }

  // Unwrap standard { success: true, data: T } envelope
  if (body && "success" in body) {
    const envelope = body as { success: boolean; data?: T; error?: { code?: string; message?: string } };
    if (!envelope.success) {
      throw new ApiError(
        envelope.error?.code ?? "API_ERROR",
        envelope.error?.message ?? "Unknown API error",
        res.status,
      );
    }
    // Validate the success payload before handing it to the caller
    return validateResponse(path, schema, envelope.data as T);
  }

  return validateResponse(path, schema, body as unknown as T);
}

// ─── API methods ──────────────────────────────────────────────────────────

/**
 * Verify a document hash against the on-chain Soroban registry.
 * Falls back to a mock result when no API base URL is configured.
 */
export async function verifyDocumentHash(
  hash: string,
): Promise<VerificationResult> {
  // Dev/demo mode: return mock result when no backend is configured
  if (!env.NEXT_PUBLIC_API_BASE_URL) {
    return mockVerifyHash(hash);
  }
  return request<VerificationResult>(
    `/verify/${encodeURIComponent(hash)}`,
    {},
    verificationResultSchema,
  );
}

/**
 * Fetch all credentials linked to a Stellar wallet address.
 */
export async function getCredentialsByWallet(
  walletAddress: string,
): Promise<CredentialSummary[]> {
  if (!env.NEXT_PUBLIC_API_BASE_URL) {
    return mockCredentials();
  }
  return request<CredentialSummary[]>(
    `/credentials?wallet=${encodeURIComponent(walletAddress)}`,
    {},
    z.array(credentialSummarySchema),
  );
}

/**
 * Fetch a single credential by its ID.
 */
export async function getCredentialById(
  id: string,
): Promise<CredentialDetail> {
  if (!env.NEXT_PUBLIC_API_BASE_URL) {
    return mockCredentialDetail(id);
  }
  return request<CredentialDetail>(
    `/credentials/${encodeURIComponent(id)}`,
    {},
    credentialDetailSchema,
  );
}

/**
 * Issue a new credential (issuer portal). Requires issuer wallet auth header.
 */
export async function issueCredential(
  input: IssueCredentialInput,
  issuerWalletAddress: string,
): Promise<CredentialSummary> {
  return request<CredentialSummary>(
    "/credentials",
    {
      method: "POST",
      headers: { "X-Wallet-Address": issuerWalletAddress },
      body: JSON.stringify(input),
    },
    credentialSummarySchema,
  );
}

/**
 * Revoke a credential by ID.
 */
export async function revokeCredential(
  id: string,
  issuerWalletAddress: string,
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(
    `/credentials/${encodeURIComponent(id)}/revoke`,
    {
      method: "POST",
      headers: { "X-Wallet-Address": issuerWalletAddress },
    },
    revokeResultSchema,
  );
}

// ─── Mock data for local development ──────────────────────────────────────

const MOCK_ISSUER: IssuerInfo = {
  walletAddress: "GBZX4364PEPQTDICMIQDZ56K4T75QZCR4NBEYKO6PDRFERNTR5LR2HL",
  name: "University of Accra",
  verified: true,
};

function mockVerifyHash(hash: string): VerificationResult {
  // Simulate "not found" for obviously fake hashes
  if (hash.length !== 64) {
    return { status: "not_found", hash };
  }
  return {
    status: "valid",
    hash,
    block: 9_847_201,
    issuedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    issuer: MOCK_ISSUER,
    credential: {
      id: "cred_mock_001",
      title: "Bachelor of Science — Computer Science",
      type: "Academic Degree",
      hash,
      status: "valid",
      issuedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      issuer: MOCK_ISSUER,
      txId: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
      block: 9_847_201,
    },
  };
}

function mockCredentials(): CredentialSummary[] {
  return [
    {
      id: "cred_mock_001",
      title: "Bachelor of Science — Computer Science",
      type: "Academic Degree",
      hash: "3f8ac92d1b4e6f0a2d8b5c9e7f1a3d6e8f2b4c6a9d1e3f5b7c9e1a3d5f7b9c1",
      status: "valid",
      issuedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      issuer: MOCK_ISSUER,
      txId: "a1b2c3d4e5f6",
      block: 9_847_201,
    },
    {
      id: "cred_mock_002",
      title: "Blockchain Development Certificate",
      type: "Professional Certificate",
      hash: "7b2cf14a8e3d5a7c9f1b4e6a8d2f4c6a8e1b3d5f7c9a1e3d5f7b9c1a3e5d7f9",
      status: "valid",
      issuedAt: new Date(Date.now() - 86400000 * 90).toISOString(),
      issuer: {
        walletAddress: "GDZX4364PEPQTDICMIQDZ56K4T75QZCR4NBEYKO6PDRFERNTR5LR2HM",
        name: "Meridian Labs",
        verified: true,
      },
      txId: "b2c3d4e5f6a1",
      block: 9_821_450,
    },
    {
      id: "cred_mock_003",
      title: "Identity Verification — KYC Level 2",
      type: "Identity Document",
      hash: "1d9ea87b5c3f7e1a9d3b5c7e9f1a3d5b7c9e1a3d5f7b9c1e3f5a7d9b1c3e5f7",
      status: "revoked",
      issuedAt: new Date(Date.now() - 86400000 * 180).toISOString(),
      expiresAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      issuer: {
        walletAddress: "GCXZ4364PEPQTDICMIQDZ56K4T75QZCR4NBEYKO6PDRFERNTR5LR2HN",
        name: "NovaCert Authority",
        verified: true,
      },
      block: 9_731_002,
    },
  ];
}

function mockCredentialDetail(id: string): CredentialDetail {
  const creds = mockCredentials();
  const base = creds.find((c) => c.id === id) ?? creds[0];
  return {
    ...base,
    id,
    recipientWallet: "GABC4364PEPQTDICMIQDZ56K4T75QZCR4NBEYKO6PDRFERNTR5LR2HP",
    description:
      "This credential certifies successful completion of the undergraduate program in Computer Science, awarded upon fulfillment of all academic requirements.",
    metadata: {
      Program: "Computer Science",
      "Graduation Year": "2024",
      "GPA": "3.87 / 4.00",
      "Honors": "Magna Cum Laude",
    },
    ipfsCid: "QmXtZqFgYiHjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQr",
  };
}
