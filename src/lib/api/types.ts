/**
 * Standardised API response envelope used across all Next.js API routes.
 *
 * Every shape below is backed by a Zod schema so that responses can be
 * validated at runtime before they reach components, catching contract
 * drift between the API and the frontend early.
 */

import { z } from "zod";

/**
 * Zod schema for a single field-level validation error.
 *
 * @example
 * const result = apiErrorSchema.safeParse(payload);
 */
export const apiValidationErrorSchema = z.object({
  field: z.string().describe("Name of the field that failed validation"),
  message: z.string().describe("Human-readable explanation of the failure"),
});

/** Type of a single field-level validation error. */
export type ApiValidationError = z.infer<typeof apiValidationErrorSchema>;

/**
 * Zod schema for the error object carried by unsuccessful responses.
 *
 * @example
 * const result = apiErrorSchema.safeParse(payload);
 */
export const apiErrorSchema = z.object({
  code: z.string().describe("Well-known machine-readable error code"),
  message: z.string().describe("Human-readable error description"),
  validationErrors: z
    .array(apiValidationErrorSchema)
    .optional()
    .describe("Field-level validation errors (validation failures only)"),
});

/** Type of the error object carried by unsuccessful responses. */
export type ApiError = z.infer<typeof apiErrorSchema>;

/**
 * Factory for the Zod schema of the standard response envelope.
 *
 * Returns a discriminated union schema:
 *  - `{ success: true,  data, requestId }` on success
 *  - `{ success: false, error, requestId }` on failure
 *
 * @param dataSchema - Zod schema for the success payload `T`.
 * @returns A union schema validating the full envelope.
 *
 * @example
 * const schema = apiResponseSchema(z.object({ name: z.string() }));
 */
export function apiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.union([
    z.object({
      success: z.literal(true),
      data: dataSchema.describe("Success payload"),
      requestId: z.string().describe("Correlation ID for the request"),
    }),
    z.object({
      success: z.literal(false),
      error: apiErrorSchema,
      requestId: z.string().describe("Correlation ID for the request"),
    }),
  ]);
}

/** Type of the standardised API response envelope. */
export type ApiResponse<T> =
  | { success: true; data: T; requestId: string }
  | { success: false; error: ApiError; requestId: string };

/**
 * Well-known error codes returned by the API layer.
 */
export const API_ERROR_CODES = {
  INTERNAL_ERROR: "INTERNAL_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
  NOT_FOUND: "NOT_FOUND",
  TIMEOUT: "TIMEOUT",
  BAD_REQUEST: "BAD_REQUEST",
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
