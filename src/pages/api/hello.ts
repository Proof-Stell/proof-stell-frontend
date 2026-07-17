import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { methodNotAllowed, withErrorHandling } from "@/lib/api/errorHandler";
import type { ApiResponse } from "@/lib/api/types";

type HelloData = {
  name: string;
};

const querySchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<HelloData>>,
) {
  if (req.method !== "GET") {
    return methodNotAllowed(req, res, ["GET"]);
  }

  const requestId = (req as NextApiRequest & { requestId: string }).requestId;
  const { name } = querySchema.parse(req.query);

  return res.status(200).json({
    success: true,
    data: { name: name ?? "John Doe" },
    requestId,
  });
}

export default withErrorHandling(handler);
