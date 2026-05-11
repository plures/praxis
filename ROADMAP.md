# Praxis Roadmap

## Role in OASIS
Praxis is the rules and decision‑ledger layer for OASIS. It enforces consent, policy, lifecycle constraints, and guarantees that agent actions remain verifiable and compliant across devices and organizations.

## Current State
- **v2.6.0** published with the unified reactive layer, Decision Ledger contracts, rule execution primitives, and PluresDB integration.
- Recent work added enterprise team management APIs and CLI support.
- Open issues center on the Praxis Intent Language (.px), API docs, tutorials, billing, and CI noise.

## Milestones

### Phase 1 — Developer Experience + Docs
- Ship Praxis Intent Language (.px) DSL for human‑readable rules and contracts (#339).
- Generate API reference docs from TypeScript sources (#307).
- Publish focused tutorials (getting started, rules, cloud sync) (#308).
- Finish org‑level billing for GitHub Marketplace enterprise plans (#306).
- Resolve current CI failures to unblock releases.

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
