import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { methodNotAllowed, withErrorHandling } from "@/lib/api/errorHandler";
import {
  apiResponseSchema,
  API_ERROR_CODES,
  type ApiResponse,
} from "@/lib/api/types";

type CompoData = {
  name: string;
};

const bodySchema = z.object({
  component: z.string().min(1).max(100).optional(),
});

/** Zod schema for the success payload returned by this route. */
const compoDataSchema = z.object({
  name: z.string().min(1).describe("Name of the inspected component"),
});

/** Zod schema for the full response envelope of this route. */
const compoResponseSchema = apiResponseSchema(compoDataSchema);

/**
 * Sends a response whose envelope has passed runtime validation. If the
 * payload ever stops matching the schema (e.g. after a refactor), the route
 * fails loudly instead of emitting an invalid envelope.
 */
function sendValidatedResponse(
  res: NextApiResponse<ApiResponse<CompoData>>,
  requestId: string,
  data: CompoData,
) {
  const parsed = compoResponseSchema.safeParse({
    success: true as const,
    data,
    requestId,
  });

  if (!parsed.success) {
    return res.status(500).json({
      success: false,
      requestId,
      error: {
        code: API_ERROR_CODES.INTERNAL_ERROR,
        message: "Response failed runtime validation",
      },
    });
  }

  return res.status(200).json(parsed.data);
}

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
    return sendValidatedResponse(res, requestId, {
      name: component ?? "Component returned",
    });
  }

  return sendValidatedResponse(res, requestId, { name: "Component returned" });
}

export default withErrorHandling(handler);
