# .px Grammar Rewrite — Execution Tracker

**Goal:** wind-chess.px parses, compiles, and executes end-to-end with the new hybrid grammar.
**Started:** 2026-06-02T23:06Z
**ADR:** `praxis/docs/decision-ledger/decisions/2026-06-02-px-grammar-standardization.md`
**Schema design:** `praxis/docs/decision-ledger/decisions/2026-06-02-px-schema-format.md`

## Target Syntax (from ADR)

- **Declarative** (entity, config, constraint, rule): YAML-style indented key-value, no changes
- **Procedural** (procedure bodies): Rust-style braces, semicolons, `let` bindings, no `$` sigils, no `end` markers
- **Procedure header**: `procedure name:` + indented metadata (trigger, params, given) + `{` body `}`
- **Comments**: both `#` and `//` valid everywhere

## Parallel Streams

| Stream | Agent | Task | Status | Depends On |
|--------|-------|------|--------|------------|
| A: Grammar + Parser | opus | Rewrite grammar.pest + builder.rs for hybrid syntax | 🔄 Active | — |
| B: .px File Migration | sonnet | Rewrite all 35 .px files to new syntax | 🔄 Active | ADR (syntax defined) |
| C: Schema Proc Macro | sonnet | Implement #[derive(PxSchema)] for schema generation | 🔄 Active | — |

## Integration Steps (after streams land)

1. [x] Validate grammar compiles (`cargo build --no-default-features`)
2. [x] Run all unit tests (`cargo test --no-default-features`) — 558 pass
3. [x] Parse wind-chess-v2.px with new grammar
4. [x] Compile wind-chess-v2.px to executor records
5. [x] Execute tick_ship procedure with mock state
6. [x] Validate migrated .px files — **26/34 pass** (8 are non-.px TOML/custom-DSL files marked for migration)
7. [x] Schema generation crate produces valid px-schema.yaml
8. [ ] CI freshness check wired (after merge to main)
9. [ ] Update docs (language guide, tutorials) — needs dedicated pass
10. [x] Full `cargo test --workspace` + `cargo clippy --workspace -- -D warnings` — CLEAN

## Final State

**Branches pushed:**
- `feat/px-grammar-v2` (praxis) — grammar + builder + match/try/parallel + schema crates
- `feat/px-syntax-v2` (pares-radix) — 20 .px files migrated, 2 TOML files renamed
- `feat/px-syntax-v2` (inner-space) — wind-chess migrated, 6 game DSL files marked for migration

**Test results:**
- praxis-native: 558 tests pass, 0 failures, clippy clean
- px-schema: 12 tests pass, clippy clean
- px-schema-derive: 1 test passes, clippy clean
- wind-chess-v2.px: parses ✅ compiles ✅ executes ✅

**Remaining work (non-blocking):**
- 6 inner-space game DSL files need full creative rewrite to .px v2
- Language reference doc update
- Wire schema generation into CI freshness check
- Merge branches to main after review

## Rollback Plan

- All work on branches: `feat/px-grammar-v2` (praxis), `feat/px-syntax-v2` (pares-radix, inner-space)
- Current grammar preserved in git history (commit before rewrite)
- Old .px files preserved in git history
- No force-pushes — all changes are additive until final squash

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-02 | Hybrid syntax: YAML declarative + Rust procedural | Predictable, familiar to Rust/CI audience |
| 2026-06-02 | Trigger outside body (declarative metadata) | Consistent with other declarations |
| 2026-06-02 | No `$` sigils in procedure bodies | Variables are just names, like Rust |
| 2026-06-02 | `let` for new bindings, bare for mutation | Clear intent distinction |
| 2026-06-02 | Both `#` and `//` comments valid | User choice, convention by context |
| 2026-06-02 | No custom constructs | Schema is closed; extensibility via procedures |
| 2026-06-02 | Warn on unknown keys (not error) | Forward compatibility |
| 2026-06-02 | Schema generated from Rust types in CI | C-DRIFT-001: zero manual dependency |
| 2026-06-02 | Jinja2 templating in declarative values | Resolved at load time, before validation |
