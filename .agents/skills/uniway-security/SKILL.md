---
name: uniway-security
description: Use when touching auth, security, CORS, rate limiting, or input validation in the UniWay repo
---

# UniWay Security

## Auth posture

- All GET /api/* public read-only. No user data, no mutations.
- POST /api/report unauthenticated by design (rate-limited to 30/60s)
- If authenticated write endpoints are added, require Authorization header against configured API key.

## Input guards

- Every external input boundary Zod-validated
- POST /api/report body limited to 10KB via content-length check
- `x-request-id` format guard in middleware: `/^[\w-]{1,64}$/`
- Rate limiting: in-memory, per-IP, configurable window. Default: 100/60s. Report: 30/60s. Search/route: 60/60s.

## CORS & headers

- Same-origin by design (frontend + API single Next.js deployment). No `Access-Control-Allow-Origin`.
- Security headers in `next.config.ts`: X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy (strict-origin-when-cross-origin), Permissions-Policy
- No PII sent to Sentry (`sendDefaultPii: false`)
