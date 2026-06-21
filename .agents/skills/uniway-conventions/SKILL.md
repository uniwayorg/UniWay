---
name: uniway-conventions
description: Use when writing code in the UniWay repo — commit format, imports, component patterns, testing, architecture
---

# UniWay Conventions

## Git & commits

- Branch: `<name>/<description>` or `uniwayorg/uni-{NUMBER}-{slug}`
- Commit + PR title: `<type>: <description>` (types: feat, fix, chore, refactor, docs, test, ci)
- Squash merge only, no force pushes to shared branches

## Imports

- `@/*` alias → project root
- External deps first, then `@/lib/*`, `@/app/*`
- Named exports preferred

## Component patterns

- App Router: `page.tsx`, `layout.tsx`, `route.ts`
- Route handlers thin — delegate to `lib/`
- Dynamic segments: `[id]/` convention
- No client components unless interactivity required

## Testing

- Co-located: `page.tsx` → `page.test.tsx`
- Integration tests in `tests/`
- MSW for API mocking
- Coverage: 80% lines/funcs/stmts, 70% branches
- happy-dom environment

## Architecture

- Route handler → validate (Zod) → call lib function → format response
- Postgres via `lib/db.ts` (global singleton in dev, Neon)
- Graph algorithms in `lib/routing/` (graphology)
- Spatial queries in `lib/spatial/` (raw SQL, PostGIS)
- Rate limiting: `lib/rate-limit.ts` (in-memory, per-IP)
- `X-Request-Id` correlation via `middleware.ts`
