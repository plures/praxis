# Dogfooding Plures Tools - Quick Start

This guide helps you start dogfooding Plures tools immediately.

## What is Dogfooding?

**Dogfooding** = Using our own tools in daily development and filing issues when we find friction.

**Goal**: Find and fix problems before users encounter them.

## 🚀 Quick Start (5 minutes)

### 1. Review Available Tools

See what tools you can use: [`docs/PLURES_TOOLS_INVENTORY.md`](./PLURES_TOOLS_INVENTORY.md)

**High Priority for Adoption:**
- ✅ **Praxis CLI** - Already using it
- ⚠️ **State-Docs** - Should use for documentation
- ⚠️ **CodeCanvas** - Should use for visualization

### 2. Follow the Daily Checklist

When developing, follow the quick checklist in [`docs/DOGFOODING_CHECKLIST.md`](./DOGFOODING_CHECKLIST.md):

**Before Starting:**
```bash
git pull origin main
npm run build
npm run validate:contracts
```

**When Adding/Modifying Rules:**
1. Define contract with `defineContract()`
2. Attach to rule via `meta.contract`
3. Write tests for all examples
4. Run `npm run scan:rules` and `npm run validate:contracts`

**When You Find Friction:**
- File issue immediately using the **Dogfooding Friction Report** template
- One friction point per issue
- Tag with `dogfood` label

### 3. Try a Tool Today

Pick one tool to try this week:

**Option A: Visualize a Schema with CodeCanvas**
```typescript
import { schemaToCanvas } from '@plures/praxis';
const canvas = schemaToCanvas(mySchema);
// Friction? File an issue!
```

**Option B: Generate Docs with State-Docs**
```typescript
import { createStateDocsGenerator } from '@plures/praxis';
const docsGen = createStateDocsGenerator({
  projectTitle: 'My Module',
  target: './docs'
});
// Friction? File an issue!
```

**Option C: Use Praxis CLI for Generation**
```bash
npx praxis generate --schema src/schemas/my-schema.ts
# Friction? File an issue!
```

## 📋 Filing Friction Reports

### When to File

File **immediately** when you encounter:
- Confusing error messages
- Missing documentation
- Manual steps that should be automated
- Unexpected behavior
- Performance issues

### How to File

1. Go to [Issues → New Issue](https://github.com/plures/praxis/issues/new/choose)
2. Select **Dogfooding Friction Report**
3. Fill out the template (focus on ONE friction point)
4. Submit with `dogfood` label

### Example Good Issues

✅ "Praxis CLI `validate` command doesn't show file path for missing contracts"  
✅ "State-Docs requires manual config - should auto-detect schema files"  
✅ "CodeCanvas export example missing for nested object schemas"

❌ "Validation is confusing" (too vague)  
❌ "Documentation needs work" (too broad)

## 🔄 Weekly Review

Every Friday (or end of sprint):

1. **Check your tool usage**: What tools did you use this week?
2. **Identify gaps**: What could you have used but didn't?
3. **Review filed issues**: Are they tagged and actionable?

See full checklist: [`docs/DOGFOODING_CHECKLIST.md#weekly-review-friday-or-end-of-sprint`](./DOGFOODING_CHECKLIST.md#weekly-review-friday-or-end-of-sprint)

## 📚 Resources

| Resource | Purpose |
|----------|---------|
| [`PLURES_TOOLS_INVENTORY.md`](./PLURES_TOOLS_INVENTORY.md) | List of all tools and adoption status |
| [`DOGFOODING_CHECKLIST.md`](./DOGFOODING_CHECKLIST.md) | Daily/weekly/monthly checklists |
| [`decision-ledger/DOGFOODING.md`](./decision-ledger/DOGFOODING.md) | Decision Ledger specific workflow |
| [`.github/ISSUE_TEMPLATE/dogfooding.yml`](../.github/ISSUE_TEMPLATE/dogfooding.yml) | Issue template for friction reports |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md) | Full contributing guidelines |

## 🎯 This Week's Focus

**High-Priority Tools to Adopt:**
1. **CodeCanvas** - Visualize at least one complex schema
2. **State-Docs** - Generate docs for at least one module
3. **Praxis CLI** - Use for generation instead of manual coding

**Success Metric:** File at least 1-2 dogfooding issues this week.

---

## Need Help?

- Check the [Plures Tools Inventory](./PLURES_TOOLS_INVENTORY.md) for tool documentation
- Review examples in the `examples/` directory
- Ask in discussions or file a question issue

**Remember:** Finding friction is success! Every friction report makes the tools better.

---

Last Updated: 2026-02-01  
Maintainer: Praxis Core Team
