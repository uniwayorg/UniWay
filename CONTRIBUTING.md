# Contributing to UniWay

## Before you start

Add your SSH public key to the shared `uniwayorg` GitHub account. See
`INSTRUCTION.md` for the steps. Without this, `git push` won't work from
your machine.

## The full workflow (start to finish)

### 1. Start working

```bash
git checkout main
git pull origin main
git checkout -b <your-name>/<short-description>
```

Branch examples: `aetos/add-auth`, `sarah/marker-bug`, `jake/floor-picker`

### 2. Write code

Make your changes, test locally:

```bash
npm run dev          # start dev server
npm run test:run     # run tests once
npm run lint         # check for lint errors
```

### 3. Commit and push

```bash
git add -A                                                    # stage all changes
git commit -m "whatever you want"                             # commit (message doesn't matter)
git push origin <your-name>/<short-description>               # push your branch
```

### 4. Create a pull request

After pushing, GitHub shows a yellow banner with a **"Compare & pull request"** button — click it.

Or from the terminal:

```bash
gh pr create --base main --head <your-name>/<short-description> --title "<type>: <description>"
```

**PR title must follow this format:**

| Type | When | Example |
|---|---|---|
| `feat:` | User sees something new | `feat: add floor switcher to map` |
| `fix:` | Something was broken | `fix: wrong ETA from basement` |
| `chore:` | Config, deps, tooling | `chore: bump next to 16` |
| `refactor:` | Code cleanup, no user change | `refactor: extract Dijkstra to lib/` |
| `docs:` | Docs only | `docs: add setup guide` |
| `test:` | Tests only | `test: cover floor-switch edge cases` |

### 5. Wait for CI (2-3 minutes)

Four checks run automatically. They must all pass before merge:

| Check | What it does |
|---|---|
| PR Title Convention | Title must start with `type: ` |
| Lint & Typecheck | No lint errors, no type errors |
| Tests & Coverage | All tests pass, coverage ≥80% |
| Build | Code compiles |

### 6. Merge

Click **"Merge pull request"** on GitHub — then **"Squash and merge"**.

Or from terminal:

```bash
gh pr merge <number> --squash
```

The branch is deleted automatically after merge.

### 7. Get latest main

```bash
git checkout main
git pull origin main
```

---

## Important: don't push to main directly

`git push origin main` will be rejected. Always use a branch + pull request. This ensures CI checks run before changes land.

---

## Tests

- Tests sit next to the files they test (`page.tsx` → `page.test.tsx`)
- Coverage thresholds: 80% lines, 80% functions, 80% statements, 70% branches
- If your code doesn't meet these thresholds, CI fails and the PR can't merge

---

## Need help?

Ask in the group chat. If something's broken, open an issue.
