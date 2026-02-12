# Dogfooding Checklist

This document provides daily, weekly, and monthly checklists to ensure we're actively dogfooding Plures tools and filing issues when friction is discovered.

## Philosophy

**Dogfooding = Using + Observing + Reporting**

We dogfood to:
- Find friction before users do
- Validate our tools work in real scenarios
- Generate actionable improvements
- Build empathy with users

**Key Principle:** Prefer small, high-signal issues over comprehensive reports. File friction immediately when encountered.

---

## Daily Development Workflow

### Before Starting Work

- [ ] **Pull Latest**: Ensure you have the latest changes
  ```bash
  git pull origin main
  ```

- [ ] **Build & Validate**: Run the build and validation
  ```bash
  npm run build
  npm run validate:contracts
  ```

- [ ] **Check for Failures**: Review any contract validation warnings
  - If warnings exist, assess if they relate to your work
  - File dogfooding issue if validation is unclear or unhelpful

### During Development

When adding or modifying rules/constraints:

- [ ] **Define Contract**: Create contract via `defineContract()`
  ```typescript
  const myContract = defineContract({
    behavior: "Clear description of what this does",
    examples: [/* Given/When/Then scenarios */],
    invariants: [/* Constraints that must hold */],
    assumptions: [/* Explicit assumptions with confidence */],
    references: [/* Links to docs, issues, discussions */]
  });
  ```

- [ ] **Attach Contract**: Add to rule/constraint meta
  ```typescript
  const myRule = defineRule({
    id: 'module.action',
    meta: { contract: myContract },
    // ...
  });
  ```

- [ ] **Write Tests**: Cover every Given/When/Then example
  - Name tests to include rule ID for validation tracking
  - Test all invariants explicitly

- [ ] **Use Praxis CLI**: Leverage CLI for generation when applicable
  ```bash
  npx praxis generate --schema src/schemas/my-schema.ts
  ```

- [ ] **File Friction Immediately**: When you encounter any friction
  - Confusing error message? → File issue
  - Unclear API? → File issue
  - Manual step that should be automated? → File issue
  - Use the dogfooding issue template (see below)

### Before Committing

- [ ] **Scan Rules**: Run the rule scanner
  ```bash
  npm run scan:rules
  ```

- [ ] **Validate Contracts**: Ensure all contracts are valid
  ```bash
  npm run validate:contracts
  ```

- [ ] **Run Tests**: Ensure tests pass
  ```bash
  npm test
  ```

- [ ] **TypeCheck**: Verify no type errors
  ```bash
  npm run typecheck
  ```

---

## Weekly Review (Friday or End of Sprint)

### Tool Usage Review

- [ ] **Review Plures Tools Usage**: Check which tools were used this week
  - Praxis CLI: What commands did you use?
  - PluresDB: Did you use it in development or tests?
  - State-Docs: Did you generate documentation?
  - CodeCanvas: Did you visualize any schemas?
  - Unum: Did you use distributed features?

- [ ] **Identify Gaps**: What could you have used but didn't?
  - File a note or issue about why you didn't use a tool
  - Was it not obvious when to use it?
  - Was it too difficult to set up?

- [ ] **Review Filed Issues**: Check dogfooding issues from the week
  - Are they tagged with `dogfood` label?
  - Are they small and actionable?
  - Do they have proper context?

### Contract Coverage Review

- [ ] **Run Coverage Check**: Validate contract coverage
  ```bash
  npm run validate:contracts
  ```

- [ ] **Review Contract Gaps**: Check for rules without contracts
  - Prioritize high-impact rules
  - File issues for contract gaps if needed

- [ ] **Update Documentation**: If contracts changed behavior
  - Update `docs/decision-ledger/BEHAVIOR_LEDGER.md`
  - Update `docs/decision-ledger/LATEST.md`

---

## Monthly Assessment (First Week of Month)

### Strategic Review

- [ ] **Review Plures Tools Inventory**
  - Update `docs/PLURES_TOOLS_INVENTORY.md`
  - Reassess adoption status and priorities
  - Update usage levels and integration status

- [ ] **Analyze Dogfooding Issues**
  - Group issues by tool/component
  - Identify patterns and systemic problems
  - Prioritize high-impact improvements

- [ ] **Measure Adoption Progress**
  - How many new tools were adopted this month?
  - What percentage of development uses dogfooded tools?
  - Are we using tools more effectively?

### Contract Quality Review

- [ ] **Contract Drift Analysis**
  - Run ledger snapshot and compare to last month
  - Identify rules with frequent contract changes
  - Assess if changes indicate instability or evolution

- [ ] **Test Coverage for Contracts**
  - Ensure all contract examples have corresponding tests
  - Verify invariants are tested
  - Check for untested edge cases

### Documentation Update

- [ ] **Update Adoption Status**: Reflect changes in inventory
- [ ] **Share Learnings**: Document what worked and what didn't
- [ ] **Update Guidelines**: If new patterns emerge, update CONTRIBUTING.md

---

## Filing Dogfooding Issues

### When to File

File an issue **immediately** when you encounter:
- Confusing error messages or validation output
- Unclear or missing documentation
- Manual steps that should be automated
- Unexpected behavior from tools
- Difficulty using a feature
- Missing features that would help
- Performance issues or slow commands

### How to File

1. **Use the Dogfooding Issue Template**: `.github/ISSUE_TEMPLATE/dogfooding.yml`
2. **Be Specific**: Focus on one friction point per issue
3. **Provide Context**: Include what you were trying to do
4. **Suggest Solutions**: If you have ideas, share them
5. **Link to Related Work**: Reference PRs, commits, or conversations

### Example Good Issues

✅ **Good**: "Praxis CLI `validate` command doesn't show which file has the missing contract"  
❌ **Bad**: "Validation is confusing"

✅ **Good**: "State-Docs generator requires manual configuration - should auto-detect schema files"  
❌ **Bad**: "State-Docs is hard to use"

✅ **Good**: "No example of using CodeCanvas to visualize a schema with nested objects"  
❌ **Bad**: "CodeCanvas documentation is incomplete"

---

## Quick Reference

### Essential Commands

```bash
# Build and validate
npm run build
npm run validate:contracts

# Scan and check
npm run scan:rules
npm test
npm run typecheck

# Generate docs
npx praxis docs generate

# Canvas export
npx praxis canvas src/schemas/app.schema.ts
```

### Where to Find Things

- **Tools Inventory**: `docs/PLURES_TOOLS_INVENTORY.md`
- **Decision Ledger**: `docs/decision-ledger/DOGFOODING.md`
- **Contributing**: `CONTRIBUTING.md`
- **Examples**: `examples/` directory

---

## Meta-Dogfooding

Even this checklist is dogfooding! If you find:
- Missing items that should be checked
- Steps that are unclear
- Friction in following this checklist

**File a dogfooding issue!** Tag it with `dogfood` and `documentation`.

---

Last Updated: 2026-02-01  
Maintainer: Praxis Core Team
