import type { NextApiRequest } from "next";
import { randomUUID } from "crypto";

/**
 * Lightweight request / error / response logger.
 *
 * In production you would swap the console calls for a structured logging
 * library (e.g. pino, winston).  The interface is intentionally thin so the
 * swap is mechanical.
 */

export function generateRequestId(): string {
  return randomUUID();
}

export function logRequest(
  req: NextApiRequest,
  requestId: string,
): void {
  const { method, url, headers } = req;
  console.info(
    JSON.stringify({
      type: "request",
      requestId,
      method,
      url,
      userAgent: headers["user-agent"] ?? null,
      timestamp: new Date().toISOString(),
    }),
  );
}

export function logResponse(
  req: NextApiRequest,
  requestId: string,
  statusCode: number,
  startTime: number,
): void {
  const { method, url } = req;
  const durationMs = Date.now() - startTime;
  console.info(
    JSON.stringify({
      type: "response",
      requestId,
      method,
      url,
      statusCode,
      durationMs,
      timestamp: new Date().toISOString(),
    }),
  );
}

export function logError(
  error: unknown,
  req: NextApiRequest,
  requestId: string,
): void {
  const { method, url } = req;
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const name = error instanceof Error ? error.name : undefined;

  let errorType = "server_error";
  if (name === "ZodError" || name === "SyntaxError") {
    errorType = "client_error";
  } else if (name === "TimeoutError") {
    errorType = "network_timeout";
  }

  console.error(
    JSON.stringify({
      type: "error",
      errorType,
      requestId,
      method,
      url,
      message,
      stack: stack ?? null,
      timestamp: new Date().toISOString(),
    }),
  );
}
