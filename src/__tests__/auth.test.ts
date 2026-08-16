import { describe, it, expect } from "vitest";
import { encryptData, decryptData } from "../utils/crypto";
import { signJwt, verifyJwt } from "../lib/jwt";
import loginHandler from "../pages/api/auth/login";
import refreshHandler from "../pages/api/auth/refresh";
import logoutHandler from "../pages/api/auth/logout";
import type { NextApiRequest, NextApiResponse } from "next";

// Helper to mock NextApiRequest and NextApiResponse
function mockRequestResponse(
  method: string,
  body: any = {},
  headers: any = {},
  cookies: any = {},
) {
  const req = {
    method,
    body,
    headers,
    cookies,
  } as unknown as NextApiRequest;

  const res = {
    statusCode: 200,
    writableEnded: false,
    headersSent: false,
    headers: {} as Record<string, string | string[]>,
    body: null as any,
    setHeader(name: string, value: string | string[]) {
      this.headers[name] = value;
      return this;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      this.writableEnded = true;
      this.headersSent = true;
      return this;
    },
    on() {
      return this;
    },
  } as unknown as NextApiResponse;

  return { req, res };
}

describe("Authentication Utilities", () => {
  describe("Cryptographic Storage Encryption", () => {
    it("should encrypt and decrypt strings successfully", async () => {
      const plaintext = "my-secret-session-tokens-123456";
      const encrypted = await encryptData(plaintext);
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).toContain(":");

      const decrypted = await decryptData(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should handle empty or invalid inputs gracefully", async () => {
      expect(await encryptData("")).toBe("");
      expect(await decryptData("")).toBe("");
      expect(await decryptData("invalid-format-no-colon")).toBe("");
    });
  });

  describe("JWT Signature and Validation", () => {
    it("should sign a payload and verify it correctly", () => {
      const payload = { address: "GABC4364PEPQTDICMIQDZ56K4T75QZCR4NBEYKO6PDRFERNTR5LR2HP", type: "access" };
      const token = signJwt(payload, 60); // valid for 60 seconds
      expect(token).toContain(".");
      expect(token.split(".")).toHaveLength(3);

      const verified = verifyJwt(token);
      expect(verified).not.toBeNull();
      expect(verified?.address).toBe(payload.address);
      expect(verified?.type).toBe(payload.type);
      expect(verified?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it("should reject expired tokens", () => {
      const payload = { address: "GABC4364PEPQTDICMIQDZ56K4T75QZCR4NBEYKO6PDRFERNTR5LR2HP", type: "access" };
      const token = signJwt(payload, -10); // Expired 10 seconds ago

      const verified = verifyJwt(token);
      expect(verified).toBeNull();
    });

    it("should reject tampered tokens", () => {
      const payload = { address: "GABC4364PEPQTDICMIQDZ56K4T75QZCR4NBEYKO6PDRFERNTR5LR2HP" };
      const token = signJwt(payload, 60);

      // Tamper with the signature (last segment)
      const parts = token.split(".");
      parts[2] = "tamperedSignature12345";
      const tamperedToken = parts.join(".");

      const verified = verifyJwt(tamperedToken);
      expect(verified).toBeNull();
    });
  });
});

describe("Authentication API Routes", () => {
  describe("POST /api/auth/login", () => {
    it("should verify address and issue access, refresh, and CSRF cookies", async () => {
      const address = "GBZX4364PEPQTDICMIQDZ56K4T75QZCR4NBEYKO6PDRFERNTR5LR2HL";
      const { req, res } = mockRequestResponse("POST", {
        address,
        walletId: "freighter",
      });

      await loginHandler(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.csrfToken).toBeDefined();
      expect(res.body.data.address).toBe(address);

      const cookieHeader = res.headers["Set-Cookie"] as string;
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader).toContain("csrf_token=");
      expect(cookieHeader).toContain("SameSite=Strict");
    });

    it("should reject non-POST requests", async () => {
      const { req, res } = mockRequestResponse("GET");
      await loginHandler(req, res);
      expect(res.statusCode).toBe(405);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("should refresh access token with matching CSRF cookie/header and valid refresh token", async () => {
      const address = "GBZX4364PEPQTDICMIQDZ56K4T75QZCR4NBEYKO6PDRFERNTR5LR2HL";
      const refreshToken = signJwt({ address, type: "refresh" }, 3600);
      const csrfToken = "valid_csrf_token_string";

      const { req, res } = mockRequestResponse(
        "POST",
        { refreshToken },
        { "x-csrf-token": csrfToken },
        { csrf_token: csrfToken },
      );

      await refreshHandler(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBe(refreshToken);
    });

    it("should reject refresh if CSRF cookie and header do not match", async () => {
      const address = "GBZX4364PEPQTDICMIQDZ56K4T75QZCR4NBEYKO6PDRFERNTR5LR2HL";
      const refreshToken = signJwt({ address, type: "refresh" }, 3600);

      const { req, res } = mockRequestResponse(
        "POST",
        { refreshToken },
        { "x-csrf-token": "hacker_csrf_token" },
        { csrf_token: "legitimate_csrf_cookie" },
      );

      await refreshHandler(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("CSRF_ERROR");
    });

    it("should reject invalid/expired refresh tokens", async () => {
      const csrfToken = "valid_csrf_token_string";
      const invalidRefreshToken = "not-a-valid-jwt";

      const { req, res } = mockRequestResponse(
        "POST",
        { refreshToken: invalidRefreshToken },
        { "x-csrf-token": csrfToken },
        { csrf_token: csrfToken },
      );

      await refreshHandler(req, res);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should clear the CSRF cookie", async () => {
      const { req, res } = mockRequestResponse("POST");

      await logoutHandler(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const cookieHeader = res.headers["Set-Cookie"] as string;
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader).toContain("csrf_token=;");
      expect(cookieHeader).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
    });
  });
});
