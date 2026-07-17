import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { methodNotAllowed, withErrorHandling } from "@/lib/api/errorHandler";
import type { ApiResponse } from "@/lib/api/types";

type CompoData = {
  name: string;
};

const bodySchema = z.object({
  component: z.string().min(1).max(100).optional(),
});

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<CompoData>>,
) {
  if (req.method !== "GET" && req.method !== "POST") {
    return methodNotAllowed(req, res, ["GET", "POST"]);
  }

  const requestId = (req as NextApiRequest & { requestId: string }).requestId;

  if (req.method === "POST") {
    const { component } = bodySchema.parse(req.body ?? {});
    return res.status(200).json({
      success: true,
      data: { name: component ?? "Component returned" },
      requestId,
    });
  }

  return res.status(200).json({
    success: true,
    data: { name: "Component returned" },
    requestId,
  });
}

export default withErrorHandling(handler);
