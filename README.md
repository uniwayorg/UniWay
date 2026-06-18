# UniWay

Campus navigation for places GPS can't reach.

Universities are not grids. They're multi-building, multi-floor labyrinths with room numbers that only make sense to the registrar. Google Maps stops at the front door. UniWay starts there — routing you to room 3B-204, not just "Building 3."

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  MapLibre   │────▶│  Next.js API  │────▶│  graphology     │
│  (browser)  │     │  routes       │     │  (Dijkstra)     │
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │
                    ┌──────▼───────┐     ┌─────────────────┐
                    │  Neon/PSQL   │     │  R2 (PMTiles)   │
                    │  (PostGIS)   │     │  (tile server?) │
                    └──────────────┘     └─────────────────┘
```

No tile server process. Routing lives in the application layer. Zero vendor lock-in on rendering.

## Quick start

```bash
git clone git@github.com:uniwayorg/UniWay.git
cd UniWay
bun install
cp .env.example .env.local    # fill in your creds
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Prerequisites:** [bun](https://bun.sh) (preferred) or npm.

## Scripts

| Command | Action |
|---|---|
| `bun run dev` | Dev server (HMR) |
| `bun run build` | Production build |
| `bun run lint` | ESLint |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run test` | Vitest watch |
| `bun run test:run` | Vitest one-shot |
| `bun run test:coverage` | Vitest + coverage thresholds (80/80/80/70) |

## Project structure

```
app/          — Next.js App Router: pages, API routes, error boundary
lib/          — Domain logic: routing, spatial queries, db, Zod schemas
components/   — React components, each with co-located tests
public/tiles/ — PMTiles per campus (static, served from R2 in prod)
tests/        — Shared test setup (vitest globals, mocks)
```

Tests sit next to their source files. No separate `__tests__` directory.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) | SSR, API routes, one deploy |
| Maps | MapLibre GL JS | BSD-3, not Mapbox |
| Routing | graphology | In-process Dijkstra, no server needed |
| Database | Neon (Postgres + PostGIS) | Free tier, spatial queries |
| Tiles | Cloudflare R2 | $0/month, static PMTiles |
| Validation | Zod | Type-safe, composable |
| Testing | Vitest + RTL + happy-dom | Fast, no browser |
| Monitoring | Sentry | Tunneled, uBlock-safe |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) — branch naming, PR titles, merge policy, CI expectations. Five rules, read them.
