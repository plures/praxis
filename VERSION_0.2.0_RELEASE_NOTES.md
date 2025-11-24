# Praxis 0.2.0 Release Notes

**Release Date:** November 24, 2025  
**Previous Version:** 0.1.0 (November 15, 2025)

## Overview

Praxis 0.2.0 represents a major expansion of the framework from a logic engine into a **complete application framework**. This release includes 165 passing tests (up from 9), comprehensive documentation, and ready-to-use publishing workflows for both npm and JSR (Deno).

## What's New

### 🏗️ Framework Infrastructure

#### Complete Schema System
- **Location:** `src/core/schema/`
- Type definitions for models, components, logic, and orchestration
- Schema validation and normalization
- YAML/JSON schema loading
- Multi-target code generation (PluresDB, Svelte, State-Docs, Canvas, DSC)

#### Component Generation
- **Location:** `src/core/component/generator.ts`
- Automatic Svelte component generation from schemas
- Support for form, display, list, and navigation components
- TypeScript type generation
- Test scaffolding and documentation generation

#### CLI Tools
- **Location:** `src/cli/`
- `praxis create app|component` - Project scaffolding
- `praxis generate` - Code generation from schemas
- `praxis canvas` - Visual schema editor integration
- `praxis orchestrate` - Distributed system orchestration
- `praxis login|logout|whoami` - GitHub authentication
- `praxis cloud` - Cloud service management

### 🎨 Svelte 5 Integration

- **Location:** `src/integrations/svelte.ts`
- `usePraxisState` - Reactive state management with Svelte 5 runes
- `usePraxisHistory` - Time-travel debugging with undo/redo
- `usePraxisComputed` - Derived state computations
- Full TypeScript generics support
- Working Svelte 5 counter example

### ☁️ Cloud & Monetization

- **Location:** `src/cloud/`
- GitHub-based authentication (OAuth device flow + Personal Access Tokens)
- Tier-based billing system:
  - **Free:** 1K syncs/month, 10MB storage, 1 app
  - **Solo:** $5/mo - 50K syncs/month, 1GB storage, 10 apps
  - **Team:** $20/mo - 500K syncs/month, 10GB storage, 50 apps, 10 members
  - **Enterprise:** $50/mo - 5M syncs/month, 100GB storage, 1K apps, unlimited members
- Usage tracking and limit validation
- Tenant provisioning with storage namespaces
- Azure Functions relay endpoints

### 🔄 Cross-Language Support

#### PowerShell Adapter
- **Location:** `powershell/Praxis.psm1`
- Complete cmdlet library for Praxis operations
- JSON bridge to TypeScript engine
- Protocol version compatibility checking
- Working counter example included

### 🔍 Introspection & Visualization

- **Location:** `src/core/introspection.ts`
- Registry statistics and metrics
- JSON schema generation
- Graph representation (nodes and edges)
- Graphviz DOT export
- Mermaid diagram export
- Rule and constraint search
- Module dependency tracking

### 📋 Protocol Versioning

- **Location:** `src/core/protocol.ts`
- Explicit protocol version: **v1.0.0**
- Semantic versioning with stability guarantees
- Cross-language compatibility checks
- Migration path documentation in `PROTOCOL_VERSIONING.md`

### 📚 Examples & Templates

#### Hero E-Commerce Example
- **Location:** `src/examples/hero-ecommerce/`
- Full authentication system with session management
- Shopping cart with dynamic pricing
- Discount code system (SAVE10, SAVE20, FREESHIP)
- Feature flags and A/B testing
- Loyalty points system (1 point per dollar)
- Order history tracking

#### Other Examples
- Advanced TODO app with Svelte integration
- Basic authentication example
- Svelte counter with runes
- Basic and fullstack app templates

### 🧪 Testing

**Test Suite Expansion:** 9 tests → 165 tests (1733% increase!)

New test files:
- `actors.test.ts` - Actor lifecycle and behavior (12 tests)
- `edge-cases.test.ts` - Edge cases and error handling (19 tests)
- `introspection.test.ts` - Registry introspection (14 tests)
- `billing.test.ts` - Billing system validation (16 tests)
- `cloud.test.ts` - Cloud integration (10 tests)
- `provisioning.test.ts` - Tenant provisioning (18 tests)
- `generators.test.ts` - Code generation (15 tests)
- `schema.test.ts` - Schema validation (11 tests)
- `svelte-integration.test.ts` - Svelte integration (16 tests)
- `terminal-node.test.ts` - Terminal node functionality (16 tests)
- `protocol.test.ts` - Protocol versioning (3 tests)

### 📖 Documentation

