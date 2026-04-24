# Praxis Roadmap

## Role in OASIS
Praxis is the rules and decision ledger layer for OASIS. It enforces consent, policy, lifecycle constraints, and guarantees that agent actions in OASIS remain verifiable and compliant across devices and organizations.

## Current State
v2.6.0 is published with the unified reactive layer, Decision Ledger contracts, rule execution primitives, and PluresDB integration. Recent work added enterprise team management APIs and cloud package extraction; docs and performance initiatives are queued as open issues.

## Milestones

### Phase 1 — Developer Experience + Docs
- Ship Praxis Intent Language (.px) DSL for human‑readable rules and contracts (#339).
- Generate API reference docs from TypeScript sources (#307).
- Publish focused tutorials (getting started, rules, cloud sync) (#308).
- Finish org‑level billing for GitHub Marketplace enterprise plans (#306).

### Phase 2 — Performance + Packaging
- Bundle size optimization and tree‑shaking across packages (#310).
- Rule execution benchmarks and hotspot optimization (#309).
- Complete monorepo migration to package‑level boundaries (core/cli/cloud/svelte).

### Phase 3 — OASIS Policy Runtime
- Consent enforcement pipelines for OASIS privacy‑policy‑engine.
- Cross‑agent audit trails and verifiable policy checks.
- Policy conflict resolution primitives for marketplace negotiations.

### Phase 4 — Enterprise Hardening
- RBAC + audit logging at scale.
- Time‑travel debugging and visual policy inspection.
- Multi‑tenant policy templates and compliance reporting.
