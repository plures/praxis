# Decision Ledger Dogfooding (Praxis-on-Praxis)

This document defines how Praxis dogfoods the Decision Ledger across the entire repo. The goal is to ensure every rule/constraint has a contract, tests, specs, and a ledger entry that tracks behavior changes over time.

## Goals

- Contracts for **all** rules and constraints.
- Tests for **every** contract example and invariant.
- Specs (TLA+ or Praxis invariants) for each module where feasible.
- Immutable ledger snapshots for every rule ID.
- CI-visible contract coverage and drift detection.

## Dogfood Workflow

### 1) Generate a rule/constraint index (reverse-engineer scan)

This uses the AST analyzer to enumerate `defineRule`/`defineConstraint` usages and capture rule IDs.

```bash
npm run scan:rules
```

Output:
- `docs/decision-ledger/contract-index.json`

The index includes:
- Rule/constraint IDs
- Source file locations
- Simple inference signals (guards, mutations, events) for rules
- Whether a contract is already attached (when statically detectable)

### 2) Add/Update Contracts

For every rule/constraint in the index:

- Define a contract with:
  - `behavior` (canonical description)
  - `examples[]` (Given/When/Then)
  - `invariants[]`
  - `assumptions[]` (explicit, with confidence)
  - `references[]` (docs, tickets)
- Attach via `meta.contract`.

### 3) Add Tests and Specs

- Create tests that directly mirror the Given/When/Then examples.
- Add specs (TLA+ or Praxis invariants) where appropriate.
- Ensure tests are named to include the rule ID (so validation can locate them).

### 4) Validate Contract Coverage

```bash
npm run build
npm run validate:contracts
```

This produces a deterministic report of missing or incomplete contracts and artifacts.

### 5) Emit Contract Gap Payloads (optional assistant handoff)

```bash
node ./dist/node/cli/index.js validate --emit-facts --gap-output docs/decision-ledger/contract-gap.json
```

The gap payload can be used by Copilot or humans to generate tests/specs or refine contracts.

### 6) Write Ledger Snapshots (per rule ID)

After contracts/tests/specs are updated, write ledger snapshots:

```bash
node ./dist/node/cli/index.js validate --ledger docs/decision-ledger/logic-ledger --author "dogfood"
```

## Governance & CI

- Missing contracts/tests/specs are **warnings** during development.
- CI will tighten to **errors** once coverage reaches agreed thresholds.
- All contract-driven changes must update the Behavior Ledger (`docs/decision-ledger/BEHAVIOR_LEDGER.md`) and `LATEST.md`.

## References

- `docs/decision-ledger/BEHAVIOR_LEDGER.md`
- `docs/decision-ledger/LATEST.md`
- `src/decision-ledger/README.md`
