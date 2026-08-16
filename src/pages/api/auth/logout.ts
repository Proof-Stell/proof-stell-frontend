import type { NextApiRequest, NextApiResponse } from "next";
import { methodNotAllowed, withErrorHandling } from "@/lib/api/errorHandler";
import type { ApiResponse } from "@/lib/api/types";

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<{ success: boolean }>>,
) {
  if (req.method !== "POST") {
    return methodNotAllowed(req, res, ["POST"]);
  }

  const requestId = (req as NextApiRequest & { requestId: string }).requestId;

  // Clear CSRF cookie by setting an expired date
  res.setHeader(
    "Set-Cookie",
    "csrf_token=; Path=/; HttpOnly; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  );

  return res.status(200).json({
    success: true,
    data: { success: true },
    requestId,
  });
}

export default withErrorHandling(handler);
