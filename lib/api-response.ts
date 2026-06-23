// Auth posture: all GET /api/* routes are public read-only. No user data, no mutations.
// The only write endpoint (POST /api/report) accepts unauthenticated submissions.
// If authenticated write endpoints are added, require an Authorization header validated
// against a configured API key before this statement changes.
//
// CORS posture: same-origin by design. The frontend and API are served from the same
// Next.js deployment. No Access-Control-Allow-Origin header is set, so browsers apply
// the default same-origin policy. If a separate mobile client or third-party consumer
// is added, add an explicit origin in next.config.ts headers.

import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { createLogger } from "@/lib/logger";

export const ApiErrorCode = {
  BAD_REQUEST: "BAD_REQUEST",
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
} as const;

export type ApiErrorCodeType = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

export interface PaginationParams {
  offset: number;
  limit: number;
}

const MAX_OFFSET = 10_000;

export function parsePagination(
  searchParams: URLSearchParams,
  defaultLimit = 20,
  maxLimit = 100
): PaginationParams {
  const rawOffset = parseInt(searchParams.get("offset") || "", 10);
  const rawLimit = parseInt(searchParams.get("limit") || "", 10);
  const offset = Math.min(
    Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0,
    MAX_OFFSET
  );
  const limit = Math.min(
    Number.isFinite(rawLimit) && rawLimit >= 1 ? rawLimit : defaultLimit,
    maxLimit
  );
  return { offset, limit };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  pagination: PaginationParams,
  maxAge = 300
): NextResponse {
  return NextResponse.json(
    { data, pagination: { offset: pagination.offset, limit: pagination.limit, total } },
    { headers: cacheHeaders(maxAge) }
  );
}

export function cacheHeaders(maxAgeSeconds: number, staleWhileRevalidate = 86400): HeadersInit {
  if (!Number.isFinite(maxAgeSeconds) || maxAgeSeconds < 0) {
    throw new Error(`Invalid maxAgeSeconds: ${maxAgeSeconds}`);
  }
  if (!Number.isFinite(staleWhileRevalidate) || staleWhileRevalidate < 0) {
    throw new Error(`Invalid staleWhileRevalidate: ${staleWhileRevalidate}`);
  }
  return {
    "Cache-Control": `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidate}`,
  };
}

export function successResponse(data: unknown, status = 200, maxAge?: number): NextResponse {
  return NextResponse.json(
    { data },
    { status, headers: maxAge !== undefined ? cacheHeaders(maxAge) : undefined }
  );
}

export function apiError(
  error: unknown,
  context: string,
  request?: Request,
  status = 500
): NextResponse {
  const requestId = request?.headers.get("x-request-id") ?? crypto.randomUUID();
  const logger = createLogger(requestId);
  Sentry.captureException(error, { extra: { context, requestId } });
  logger.error(context, { error: String(error) });
  return NextResponse.json(
    { error: "Internal Server Error", code: ApiErrorCode.INTERNAL_ERROR, requestId },
    { status, headers: { "X-Request-Id": requestId } }
  );
}

export function badRequest(
  message: string,
  details?: { field: string; message: string }[],
  code?: ApiErrorCodeType,
  request?: Request
): NextResponse {
  const requestId = request?.headers.get("x-request-id") ?? crypto.randomUUID();
  const body: Record<string, unknown> = { error: message, code: code ?? ApiErrorCode.BAD_REQUEST, requestId };
  if (details && details.length > 0) body.details = details;
  return NextResponse.json(body, { status: 400, headers: { "X-Request-Id": requestId } });
}

export async function validateBodySize(request: Request, maxBytes: number): Promise<{ ok: true; body: string } | { ok: false; response: NextResponse }> {
  const contentLength = parseInt(request.headers.get("content-length") ?? "0", 10);
  if (contentLength > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: `Request body exceeds maximum size of ${maxBytes} bytes`,
          code: ApiErrorCode.PAYLOAD_TOO_LARGE,
          requestId: request.headers.get("x-request-id") ?? crypto.randomUUID(),
        },
        { status: 413, headers: { "X-Request-Id": request.headers.get("x-request-id") ?? crypto.randomUUID() } }
      ),
    };
  }

  const body = await request.text();
  if (body.length > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: `Request body exceeds maximum size of ${maxBytes} bytes`,
          code: ApiErrorCode.PAYLOAD_TOO_LARGE,
          requestId: request.headers.get("x-request-id") ?? crypto.randomUUID(),
        },
        { status: 413, headers: { "X-Request-Id": request.headers.get("x-request-id") ?? crypto.randomUUID() } }
      ),
    };
  }

  return { ok: true, body };
}

export function notFound(
  message: string,
  code?: ApiErrorCodeType,
  request?: Request
): NextResponse {
  const requestId = request?.headers.get("x-request-id") ?? crypto.randomUUID();
  const body: Record<string, unknown> = { error: message, code: code ?? ApiErrorCode.NOT_FOUND, requestId };
  return NextResponse.json(body, { status: 404, headers: { "X-Request-Id": requestId } });
}

export function formatZodError(error: ZodError): { field: string; message: string }[] {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join(".") : "_root",
    message: issue.message,
  }));
}

export const AccessibleBool = z
  .enum(["true", "false"])
  .transform((v) => v === "true")
  .optional();

const COORD_REGEX = /^-?\d+(\.\d+)?$/;

export const CoordString = (min: number, max: number) =>
  z
    .string()
    .regex(COORD_REGEX)
    .transform(Number)
    .pipe(z.number().min(min).max(max).finite());
