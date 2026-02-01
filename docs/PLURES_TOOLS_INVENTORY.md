# Plures Tools Inventory

This document tracks the adoption and usage of Plures ecosystem tools in the Praxis repository.

## Available Plures Tools

### 1. **Praxis CLI** ✅ Adopted
**Status:** Actively used  
**Package:** `@plures/praxis`  
**Purpose:** Command-line interface for scaffolding, code generation, and project management

**Current Usage:**
- Project scaffolding: `npx praxis create app <name>`
- Component generation: `npx praxis generate --schema <file>`
- Canvas export: `npx praxis canvas <schema>`
- Contract validation: `npm run validate:contracts`
- Rule scanning: `npm run scan:rules`

**Adoption Opportunities:**
- Use in CI/CD pipelines for validation
- Integrate into pre-commit hooks for contract validation
- Create custom commands for common workflows

---

### 2. **PluresDB** ✅ Adopted
**Status:** Actively integrated  
**Package:** `@plures/pluresdb` (peer dependency)  
**Purpose:** Local-first, P2P-capable database with CRDT conflict resolution

**Current Usage:**
- Available via `createPluresDB()` adapter
- Used in examples (offline-chat, cloud-sync, distributed-node)
- Documented in README and integration guides

**Adoption Opportunities:**
- Use PluresDB for test fixtures and example data
- Integrate into development server for live data persistence
- Create PluresDB-backed test utilities

---

### 3. **Unum** ✅ Partially Adopted
**Status:** Integrated, limited usage  
**Package:** `@plures/unum` (future peer dependency)  
**Purpose:** Distributed communication and P2P networking

**Current Usage:**
- Available via `createUnumAdapter()`
- Used in distributed examples
- Documented in README

**Adoption Opportunities:**
- Use Unum for development collaboration (live code sync)
- Integrate into CI for distributed testing
- Create Unum-based development tools

---

### 4. **State-Docs** ✅ Partially Adopted
**Status:** Generator available, limited usage  
**Package:** Built-in to Praxis  
**Purpose:** Automated documentation generation from schemas and logic

**Current Usage:**
- `createStateDocsGenerator()` available
- Basic usage documented in README

**Adoption Opportunities:**
- Generate documentation as part of build process
- Auto-generate API docs from schemas
- Create visual state machine diagrams
- Generate contract documentation automatically

---

### 5. **CodeCanvas** ⚠️ Available, Not Adopted
**Status:** API available but not actively used  
**Package:** Built-in to Praxis  
**Purpose:** Visual schema editing and diagram generation

**Current Usage:**
- `schemaToCanvas()` function available
- Mentioned in README
- Not actively used in development

**Adoption Opportunities:**
- **HIGH PRIORITY**: Use for visualizing complex schemas
- Generate architecture diagrams from code
- Create visual onboarding guides
- Export to Mermaid/PlantUML for documentation

---

### 6. **OpenClaw** ❌ Not Adopted
**Status:** Not yet integrated  
**Purpose:** AI-powered code analysis and refactoring tool

**Current Usage:**
- Not currently used

**Adoption Opportunities:**
- **INVESTIGATE**: Determine if OpenClaw exists as standalone tool
- Evaluate for automated code review
- Consider for migration assistance
- Explore for pattern detection in codebase

---

### 7. **Decision Ledger** ✅ Actively Dogfooding
**Status:** Fully adopted and enforced  
**Package:** Built-in to Praxis  
**Purpose:** Behavior contracts for rules and constraints

**Current Usage:**
- Contract definitions via `defineContract()`
- Validation via `npm run validate:contracts`
- Scanning via `npm run scan:rules`
- Full workflow documented in `docs/decision-ledger/DOGFOODING.md`

**Adoption Status:**
- ✅ Contracts for core rules
- ✅ CI validation pipeline
- ✅ Developer guidelines in CONTRIBUTING.md

---

## Adoption Priority Matrix

### Immediate (This Week)
1. **CodeCanvas** - Start visualizing key schemas and architecture
2. **State-Docs** - Integrate into build process for auto-docs
3. **Praxis CLI** - Add to pre-commit hooks for validation

### Short-term (This Month)
1. **PluresDB** - Use for test fixtures and development data
2. **Unum** - Explore for development collaboration
3. **OpenClaw** - Research availability and capabilities

### Ongoing
1. **Decision Ledger** - Continue expanding contract coverage
2. **Praxis CLI** - Discover and document new use cases

---

## Integration Status Summary

| Tool | Status | Usage Level | Priority |
|------|--------|-------------|----------|
| Praxis CLI | ✅ Adopted | High | Maintain |
| PluresDB | ✅ Adopted | Medium | Expand |
| Decision Ledger | ✅ Adopted | High | Maintain |
| Unum | ⚠️ Partial | Low | Expand |
| State-Docs | ⚠️ Partial | Low | **High** |
| CodeCanvas | ⚠️ Available | None | **High** |
| OpenClaw | ❌ Not Adopted | None | Research |

---

## Resources

- [Praxis CLI Documentation](../README.md#cli-npx-friendly)
- [PluresDB Integration](../README.md#pluresdb-integration)
- [Decision Ledger Dogfooding](./decision-ledger/DOGFOODING.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

---

Last Updated: 2026-02-01  
Maintainer: Praxis Core Team
