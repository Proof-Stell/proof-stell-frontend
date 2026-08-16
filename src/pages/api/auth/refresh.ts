import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { methodNotAllowed, withErrorHandling } from "@/lib/api/errorHandler";
import type { ApiResponse } from "@/lib/api/types";
import { verifyJwt, signJwt } from "@/lib/jwt";

const bodySchema = z.object({
  refreshToken: z.string().min(1),
});

type RefreshData = {
  accessToken: string;
  refreshToken: string;
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<RefreshData>>,
) {
  if (req.method !== "POST") {
    return methodNotAllowed(req, res, ["POST"]);
  }

  const requestId = (req as NextApiRequest & { requestId: string }).requestId;

  // 1. CSRF Token Validation
  const csrfCookie = req.cookies.csrf_token;
  const csrfHeader = req.headers["x-csrf-token"];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({
      success: false,
      requestId,
      error: {
        code: "CSRF_ERROR",
        message: "CSRF validation failed. Secure token mismatch.",
      },
    });
  }

  // 2. Refresh Token Validation
  const { refreshToken } = bodySchema.parse(req.body ?? {});
  const decoded = verifyJwt(refreshToken);

  if (!decoded || decoded.type !== "refresh" || typeof decoded.address !== "string") {
    return res.status(401).json({
      success: false,
      requestId,
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or expired refresh token",
      },
    });
  }

  // 3. Issue new access token (15 mins)
  const newAccessToken = signJwt({ address: decoded.address, type: "access" }, 15 * 60);

  return res.status(200).json({
    success: true,
    data: {
      accessToken: newAccessToken,
      refreshToken: refreshToken, // Keep same refresh token
    },
    requestId,
  });
}

export default withErrorHandling(handler);
