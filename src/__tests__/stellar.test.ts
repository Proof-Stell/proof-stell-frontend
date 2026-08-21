import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  soroban,
  SorobanRpcError,
  SorobanTimeoutError,
  verificationStatusSchema,
  verificationResultSchema,
  documentStatusSchema,
  registerResultSchema,
  revokeResultSchema,
} from "../lib/stellar";

const fetchMock = vi.fn();

beforeEach(() => {
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";
  process.env.NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE = "Test SDF Future Network ; October 2015";
  process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL = "https://horizon-testnet.stellar.org";
  global.fetch = fetchMock;
  fetchMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response;
}

function rpcResponse(result: unknown) {
  return jsonResponse({ jsonrpc: "2.0", id: 1, result });
}

function rpcError(code: number, message: string, status = 200) {
  return jsonResponse({ jsonrpc: "2.0", id: 1, error: { code, message } }, false, status);
}

describe("Error classes", () => {
  it("SorobanRpcError has correct name and fields", () => {
    const err = new SorobanRpcError("TEST_CODE", "test message", 500);
    expect(err.name).toBe("SorobanRpcError");
    expect(err.code).toBe("TEST_CODE");
    expect(err.message).toBe("test message");
    expect(err.status).toBe(500);
  });

  it("SorobanTimeoutError has correct name", () => {
    const err = new SorobanTimeoutError("timed out");
    expect(err.name).toBe("SorobanTimeoutError");
    expect(err.message).toBe("timed out");
  });
});

describe("Zod schemas", () => {
  it("verificationStatusSchema validates valid statuses", () => {
    expect(verificationStatusSchema.safeParse("valid").success).toBe(true);
    expect(verificationStatusSchema.safeParse("not_found").success).toBe(true);
    expect(verificationStatusSchema.safeParse("revoked").success).toBe(true);
    expect(verificationStatusSchema.safeParse("expired").success).toBe(true);
    expect(verificationStatusSchema.safeParse("unknown").success).toBe(false);
  });

  it("verificationResultSchema validates a well-formed result", () => {
    const result = verificationResultSchema.safeParse({
      status: "valid",
      hash: "abc123",
      block: 9847201,
      issuedAt: "2026-01-01T00:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("documentStatusSchema validates a well-formed status", () => {
    const result = documentStatusSchema.safeParse({
      status: "valid",
      hash: "abc123",
    });
    expect(result.success).toBe(true);
  });

  it("registerResultSchema validates a well-formed result", () => {
    const result = registerResultSchema.safeParse({
      success: true,
      txId: "tx123",
      block: 100,
    });
    expect(result.success).toBe(true);
  });

  it("revokeResultSchema validates a well-formed result", () => {
    const result = revokeResultSchema.safeParse({
      success: true,
      txId: "tx456",
    });
    expect(result.success).toBe(true);
  });
});

describe("SorobanService.rpc", () => {
  it("throws SorobanRpcError when RPC URL is not configured", async () => {
    process.env.NEXT_PUBLIC_SOROBAN_RPC_URL = "";
    await expect(soroban.rpc("test")).rejects.toThrow(SorobanRpcError);
  });

  it("sends a JSON-RPC request to the configured URL", async () => {
    fetchMock.mockResolvedValueOnce(rpcResponse({ ok: true }));
    const result = await soroban.rpc("getHealth");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true });
  });

  it("throws SorobanRpcError on RPC error response", async () => {
    fetchMock.mockResolvedValueOnce(rpcError(-32600, "Invalid request"));
    await expect(soroban.rpc("badMethod")).rejects.toThrow(SorobanRpcError);
  });

  it("returns the result on successful RPC call", async () => {
    fetchMock.mockResolvedValueOnce(rpcResponse({ status: "active" }));
    const result = await soroban.rpc("getContractData", ["contract", "key"]);
    expect(result).toEqual({ status: "active" });
  });
});

describe("SorobanService.rpcWithRetry", () => {
  it("retries on transient errors and eventually succeeds", async () => {
    fetchMock
      .mockResolvedValueOnce(rpcError(-32000, "transient", 500))
      .mockResolvedValueOnce(rpcError(-32000, "transient", 500))
      .mockResolvedValueOnce(rpcResponse({ status: "valid", hash: "abc" }));
    const result = await soroban.rpcWithRetry(
      "test",
      [],
      verificationResultSchema,
      undefined,
      5000,
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ status: "valid", hash: "abc" });
  });

  it("does not retry on 4xx errors", async () => {
    fetchMock.mockResolvedValueOnce(rpcError(-32600, "bad request", 400));
    await expect(
      soroban.rpcWithRetry("test", [], undefined, undefined, 5000),
    ).rejects.toThrow(SorobanRpcError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry on schema validation failure", async () => {
    fetchMock.mockResolvedValueOnce(
      rpcResponse({ status: "unknown", hash: "abc" }),
    );
    await expect(
      soroban.rpcWithRetry("test", [], verificationResultSchema, undefined, 5000),
    ).rejects.toThrow("validation failed");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns validated data when schema passes", async () => {
    fetchMock.mockResolvedValueOnce(
      rpcResponse({ status: "valid", hash: "abc123", block: 100 }),
    );
    const result = await soroban.rpcWithRetry(
      "test",
      [],
      verificationResultSchema,
      undefined,
      5000,
    );
    expect(result.status).toBe("valid");
    expect(result.hash).toBe("abc123");
    expect(result.block).toBe(100);
  });
});

describe("Typed contract methods", () => {
  it("verifyDocument calls rpcWithRetry with correct params", async () => {
    fetchMock.mockResolvedValueOnce(
      rpcResponse({ status: "valid", hash: "abc" }),
    );
    const result = await soroban.verifyDocument("abc");
    expect(result.status).toBe("valid");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getDocumentStatus calls rpcWithRetry with correct params", async () => {
    fetchMock.mockResolvedValueOnce(
      rpcResponse({ status: "revoked", hash: "def" }),
    );
    const result = await soroban.getDocumentStatus("def");
    expect(result.status).toBe("revoked");
  });

  it("registerDocument validates input with Zod", async () => {
    await expect(
      soroban.registerDocument({ documentHash: "", issuerWallet: "GABC" }),
    ).rejects.toThrow();
  });

  it("registerDocument succeeds with valid input", async () => {
    fetchMock.mockResolvedValueOnce(
      rpcResponse({ success: true, txId: "tx1", block: 200 }),
    );
    const result = await soroban.registerDocument({
      documentHash: "hash123",
      issuerWallet: "GABC",
    });
    expect(result.success).toBe(true);
    expect(result.txId).toBe("tx1");
  });

  it("revokeDocument calls rpcWithRetry with correct params", async () => {
    fetchMock.mockResolvedValueOnce(
      rpcResponse({ success: true, txId: "tx2" }),
    );
    const result = await soroban.revokeDocument("hash", "expired");
    expect(result.success).toBe(true);
  });
});

describe("SorobanService properties", () => {
  it("getHorizonUrl returns configured URL", () => {
    expect(soroban.getHorizonUrl()).toBe("https://horizon-testnet.stellar.org");
  });

  it("rpcUrl returns configured RPC URL", () => {
    expect(soroban.rpcUrl).toBe("https://soroban-testnet.stellar.org");
  });

  it("networkPassphrase returns configured passphrase", () => {
    expect(soroban.networkPassphrase).toBe("Test SDF Future Network ; October 2015");
  });
});
