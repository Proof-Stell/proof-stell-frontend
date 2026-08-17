import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAppRouteErrorHandling } from "@/lib/api/appRouteHandler";
import { verifyJwt, signJwt } from "@/lib/jwt";

const bodySchema = z.object({
  refreshToken: z.string().min(1),
});

async function handler(req: NextRequest) {
  const requestId = "generated-in-wrapper";
  
  const csrfCookie = req.cookies.get("csrf_token")?.value;
  const csrfHeader = req.headers.get("x-csrf-token");

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return NextResponse.json({
      success: false,
      requestId,
      error: {
        code: "CSRF_ERROR",
        message: "CSRF validation failed. Secure token mismatch.",
      },
    }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { refreshToken } = bodySchema.parse(body);
  const decoded = verifyJwt(refreshToken);

  if (!decoded || decoded.type !== "refresh" || typeof decoded.address !== "string") {
    return NextResponse.json({
      success: false,
      requestId,
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or expired refresh token",
      },
    }, { status: 401 });
  }

  const newAccessToken = signJwt({ address: decoded.address, type: "access" }, 15 * 60);

  return NextResponse.json({
    success: true,
    data: {
      accessToken: newAccessToken,
      refreshToken: refreshToken,
    },
    requestId,
  });
}

export const POST = withAppRouteErrorHandling(handler);
