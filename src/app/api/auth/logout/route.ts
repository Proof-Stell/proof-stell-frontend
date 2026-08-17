import { NextRequest, NextResponse } from "next/server";
import { withAppRouteErrorHandling } from "@/lib/api/appRouteHandler";

async function handler(req: NextRequest) {
  const requestId = "generated-in-wrapper";
  
  const response = NextResponse.json({
    success: true,
    data: { success: true },
    requestId,
  });

  response.headers.set(
    "Set-Cookie",
    "csrf_token=; Path=/; HttpOnly; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  );

  return response;
}

export const POST = withAppRouteErrorHandling(handler);
