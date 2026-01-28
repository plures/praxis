# Copilot Instructions — Decision Ledger First

Praxis is dogfooding its Decision Ledger. When you work on this repo:

- If you add or modify any rule/constraint (`defineRule`, `defineConstraint`, `registerRule`, `registerConstraint`), you **must**:
  - Create/update a contract via `defineContract`.
  - Attach it to `meta.contract` on the rule/constraint.
  - Add/update tests that cover the contract examples and invariants.
  - Update decision-ledger docs if behavior changes.
- Prefer linking to the Decision Ledger docs and contract index when explaining logic changes.
- Run the dogfood checks before you finish:
  - `npm run scan:rules`
  - `npm run validate:contracts`

Reference: `docs/decision-ledger/DOGFOODING.md`
