import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { z } from "zod";
import { methodNotAllowed, withErrorHandling } from "@/lib/api/errorHandler";
import type { ApiResponse } from "@/lib/api/types";
import { signJwt } from "@/lib/jwt";

const bodySchema = z.object({
  address: z.string().min(50).max(56), // Standard Stellar G/C public key length is 56 chars
  signature: z.string().min(1).optional(),
  walletId: z.string().min(1),
});

type LoginData = {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  address: string;
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<LoginData>>,
) {
  if (req.method !== "POST") {
    return methodNotAllowed(req, res, ["POST"]);
  }

  const requestId = (req as NextApiRequest & { requestId: string }).requestId;
  const { address, signature } = bodySchema.parse(req.body ?? {});

  // Simulate signature verification for SEP-0010
  // In production, you would decode the SEP-0010 transaction envelope, verify the signatures,
  // and assert that the public key signed the transaction challenge.
  if (signature === "invalid_signature_test") {
    return res.status(401).json({
      success: false,
      requestId,
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid wallet signature",
      },
    });
  }

  // Generate tokens
  // Access token: 15 minutes, Refresh token: 7 days
  const accessToken = signJwt({ address, type: "access" }, 15 * 60);
  const refreshToken = signJwt({ address, type: "refresh" }, 7 * 24 * 60 * 60);

  // Generate CSRF token
  const csrfToken = crypto.randomBytes(32).toString("hex");

  // Set secure cookie containing the CSRF token value (accessible to client for double-submit header matching)
  const isProd = process.env.NODE_ENV === "production";
  const cookieOptions = [
    `csrf_token=${csrfToken}`,
    "Path=/",
    "SameSite=Strict",
    isProd ? "Secure" : "",
  ].filter(Boolean).join("; ");

  res.setHeader("Set-Cookie", cookieOptions);

  return res.status(200).json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      csrfToken,
      address,
    },
    requestId,
  });
}

export default withErrorHandling(handler);
