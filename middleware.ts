import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createLogger } from "@/lib/logger";

export function middleware(request: NextRequest) {
  const incoming = request.headers.get("x-request-id");
  const requestId = incoming?.match(/^[\w-]{1,64}$/) ? incoming : crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const url = request.nextUrl.pathname + request.nextUrl.search;
  const method = request.method;

  const logger = createLogger(requestId);
  logger.info("request start", { method, url });

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
