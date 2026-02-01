# Repo Migration Policy (Plures → Praxis)

This document defines how we decide whether a repo joins the Praxis monorepo, and what we do with the old repo after migration.

## Categories
- **Join Praxis (package)**: shared libraries/tooling that should live under `packages/`.
- **Join Praxis (app)**: apps hosted under `apps/`.
- **Standalone**: independent products/apps (own lifecycle), still managed with standards.
- **Fork/external mirror**: minimal touch.

## Decisions already made
- `runebook`: **standalone**
- `kno-eng` and `knoeng-vscode-ext`: **join Praxis (good parts only)**, then freeze old repos

## Evaluation rubric (fast)
A repo should join Praxis if it has 2+ of:
- shares core primitives (ledger/governance/contracts, plures-db)
- benefits from shared developer experience + tooling
- duplicated logic across repos
- needs tight coupling/release coordination

A repo stays standalone if it has 2+ of:
- independent release cadence / distribution channel
- distinct security posture
- large surface area unrelated to Praxis core

## Migration approach
Preferred order:
1) **Extract + re-author** the valuable parts as a new package in Praxis (`packages/<name>`)
2) Keep old repo history intact; freeze old repo to avoid breaking links

## Freeze plan for old repos (non-destructive)
- Update README with a clear banner:
  - “Moved to plures/praxis at <path>”
  - link to new location
- Pin/lock an issue “Repo moved”
- Optional: set repo to read-only / archive once stable
- No deletes; preserve history

## Local-first operations
- Always use local clones for code inspection.
- Treat GitHub as the interface for PRs/issues/CI only.
