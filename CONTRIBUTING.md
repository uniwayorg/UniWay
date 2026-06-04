# Contributing to UniWay

## Branch naming

```
<your-name>/<short-description>
```

Examples: `aetos/add-auth`, `sarah/fix-marker-bug`

## PR titles

Use conventional commits:

| Type | When | Example |
|---|---|---|
| `feat` | New feature | `feat: add campus map markers` |
| `fix` | Bug fix | `fix: marker not rendering on floor 2` |
| `chore` | Tooling, dependencies | `chore: add Sentry error monitoring` |
| `refactor` | Code change, no behavior change | `refactor: extract route parser to lib/` |
| `docs` | Documentation only | `docs: add README with architecture diagram` |
| `style` | Formatting, styling | `style: format tailwind classes` |
| `test` | Adding or fixing tests | `test: add coverage for route assembly` |

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
