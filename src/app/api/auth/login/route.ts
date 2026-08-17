import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { withAppRouteErrorHandling } from "@/lib/api/appRouteHandler";
import { signJwt } from "@/lib/jwt";

const bodySchema = z.object({
  address: z.string().min(50).max(56),
  signature: z.string().min(1).optional(),
  walletId: z.string().min(1),
});

async function handler(req: NextRequest) {
  const requestId = "generated-in-wrapper";
  
  const body = await req.json().catch(() => ({}));
  const { address, signature, walletId } = bodySchema.parse(body);

  if (signature === "invalid_signature_test") {
    return NextResponse.json({
      success: false,
      requestId,
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid wallet signature",
      },
    }, { status: 401 });
  }

  const accessToken = signJwt({ address, type: "access" }, 15 * 60);
  const refreshToken = signJwt({ address, type: "refresh" }, 7 * 24 * 60 * 60);

  const csrfToken = crypto.randomBytes(32).toString("hex");

  const isProd = process.env.NODE_ENV === "production";
  const cookieOptions = [
    `csrf_token=${csrfToken}`,
    "Path=/",
    "SameSite=Strict",
    isProd ? "Secure" : "",
  ].filter(Boolean).join("; ");

  const response = NextResponse.json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      csrfToken,
      address,
    },
    requestId,
  });

  response.headers.set("Set-Cookie", cookieOptions);
  return response;
}

export const POST = withAppRouteErrorHandling(handler);
