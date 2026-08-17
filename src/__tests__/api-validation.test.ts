import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import {
  ResponseValidationError,
  credentialSummarySchema,
  getCredentialsByWallet,
  verifyDocumentHash,
  verificationResultSchema,
} from "../lib/api/proofstell";
import { apiResponseSchema, apiErrorSchema } from "../lib/api/types";

const HASH =
  "3f8ac92d1b4e6f0a2d8b5c9e7f1a3d6e8f2b4c6a9d1e3f5b7c9e1a3d5f7b9c1";

const MOCK_ISSUER = {
  walletAddress: "GBZX4364PEPQTDICMIQDZ56K4T75QZCR4NBEYKO6PDRFERNTR5LR2HL",
  name: "University of Accra",
  verified: true,
};

const MOCK_VERIFICATION = {
  status: "valid",
  hash: HASH,
  block: 9_847_201,
  issuedAt: "2026-07-18T10:00:00.000Z",
  issuer: MOCK_ISSUER,
  credential: {
    id: "cred_mock_001",
    title: "Bachelor of Science — Computer Science",
    type: "Academic Degree",
    hash: HASH,
    status: "valid",
    issuedAt: "2026-07-18T10:00:00.000Z",
    issuer: MOCK_ISSUER,
  },
};

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response;
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("API response Zod schemas", () => {
  it("validates a well-formed verification result", () => {
    expect(
      verificationResultSchema.safeParse(MOCK_VERIFICATION).success,
    ).toBe(true);
  });

  it("rejects a verification result with an unknown status", () => {
    const result = verificationResultSchema.safeParse({
      ...MOCK_VERIFICATION,
      status: "mystery",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a credential summary missing required fields", () => {
    const result = credentialSummarySchema.safeParse({
      id: "cred_1",
      title: "Cert",
    });
    expect(result.success).toBe(false);
  });

  it("validates the API response envelope with a data schema", () => {
    const schema = apiResponseSchema(verificationResultSchema);
    expect(
      schema.safeParse({ success: true, data: MOCK_VERIFICATION, requestId: "r1" })
        .success,
    ).toBe(true);
    expect(
      schema.safeParse({
        success: false,
        error: { code: "NOT_FOUND", message: "nope" },
        requestId: "r1",
      }).success,
    ).toBe(true);
  });

  it("validates field-level errors in the API error schema", () => {
    const result = apiErrorSchema.safeParse({
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      validationErrors: [{ field: "hash", message: "Invalid hash" }],
    });
    expect(result.success).toBe(true);
  });
});

describe("request() runtime validation", () => {
  it("returns validated data for a well-formed response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ success: true, data: MOCK_VERIFICATION, requestId: "r1" }),
    );

    const result = await verifyDocumentHash(HASH);
    expect(result.status).toBe("valid");
    expect(result.issuer?.name).toBe("University of Accra");
  });

  it("throws a descriptive ResponseValidationError on contract drift", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: { ...MOCK_VERIFICATION, status: "definitely-valid" },
        requestId: "r1",
      }),
    );

    const err = await verifyDocumentHash(HASH).catch((e) => e);
    expect(err).toBeInstanceOf(ResponseValidationError);
    expect(err.message).toContain("/verify/");
    expect(err.message).toContain("status");
    expect(err.issues.length).toBeGreaterThan(0);
  });

  it("throws a ResponseValidationError for a malformed credentials list", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: [{ id: "cred_1", title: "Cert" }],
        requestId: "r1",
      }),
    );

    const err = await getCredentialsByWallet(
      "GABC4364PEPQTDICMIQDZ56K4T75QZCR4NBEYKO6PDRFERNTR5LR2HP",
    ).catch((e) => e);
    expect(err).toBeInstanceOf(ResponseValidationError);
    expect(err.message).toContain("0.type");
  });

  it("preserves API error envelopes as ApiError", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        success: false,
        error: { code: "NOT_FOUND", message: "No record found" },
        requestId: "r1",
      }),
    );

    const err = await verifyDocumentHash(HASH).catch((e) => e);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toBe("No record found");
  });

  it("propagates HTTP-level errors", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ error: { code: "TIMEOUT", message: "slow" } }, false, 504),
    );

    const err = await verifyDocumentHash(HASH).catch((e) => e);
    expect(err.code).toBe("TIMEOUT");
    expect(err.status).toBe(504);
  });
});