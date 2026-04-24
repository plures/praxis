# Praxis Roadmap

## Role in Plures Ecosystem

Praxis is the full-stack declarative application framework — typed logic, reactive state, local-first data, and visual tooling for Svelte, Node, and the browser. It's the core engine powering the Plures ecosystem.

## Current State

**Version 2.0.0** — Shipped. The unified reactive layer (`createApp`), Decision Ledger contracts, official PluresDB integration, and new subpath exports are all in production.

### ✅ Shipped in v2.0

- **Unified Reactive Layer** — `createApp()`, `definePath()`, `query()`, `mutate()`, `batch()`
- **Decision Ledger** — `defineContract()`, `validateContracts()`, CI/CD enforcement
- **RuleResult class** — `.emit()`, `.noop()`, `.skip()`, `.retract()`
- **Official PluresDB** — `createPluresDB()` wrapping `@plures/pluresdb`
- **New exports** — `/unified`, `/expectations`, `/factory`, `/project`, `/mcp`
- **707 tests** across 38 files, including deep QA suite (stress, concurrency, edge cases)

### ✅ Also Complete

- Logic engine (facts, events, rules, constraints), schema system, protocol versioning (v1.0.0)
- Svelte 5 runes integration, component generation, TerminalNode
- Azure Functions relay, GitHub OAuth, Sponsors billing, delta sync
- Conversation ingestion pipeline (deterministic, PII redaction, quality gates, 18 tests)
- C# full parity (1.0.0, 95 tests, NuGet), PowerShell adapter
- Monorepo structure in place (PNPM workspace, package dirs)

## Milestones

### Near-term
- **Intent Language (.px)** — Human-readable DSL for all Praxis primitives (#339)
- **API reference docs** — Generate from TypeScript sources (#307)
- **Focused tutorials** — Getting started, rules, cloud sync (#308)
- **Org-level billing** — GitHub Marketplace enterprise billing (#306)

### Mid-term
- **Bundle size optimization** — Tree-shaking, smaller imports (#310)
- **Rule execution benchmarks** — Profile hotspots, optimize (#309)
- **Monorepo code migration** — Move src/ → packages/ (praxis-core, praxis-cli, praxis-svelte, praxis-cloud)
- **Conversation ingestion v1.1** — Slack/Discord emitters, confidence scores, batch processing
- **Visual tools** — CodeCanvas web UI, real-time collaboration, template library

### Long-term
- **Cross-language expansion** — Python, Go, Rust implementations
- **Enterprise hardening** — SSO (SAML/OIDC), audit logging, RBAC, SLA guarantees
- **Advanced DX** — Time-travel debugging, visual debugger, AI code generation
- **Framework integrations** — React, Vue, Angular, mobile SDKs
- **Edge/WASM** — Compile rules to WebAssembly, deploy to CDN edge

---

**Last Updated**: 2026-04-24
