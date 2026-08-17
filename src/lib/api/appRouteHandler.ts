import { NextResponse, NextRequest } from "next/server";
import { ZodError } from "zod";
import { generateRequestId, logError, logRequest, logResponse } from "./logger";
import { API_ERROR_CODES, type ApiResponse } from "./types";
import { TimeoutError } from "./errorHandler";

const DEFAULT_TIMEOUT_MS = 30_000;

export function withAppRouteErrorHandling<T>(
  handler: (req: NextRequest, ctx: any) => Promise<NextResponse<ApiResponse<T>>>,
  options?: { timeoutMs?: number }
) {
  return async (req: NextRequest, ctx: any) => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    logRequest(req as any, requestId); // Mocking for logger

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await Promise.race([
        handler(req, ctx),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(new TimeoutError(`Request timed out after ${timeoutMs}ms`));
          });
        }),
      ]);

      clearTimeout(timeoutId);
      logResponse(req as any, requestId, response.status, startTime);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      logError(error, req as any, requestId);

      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        logResponse(req as any, requestId, 422, startTime);
        return NextResponse.json(
          {
            success: false,
            requestId,
            error: {
              code: API_ERROR_CODES.VALIDATION_ERROR,
              message: "Request validation failed",
              validationErrors,
            },
          },
          { status: 422 }
        );
      }

      if (error instanceof TimeoutError) {
        logResponse(req as any, requestId, 504, startTime);
        return NextResponse.json(
          {
            success: false,
            requestId,
            error: {
              code: API_ERROR_CODES.TIMEOUT,
              message: error.message,
            },
          },
          { status: 504 }
        );
      }

      if (error instanceof SyntaxError && error.message.includes("JSON")) {
        logResponse(req as any, requestId, 400, startTime);
        return NextResponse.json(
          {
            success: false,
            requestId,
            error: {
              code: API_ERROR_CODES.BAD_REQUEST,
              message: "Malformed JSON in request body",
            },
          },
          { status: 400 }
        );
      }

      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      logResponse(req as any, requestId, 500, startTime);
      return NextResponse.json(
        {
          success: false,
          requestId,
          error: {
            code: API_ERROR_CODES.INTERNAL_ERROR,
            message,
          },
        },
        { status: 500 }
      );
    }
  };
}
