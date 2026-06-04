# UniWay

Campus navigation for multi-building, multi-floor university environments. GPS is worthless indoors. Google Maps doesn't model room 3B-204.

Built with Next.js, MapLibre GL JS, and graphology for in-process routing.

## Prerequisites

- [bun](https://bun.sh) (recommended) or npm

## Quick start

```bash
git clone https://github.com/aetosdios27/UniWay.git
cd UniWay
bun install        # or: npm install
bun run dev        # or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Action |
|---|---|
| `bun run dev` | Start dev server |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | ESLint |
| `bun run typecheck` | TypeScript check |
| `bun run test` | Vitest (watch mode) |
| `bun run test:run` | Vitest (one-shot) |
| `bun run test:coverage` | Vitest with coverage |

## Structure

```
app/          — Next.js App Router pages and API routes
lib/          — Business logic, routing, database, schemas
components/   — React components (co-located tests)
public/       — Static assets (PMTiles per campus)
tests/        — Shared test setup
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Maps | MapLibre GL JS |
| Routing | graphology (Dijkstra) |
| Database | Neon (Postgres + PostGIS) |
| Tiles | Cloudflare R2 (PMTiles) |
| Validation | Zod |
| Testing | Vitest + React Testing Library |
| Monitoring | Sentry |
