---
name: uniway-infra
description: Use when configuring Sentry, Dependabot, or handling CI/CD/CodeRabbit for UniWay
---

# UniWay Infrastructure

## Sentry

- DSN: `https://4d8133eeb8653543a2a8e110d7212a30@o4511586611232768.ingest.us.sentry.io/4511586626240512`
- Traces sample rate: 0.25
- Source maps uploaded in CI only
- Tunnel route: `/monitoring`
- Config files: `sentry.server.config.ts`, `sentry.edge.config.ts`
- `instrumentation.ts` initializes at runtime

## Dependabot

- Weekly scans (Monday 09:00 UTC), npm ecosystem
- Open-pull-request-limit: 10
- Labels: `dependencies`, `security`
- Commit prefix: `chore`
- Auto-merge patches + minors on passing CI

## CodeRabbit

- Free Pro trial — not guaranteed long-term
- Advisory only; CI/CD pipeline is the authoritative gate
- Valid comments → apply. Invalid → dismiss. Never block merge if CI passes.
