# UniWay — Full Repo Setup Guide

Everything a co-founder needs to clone, run, test, and ship. No fluff.

---

## Prerequisites

- **Node.js 20+** or **bun** (recommended — faster, [install](https://bun.sh))
- Access to the shared `uniwayorg` GitHub account
- Cloud service accounts (only needed when you provision them):
  - Neon (Postgres + PostGIS) — `DATABASE_URL`
  - Cloudflare R2 — tile hosting
  - Sentry — error monitoring

---

## SSH key setup (one-time)

We all share the `uniwayorg` GitHub account. Each person adds their own SSH
key so `git push` works from their machine.

```bash
# 1. Generate a key (use your personal email)
ssh-keygen -t ed25519 -C "your@email.com"

# 2. Print the public key
cat ~/.ssh/id_ed25519.pub
```

Copy the output. Then go to `github.com/settings/keys` while logged into the
`uniwayorg` account → **New SSH key** → paste → save.

Multiple SSH keys can be added to the same account — one per machine. All
authenticate as `uniwayorg`.

---

## 1. Getting Started

```bash
git clone git@github.com:uniwayorg/UniWay.git
cd UniWay
bun install            # or npm install
cp .env.example .env.local
bun run dev            # http://localhost:3000
```

Both `bun` and `npm` work interchangeably for all scripts. Bun is faster. Pick one.

---

## 2. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | For API routes | Neon Postgres connection string with PostGIS |
| `R2_ACCOUNT_ID` | For tiles | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | For tiles | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | For tiles | Cloudflare R2 secret key |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | For tiles | Public R2 bucket URL for PMTiles |
| `NEXT_PUBLIC_SENTRY_DSN` | For monitoring | Sentry project DSN (client-side) |

**Note:** No auth in V1. Every API route is public. Rate limiting is the only access control — add when API routes ship.

---

## 3. Development Workflow

### Branch naming

```
<your-name>/<short-description>
```

Examples: `aetos/add-auth`, `sarah/fix-marker-bug`, `jake/floor-picker`

### Making changes

```bash
git checkout main && git pull
git checkout -b <name>/<description>
# code + test
bun run test:run      # verify tests pass
bun run lint          # verify lint
bun run typecheck     # verify types
git add <files>
git commit -m "<type>: <description>"   # conventional commit
git push origin <name>/<description>
```

### Creating a PR

```bash
gh pr create \
  --base main \
  --head <branch> \
  --title "<type>: <description>" \
  --body "<summary>"
```

PR titles must follow conventional commits — this becomes the permanent commit on `main`.

### Merge

PRs merge automatically when all CI checks pass. **Squash merge only.** No review approval required (3-person team; reviews block velocity on trivial changes).

### Branch cleanup

Remote branches auto-delete on merge (setting is ON). Clean up locally:

```bash
git branch -d <branch>
git remote prune origin
```

---

## 4. Scripts

| Command | Action |
|---|---|
| `bun run dev` | Dev server with HMR |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | ESLint (flat config, typescript-eslint) |
| `bun run typecheck` | `tsc --noEmit` (strict mode) |
| `bun run test` | Vitest watch mode |
| `bun run test:run` | Vitest one-shot |
| `bun run test:coverage` | Vitest + coverage report |

All scripts work with `npm run` if you don't have bun.

---

## 5. Testing

- **Framework:** Vitest + React Testing Library + happy-dom
- **Location:** Tests sit next to source files (`page.tsx` → `page.test.tsx`)
- **Setup:** `tests/setup.ts` — imports `@testing-library/jest-dom`
- **Coverage thresholds:**
  - Lines: 80%
  - Functions: 80%
  - Statements: 80%
  - Branches: 70%

```bash
bun run test           # watch mode
bun run test:run       # one-shot (quick check)
bun run test:coverage  # full coverage report
```

Coverage thresholds are enforced in CI. If your PR drops below them, it won't merge.

---

## 6. CI/CD Pipeline (GitHub Actions)

Four jobs run on every PR to `main`:

| Job | Command | Fails if... |
|---|---|---|
| PR Title Convention | `grep` on PR title | Title doesn't match `type: description` |
| Lint & Typecheck | `eslint .` + `tsc --noEmit` | Lint errors or type errors |
| Tests & Coverage | `vitest run --coverage` | Test failures or coverage below thresholds |
| Build | `next build` | Compilation errors |

**Pipeline runs on `oven-sh/setup-bun`** — fast, no Node.js version management.

PR will not merge until all four are green. PR auto-merges when they pass.

### Code Scanning (CodeQL)

Runs on every PR and every push to `main`. Scans for security vulnerabilities and quality issues. Results appear under the PR's "Security" tab.

---

## 7. Dependabot (Dependency Updates)

- **Schedule:** Weekly, Monday 09:00 UTC
- **Ecosystem:** npm
- **Open PRs:** Up to 10 at a time
- **Labels:** `dependencies`, `security`

**How to handle:**
- **Security bumps:** Merge immediately — they fix CVEs
- **Version bumps:** Merge during normal workflow (tests cover regressions)

---

## 8. Sentry (Error Monitoring)

### How it's set up

4 config files handle different runtimes:

| File | Runtime |
|---|---|
| `sentry.server.config.ts` | Node.js server |
| `sentry.edge.config.ts` | Edge runtime |
| `instrumentation-client.ts` | Browser (client) |
| `instrumentation.ts` | Auto-loader (server + edge) |

Plus `app/global-error.tsx` — catches errors at the root layout boundary.

### Key settings

- `tracesSampleRate: 0.25` — 25% sampling (cost-conscious, not the 100% wizard default)
- `sendDefaultPii: false` — no personal data
- Source maps uploaded during CI build via `SENTRY_AUTH_TOKEN` GitHub secret
- Errors tunneled through `/monitoring` (evades ad blockers like uBlock Origin)

### Provisioning a new Sentry project

1. Create a Sentry org + project for UniWay
2. Copy the new DSN into all 4 config files above
3. Generate a `SENTRY_AUTH_TOKEN` in Sentry Settings → Auth Tokens
4. Add it as a GitHub Actions secret: `SENTRY_AUTH_TOKEN`
5. Update `next.config.ts` — the `withSentryConfig` wrapper needs `org` and `project` to match your Sentry org/project

**The DSN is hardcoded in 4 files.** If you change it, update all 4.

---

## 9. Code Quality

### TypeScript

- `strict: true` in `tsconfig.json`
- Path alias `@/` → project root
- `tsc --noEmit` run in CI

### ESLint

- Flat config via `typescript-eslint`
- Ignores `.next/`, `node_modules/`, `coverage/`
- Config file: `eslint.config.mjs`

### Lint + typecheck locally before pushing

```bash
bun run lint
bun run typecheck
```

---

## 10. Security Headers

Applied to every route in `next.config.ts`:

| Header | Value | Why |
|---|---|---|
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Privacy-preserving referrer |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(self)` | Feature restrictions |

**CSP is deferred** — will be added once R2 tile URLs and MapLibre sources are finalized.

### Vulnerability reporting

See `SECURITY.md` — report via GitHub Private Vulnerability Reporting or email.

---

## 11. GitHub Repository Settings (Admin)

Applied once via `gh api`. If you need to re-create them on a new org:

- **PR required** on `main`
- **Required checks:** PR Title Convention, Lint & Typecheck, Tests & Coverage, Build
- **Strict up-to-date** — branch must be rebased on latest `main`
- **Linear history** — no merge commits
- **Enforce on admins** — yes
- **Force pushes** — blocked
- **Deletions** — blocked
- **Auto-merge** — enabled
- **Delete branch on merge** — enabled

---

## 12. Architecture Overview

### Routes

| Route | Purpose |
|---|---|
| `GET /api/campus/[id]` | Campus metadata (buildings, floors, POI counts) |
| `GET /api/route?from=<node>&to=<node>&accessibility=<bool>` | Shortest path |
| `GET /api/search?q=<query>&campus=<id>` | Full-text POI search |
| `POST /api/report` | Obstruction report (V1) |

### Directory structure

```
app/               — Pages, API routes, layouts, error boundaries
lib/               — Business logic (routing, spatial, db, schemas)
  routing/         — Graphology graph + Dijkstra + route assembly
  spatial/         — PostGIS proximity queries
  schemas/         — Zod schemas shared with API routes
  db.ts            — Neon connection pool
  cache.ts         — LRU route result cache (24h TTL)
components/        — React components with co-located tests
public/tiles/      — PMTiles static files (served from R2 in production)
tests/             — Shared test setup
```

### Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js (App Router) | SSR, API routes, single deploy |
| Language | TypeScript (strict) | Type safety everywhere |
| Styling | Tailwind CSS 4 | Utility-first, zero runtime |
| Maps | MapLibre GL JS | BSD-3 license, not Mapbox |
| Routing (V1) | graphology | In-process Dijkstra, no server needed |
| Database | Neon (Postgres + PostGIS) | Free tier, spatial queries |
| Tiles | Cloudflare R2 + PMTiles | $0/month, no tile server process |
| Validation | Zod | Type-safe, composable schemas |
| Testing | Vitest + RTL + happy-dom | Fast, no browser dependency |
| Monitoring | Sentry | Tunneled, uBlock-safe |

---

## 13. License

Apache 2.0 — copyright "UniWay Contributors." See `LICENSE.md`.

Covers code only. Geodata (floor plans, building maps, room layouts) is not in this repo and is licensed separately.

---

## 14. Common Pitfalls

- **Don't commit to `main` directly** — branch protection blocks it. Always use a PR.
- **Don't force push** — blocked at the repo level.
- **If CI gets stuck** — admin can merge with `gh pr merge <number> --squash --admin` (bypasses checks). Use only in emergencies.
- **If you push to a merged branch** — it re-creates orphan commits. Check `gh pr view <number> --json state` first.
- **DSN is hardcoded in 4 files** — if you change Sentry project, update all of them.
- **Coverage thresholds exist** — write tests alongside your code.
