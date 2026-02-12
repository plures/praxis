# Dogfooding Plures Tools - Complete Guide

This is the master index for all dogfooding documentation in the Praxis repository.

## 🚀 Getting Started

**New to dogfooding?** Start here:

1. **[Dogfooding Quick Start](./DOGFOODING_QUICK_START.md)** - Get up and running in 5 minutes
2. **[Plures Tools Inventory](./PLURES_TOOLS_INVENTORY.md)** - See what tools are available
3. **[Workflow Example](./examples/DOGFOODING_WORKFLOW_EXAMPLE.md)** - See dogfooding in action

## 📚 Core Documentation

### Daily Workflow
- **[Dogfooding Checklist](./DOGFOODING_CHECKLIST.md)** - Daily, weekly, and monthly checklists
  - Before starting work
  - During development
  - Before committing
  - Weekly reviews
  - Monthly assessments

### Tool Information
- **[Plures Tools Inventory](./PLURES_TOOLS_INVENTORY.md)** - Complete list of all Plures tools
  - Current adoption status
  - Usage examples
  - Adoption priorities
  - Integration status summary

### Decision Ledger Specific
- **[Decision Ledger Dogfooding](./decision-ledger/DOGFOODING.md)** - Contract-specific workflow
  - Contract creation and validation
  - Ledger snapshot management
  - CI integration

## 🎯 Practical Examples

- **[End-to-End Workflow Example](./examples/DOGFOODING_WORKFLOW_EXAMPLE.md)** - Complete example of dogfooding all tools when adding a feature

## 🐛 Reporting Friction

### Issue Templates
- **Dogfooding Friction Report** - Use when you encounter friction with any Plures tool
  - Located at: `.github/ISSUE_TEMPLATE/dogfooding.yml`
  - Auto-tagged with `dogfood` label
  - Focus on one friction point per issue

### When to File
File immediately when you encounter:
- Confusing error messages
- Missing/unclear documentation
- Manual steps that should be automated
- Unexpected behavior
- Performance issues

### How to File
1. Go to [Issues → New Issue](https://github.com/plures/praxis/issues/new/choose)
2. Select **Dogfooding Friction Report**
3. Fill out the template
4. Submit

## 🔧 Available Tools

| Tool | Status | Docs | Priority |
|------|--------|------|----------|
| Praxis CLI | ✅ Adopted | [README](../README.md#cli-npx-friendly) | Maintain |
| PluresDB | ✅ Adopted | [README](../README.md#pluresdb-integration) | Expand |
| Decision Ledger | ✅ Adopted | [Dogfooding](./decision-ledger/DOGFOODING.md) | Maintain |
| Unum | ⚠️ Partial | [README](../README.md#unified-workflow-example) | Expand |
| State-Docs | ⚠️ Partial | [README](../README.md#unified-workflow-example) | **High** |
| CodeCanvas | ⚠️ Available | [README](../README.md#unified-workflow-example) | **High** |
| OpenClaw | ❌ Not Adopted | - | Research |

## 📋 Quick Reference

### Essential Commands
```bash
# Build and validate
npm run build
npm run validate:contracts
npm run scan:rules

# Testing
npm test
npm run typecheck

# CLI usage
npx praxis --help
npx praxis create app my-app
npx praxis generate --schema src/schemas/app.schema.ts
```

### Key Directories
```
docs/
├── DOGFOODING_QUICK_START.md          # Start here
├── DOGFOODING_CHECKLIST.md            # Daily/weekly/monthly tasks
├── PLURES_TOOLS_INVENTORY.md          # All available tools
├── decision-ledger/
│   └── DOGFOODING.md                  # Decision Ledger workflow
└── examples/
    ├── README.md                      # Examples index
    └── DOGFOODING_WORKFLOW_EXAMPLE.md # Complete workflow

.github/ISSUE_TEMPLATE/
└── dogfooding.yml                      # Friction report template
```

## 🎓 Learning Path

### Week 1: Foundation
1. Read [Quick Start](./DOGFOODING_QUICK_START.md)
2. Review [Tools Inventory](./PLURES_TOOLS_INVENTORY.md)
3. Follow [Daily Checklist](./DOGFOODING_CHECKLIST.md#daily-development-workflow)
4. File at least one friction report

### Week 2: Practice
1. Try the [Workflow Example](./examples/DOGFOODING_WORKFLOW_EXAMPLE.md)
2. Use CodeCanvas to visualize a schema
3. Use State-Docs to generate documentation
4. Complete [Weekly Review](./DOGFOODING_CHECKLIST.md#weekly-review-friday-or-end-of-sprint)

### Week 3: Integration
1. Integrate Praxis CLI into your workflow
2. Use PluresDB for test fixtures
3. Adopt contract-first development
4. Complete [Monthly Assessment](./DOGFOODING_CHECKLIST.md#monthly-assessment-first-week-of-month)

### Week 4+: Mastery
1. Dogfood all tools by default
2. File friction reports proactively
3. Help others adopt dogfooding
4. Contribute improvements back

## 🤝 Contributing

Found a gap in the documentation? Have a great dogfooding pattern to share?

1. File a friction report if documentation is unclear
2. Add examples to `docs/examples/`
3. Update the [Tools Inventory](./PLURES_TOOLS_INVENTORY.md) with new learnings
4. Share your workflow in team discussions

See [CONTRIBUTING.md](../CONTRIBUTING.md) for full guidelines.

## 📊 Success Metrics

You're successfully dogfooding when:
- ✅ You use Praxis CLI regularly for validation and generation
- ✅ You define contracts before implementing rules
- ✅ You file friction reports when you encounter problems
- ✅ You complete weekly reviews
- ✅ You help others adopt dogfooding practices

## 🔗 Related Resources

- [Main README](../README.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [Decision Ledger Behavior Ledger](./decision-ledger/BEHAVIOR_LEDGER.md)
- [GitHub Issue Templates](../.github/ISSUE_TEMPLATE/)

---

**Remember:** Dogfooding is about **using** our tools, **observing** friction, and **reporting** issues. Every friction report makes our tools better! 🚀

---

Last Updated: 2026-02-01  
Maintainer: Praxis Core Team
