---
name: uniway-pr-workflow
description: Use when creating branches, pushing, opening PRs, merging, or handling branch protection for the UniWay repo
---

# UniWay PR Workflow

## Ironclad rules

1. **NEVER commit to main** — branch protection rejects it
2. **Only branch from origin/main** — `git checkout main && git pull origin main` first, then branch
3. **Verify PR health immediately** after creation — `gh pr view --json title,baseRefName,headRefName,state,mergeable`
4. **One PR at a time** or mark dependencies
5. **Verify after every branch op** — `git log --oneline -3 && git status`
6. **`git branch -v`** to confirm HEAD after any branch switch

## Full workflow

### 0. Pre-start — Linear check

If this work is tracked in Linear (or should be), first consult `docs/LINEAR.md` to find or create the issue. Use the issue number for the branch.

```bash
# Start
git checkout main && git pull origin main
git checkout -b <name>/<desc>             # team PRs: <name>/<desc>
                                          # Linear-tracked: uniwayorg/uni-{NUMBER}-{slug}

# 2. Write code + tests — thin routes, Zod at every boundary

# 3. Pre-flight (before every push)
bun run lint && bun run typecheck && bun run test:run

# 4. Push
git add -A && git commit -m "<type>: <desc>" && git push origin <branch>

# 5. Create PR
gh pr create --base main --head <branch> --title "<type>: <desc>"
# Include "Fixes UNI-{NUMBER}" in PR body for Linear-tracked work

# 5a. Verify PR health (mandatory gate)
gh pr view --json title,baseRefName,headRefName,state,mergeable
# If CONFLICTING: git pull origin main && git push origin <branch>

# 6. Wait for CI — all 4 checks must pass
# PR Title Convention | Lint & Typecheck | Tests & Coverage | Build

# 7. Merge
gh pr merge <number> --squash

# 8. Post-merge reset
git checkout main && git pull origin main && git branch -d <branch>

# 9. Prune stale branches periodically
git branch --merged main | grep -v "\* main" | xargs -r git branch -d
```

## Dependabot scan (before starting new work)

```bash
gh pr list --author app/dependabot --state open
gh api /repos/uniwayorg/uniway/dependabot/alerts --jq '.[] | select(.state=="open") | .security_advisory.severity + ": " + .security_advisory.summary'
```

Handle critical/high alerts before feature work.

## Branch protection

- `main` protected: requires PR + passing CI + conventional commit title
- Direct pushes blocked
- If you hit a protection block: branch off, PR, merge — never force push
