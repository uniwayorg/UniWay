# Contributing to UniWay

## Branch naming

```
<your-name>/<short-description>
```

Examples: `aetos/add-auth`, `sarah/fix-marker-bug`

## PR titles

Use conventional commits. Pick the type based on what the PR *does*, not what files it touches:

| Type | When | Example PR |
|---|---|---|
| `feat` | User sees something new | `feat: highlight fastest route on map` |
| `fix` | Something was broken, now it's not | `fix: wrong ETA when starting from basement` |
| `chore` | Dev tooling, dependencies, config | `chore: bump next to 16, eslint to 10` |
| `refactor` | Code moved or cleaned up, nothing changes for user | `refactor: move Dijkstra to lib/routing/graph.ts` |
| `docs` | Only documentation files | `docs: add setup guide to README` |
| `style` | Formatting, indentation, whitespace — no code logic changes | `style: remove trailing whitespace` |
| `test` | Adding or updating tests, no production code changes | `test: cover floor-switch edge cases` |

## Merge policy

- **Squash merge** all PRs into `main`
- Keep branches short-lived (hours to days, not weeks)

## CI

Four checks run on every PR:

1. **PR Title Convention** — title must start with `type: `
2. **Lint & Typecheck** — `eslint` + `tsc --noEmit`
3. **Tests & Coverage** — `vitest run --coverage` (must meet thresholds)
4. **Build** — `next build` (must compile)

All four must pass before merge. PR merges automatically when they do.

## Tests

- Tests are co-located next to source files (`page.tsx` → `page.test.tsx`)
- Coverage thresholds: 80% lines, 80% functions, 80% statements, 70% branches
- Write tests before or alongside implementation
