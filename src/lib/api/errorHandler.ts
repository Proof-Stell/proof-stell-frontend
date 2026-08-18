import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { ZodError } from "zod";

import { generateRequestId, logError, logRequest, logResponse } from "./logger";
import { API_ERROR_CODES, type ApiResponse } from "./types";

/** Default request timeout in milliseconds (30s). */
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Higher-order function that wraps a Next.js API handler with:
 *  - Request ID generation
 *  - Request / response logging (with duration)
 *  - Centralised try/catch error handling
 *  - ZodError → structured validation errors
 *  - Timeout handling
 *  - Normalised `ApiResponse` envelope on failure
 *
 * Usage:
 *   export default withErrorHandling(async (req, res) => { ... });
 */
export function withErrorHandling<T>(
  handler: NextApiHandler<ApiResponse<T>>,
  options?: { timeoutMs?: number },
): NextApiHandler<ApiResponse<T>> {
  return async (req: NextApiRequest, res: NextApiResponse<ApiResponse<T>>) => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    logRequest(req, requestId);

    // Attach requestId to the request object for downstream access.
    (req as NextApiRequest & { requestId: string }).requestId = requestId;

    // Timeout guard via AbortController.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Ensure the timeout is cleared when the response finishes.
    res.on("finish", () => clearTimeout(timeoutId));

    try {
      await Promise.race([
        handler(req, res),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(new TimeoutError(`Request timed out after ${timeoutMs}ms`));
          });
        }),
      ]);

      // If the response has already been sent (handler called res.json/ok/etc.)
      // we just log the completed response.
      if (!res.writableEnded) {
        // Handler did not send a response – send a generic 200.
        res.status(200).json({ success: true, data: null as unknown as T, requestId });
      }

      logResponse(req, requestId, res.statusCode, startTime);
    } catch (error) {
      logError(error, req, requestId);

      // If headers already sent, we cannot change the status – just end.
      if (res.headersSent) {
        logResponse(req, requestId, res.statusCode, startTime);
        return;
      }

      // ZodError → 422 Validation Error (structured field-level errors)
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));

        logResponse(req, requestId, 422, startTime);
        return res.status(422).json({
          success: false,
          requestId,
          error: {
            code: API_ERROR_CODES.VALIDATION_ERROR,
            message: "Request validation failed",
            validationErrors,
          },
        });
      }

      // TimeoutError → 504 Gateway Timeout
      if (error instanceof TimeoutError) {
        logResponse(req, requestId, 504, startTime);
        return res.status(504).json({
          success: false,
          requestId,
          error: {
            code: API_ERROR_CODES.TIMEOUT,
            message: error.message,
          },
        });
      }

      // SyntaxError from JSON.parse → 400 Bad Request
      if (error instanceof SyntaxError && error.message.includes("JSON")) {
        logResponse(req, requestId, 400, startTime);
        return res.status(400).json({
          success: false,
          requestId,
          error: {
            code: API_ERROR_CODES.BAD_REQUEST,
            message: "Malformed JSON in request body",
          },
        });
      }

      // Generic → 500 Internal Error (normalise any unexpected exception)
      const message = "An unexpected error occurred";

      logResponse(req, requestId, 500, startTime);
      return res.status(500).json({
        success: false,
        requestId,
        error: {
          code: API_ERROR_CODES.INTERNAL_ERROR,
          message,
        },
      });
    }
  };
}

/**
 * Sends a 405 Method Not Allowed response with an Allow header.
 */
export function methodNotAllowed(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<never>>,
  allowed: string[],
): void {
  const requestId = (req as NextApiRequest & { requestId: string }).requestId ?? "";
  res.setHeader("Allow", allowed);
  res.status(405).json({
    success: false,
    requestId,
    error: {
      code: API_ERROR_CODES.METHOD_NOT_ALLOWED,
      message: `Method not allowed. Accepted: ${allowed.join(", ")}`,
    },
  });
}

/**
 * Executes an async operation with a timeout. Returns the result or throws a
 * TimeoutError.
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  label: string = "operation",
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () => {
          reject(new TimeoutError(`${label} timed out after ${timeoutMs}ms`));
        });
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Custom error class for timeout conditions.
 */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;
  
  vi.mock("./logger", () => ({
    generateRequestId: () => "test-req-id",
    logRequest: vi.fn(),
    logResponse: vi.fn(),
    logError: vi.fn(),
  }));

  describe("errorHandler", () => {
    it("should mask 500 error messages to prevent sensitive data leaks", async () => {
      const handler = async () => {
        throw new Error("Secret database connection string leaked!");
      };

      const wrapped = withErrorHandling(handler as any);
      const req = {} as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
        on: vi.fn(),
        headersSent: false,
        writableEnded: false,
      } as any;

      await wrapped(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: "An unexpected error occurred",
          }),
        })
      );
    });
  });
}