#### Framework Documentation
- `FRAMEWORK.md` - Complete architecture guide (420 lines)
- `GETTING_STARTED.md` - Comprehensive getting started guide (290 lines)
- `PROTOCOL_VERSIONING.md` - Protocol versioning specification (275 lines)
- `FEATURE_SUMMARY.md` - Major features overview (223 lines)
- `ELEVATION_SUMMARY.md` - Framework transformation summary (222 lines)

#### Guides
- `docs/guides/getting-started.md` - Quick start guide
- `docs/guides/canvas.md` - Canvas integration guide
- `docs/guides/orchestration.md` - Orchestration guide (DSC/MCP)
- `docs/guides/svelte-integration.md` - Svelte integration guide
- `docs/guides/history-state-pattern.md` - Time-travel debugging
- `docs/guides/parallel-state-pattern.md` - Parallel state management

### 🔧 Infrastructure

#### CI/CD Workflows
- Node.js CI with multiple versions (18.x, 20.x)
- Deno compatibility checks
- CodeQL security scanning
- Automated release workflow
- JSR publishing workflow (enabled)
- npm publishing workflow (enabled)
- Stale issue management

#### GitHub Configuration
- Issue templates (bug, enhancement, proposal, integration, generator)
- Pull request template with comprehensive checklist
- Funding configuration
- Label system
- Dependabot configuration
- Pre-commit hooks template

## Breaking Changes

**None!** This release is fully backward compatible with 0.1.0.

## Bug Fixes

- Fixed duplicate "types" key in tsconfig.json
- Fixed deprecated `nodeModulesDir: false` to `nodeModulesDir: "none"` in deno.json
- Removed `"private": true` from jsr.json to enable JSR publishing

## Installation

### npm
```bash
npm install @plures/praxis@0.2.0
```

### Deno/JSR
```typescript
import { createPraxisEngine } from "jsr:@plures/praxis@0.2.0";
```

## Upgrading from 0.1.0

Since there are no breaking changes, upgrading is straightforward:

```bash
npm install @plures/praxis@latest
```

All existing code using 0.1.0 APIs will continue to work without modification.

## Publishing Status

### npm Publishing
✅ **Enabled** - Will publish to npm when a version tag (e.g., `v0.2.0`) is pushed
- Workflow: `.github/workflows/release.yml`
- Requires: `NPM_TOKEN` secret configured in repository

### JSR Publishing
✅ **Enabled** - Will publish to JSR when a GitHub release is published
- Workflow: `.github/workflows/publish-jsr.yml`
- Uses: GitHub OIDC token (no secret needed)
- Note: Some Deno lint warnings exist but don't block publishing

## How to Release

To create a release for this version:

1. **Create and push a git tag:**
   ```bash
   git tag v0.2.0
   git push origin v0.2.0
   ```

2. **The release workflow will automatically:**
   - Run tests and build
   - Create a GitHub Release with changelog
   - Publish to npm (if NPM_TOKEN is configured)

3. **The JSR publish workflow will automatically:**
   - Trigger when the GitHub release is published
   - Publish to JSR using GitHub OIDC

## Next Steps

### For Users
- Read the [Getting Started Guide](./GETTING_STARTED.md)
- Explore the [hero e-commerce example](./src/examples/hero-ecommerce/)
- Try the [Svelte integration](./docs/guides/svelte-integration.md)
- Set up [GitHub authentication](./src/cloud/README.md) for cloud features

### For Contributors
- Review the [Framework Guide](./FRAMEWORK.md)
- Check the [Contributing Guide](./CONTRIBUTING.md)
- Explore the [introspection tools](./src/core/introspection.ts)
- Add new [project templates](./templates/)

## Statistics

- **Total Tests:** 165 (all passing)
- **Test Coverage:** 13 test files covering all major features
- **Documentation:** 15+ comprehensive documentation files
- **Examples:** 6 working examples with detailed READMEs
- **Code Quality:** 0 TypeScript errors, 0 CodeQL security alerts
- **Lines of Code:** ~30,000+ lines added since 0.1.0

## Acknowledgments

This release represents a massive collaborative effort to transform Praxis from a logic engine into a complete application framework. Special thanks to all contributors and the Plures community!

## Resources

- **GitHub Repository:** https://github.com/plures/praxis
- **Documentation:** https://github.com/plures/praxis/tree/main/docs
- **Issues:** https://github.com/plures/praxis/issues
- **Discussions:** https://github.com/plures/praxis/discussions
- **npm Package:** https://www.npmjs.com/package/@plures/praxis
- **JSR Package:** https://jsr.io/@plures/praxis

## Support

If you encounter any issues or have questions:
1. Check the [documentation](./docs/)
2. Search [existing issues](https://github.com/plures/praxis/issues)
3. Open a [new issue](https://github.com/plures/praxis/issues/new/choose)
4. Join the [discussions](https://github.com/plures/praxis/discussions)

---

**Happy Building with Praxis! 🚀**
