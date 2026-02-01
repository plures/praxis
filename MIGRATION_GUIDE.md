# Praxis Monorepo Migration Guide

This guide helps users and contributors understand the transition from the current monolithic structure to the new monorepo organization.

## For Users

### Current Import Patterns (Still Supported)

All existing import patterns continue to work without any changes:

```typescript
// Main package - works now and after migration
import { createPraxisEngine, defineRule, defineFact } from '@plures/praxis';

// Svelte integration - works now and after migration
import { createReactiveEngine } from '@plures/praxis/svelte';

// Schema types - works now and after migration
import type { Schema } from '@plures/praxis/schema';

// Cloud integration - works now and after migration
import { createCloudRelay } from '@plures/praxis/cloud';
```

**No action required** - your code will continue to work as-is.

### New Import Patterns (Future, Optional)

Once the migration is complete, you can optionally use more granular imports for smaller bundle sizes:

```typescript
// Import only core logic (smaller bundle)
import { createPraxisEngine, defineRule, defineFact } from '@plures/praxis-core';

// Import only Svelte integration
import { createReactiveEngine } from '@plures/praxis-svelte';

// Import only CLI tools
import { scaffold, generate } from '@plures/praxis-cli';

// Import only cloud features
import { createCloudRelay } from '@plures/praxis-cloud';
```

**Benefits of granular imports:**
- Smaller bundle sizes (tree-shaking at package level)
- Faster builds (only build what you use)
- Clearer dependencies

**You can switch gradually** - mix and match import patterns as needed.

## For Contributors

### Current Development Workflow

The existing workflow continues unchanged during migration:

```bash
# Clone and install
git clone https://github.com/plures/praxis.git
cd praxis
npm install

# Build
npm run build

# Test
npm test

# Type check
npm run typecheck
```

### New Development Workflow (After Migration)

Once the monorepo structure is in place, the workflow will be:

```bash
# Clone and install (workspaces install all packages)
git clone https://github.com/plures/praxis.git
cd praxis
npm install

# Build all packages
npm run build

# Build a specific package
cd packages/praxis-core
npm run build

# Test all packages
npm test

# Test a specific package
cd packages/praxis-core
npm test

# Type check all packages
npm run typecheck
```

### What's Changing

#### File Locations

Code will gradually move to the new package structure:

| Current Location | New Location | Status |
|-----------------|--------------|--------|
| `src/core/engine.ts` | `packages/praxis-core/src/logic/engine.ts` | Planned |
| `src/core/rules.ts` | `packages/praxis-core/src/logic/rules.ts` | Planned |
| `src/core/schema/` | `packages/praxis-core/src/schema/` | Planned |
| `src/decision-ledger/` | `packages/praxis-core/src/decision-ledger/` | Planned |
| `src/cli/` | `packages/praxis-cli/src/` | Planned |
| `src/integrations/svelte.ts` | `packages/praxis-svelte/src/` | Planned |
| `src/cloud/` | `packages/praxis-cloud/src/` | Planned |
| `examples/unified-app/` | `apps/unified-app/` | Planned |
| `examples/terminal-canvas/` | `apps/terminal-canvas/` | Planned |

#### Import Paths

Internal imports will be updated:

```typescript
// Old (current)
import { createEngine } from '../core/engine.js';
import { defineRule } from '../core/rules.js';

// New (after migration)
import { createEngine } from '@praxis/core/logic/engine.js';
import { defineRule } from '@praxis/core/logic/rules.js';

// Or using workspace references in tsconfig
import { createEngine } from '@praxis/core';
```

### Migration Principles

1. **Incremental**: Changes happen step-by-step, not all at once
2. **Non-Breaking**: Existing code continues to work
3. **Reversible**: Each step can be rolled back if needed
4. **Tested**: Tests run after each change
5. **Documented**: This guide is updated as we go

### Contributing During Migration

**If you're adding new code:**
- Check [MONOREPO.md](./MONOREPO.md) to see where your code should live
- If the target package doesn't exist yet, use the current structure
- We'll move code incrementally in coordination with maintainers

**If you're fixing bugs:**
- Fix in the current location
- We'll migrate fixes when we move files

**If you're refactoring:**
- Coordinate with maintainers first
- Large refactors should wait until migration is complete
- Small, localized refactors are fine

## Migration Timeline

### Phase 1: Documentation (Current)
- ✅ Create MONOREPO.md with target structure
- ✅ Create packages/praxis-core/README.md
- ✅ Update CONTRIBUTING.md
- ✅ Update README.md
- ✅ Create this migration guide

### Phase 2: Package Structure (In Progress)
- ✅ Create package directories
- ✅ Create package.json files
- ⏳ Set up TypeScript workspace configuration
- ⏳ Configure build tools for packages

### Phase 3: Core Extraction
- ⏳ Move logic engine to praxis-core
- ⏳ Move schema system to praxis-core
- ⏳ Move decision ledger to praxis-core
- ⏳ Update imports
- ⏳ Verify tests pass

### Phase 4: Integration Extraction
- ⏳ Move CLI to praxis-cli
- ⏳ Move Svelte integration to praxis-svelte
- ⏳ Move cloud features to praxis-cloud
- ⏳ Update imports
- ⏳ Verify tests pass

### Phase 5: Compatibility Layer
- ⏳ Create praxis main package with re-exports
- ⏳ Verify existing imports still work
- ⏳ Update documentation

### Phase 6: Examples Migration
- ⏳ Move examples to apps/
- ⏳ Update dependencies
- ⏳ Verify apps still work

### Phase 7: Cleanup
- ⏳ Remove old structure (symlinks might remain for compatibility)
- ⏳ Update all documentation
- ⏳ Final testing
- ⏳ Publish updated packages

## FAQ

### Q: Do I need to change my imports?

**A:** No, not immediately. The `@plures/praxis` package will continue to re-export everything.

### Q: When will the migration be complete?

**A:** The migration is incremental and non-breaking. We'll update this guide with completion dates as we progress.

### Q: What if I find broken imports during migration?

**A:** Please open an issue with details. We'll fix it promptly.

### Q: Can I start using the new package structure now?

**A:** The packages exist but don't have code yet. Once we start Phase 3, you can begin using `@plures/praxis-core` and other packages.

### Q: Will package versions be synchronized?

**A:** Yes, all packages will be versioned together to maintain compatibility.

### Q: What about the npm/JSR/NuGet packages?

**A:** The main `@plures/praxis` package will continue to be published to all platforms. Individual packages will also be published once they're ready.

### Q: How can I help with the migration?

**A:** Review [MONOREPO.md](./MONOREPO.md) and this guide, then reach out to maintainers if you'd like to help with specific phases.

## Getting Help

- **Documentation Issues**: Open an issue with the `docs` label
- **Migration Questions**: Open a discussion in the GitHub Discussions
- **Bug Reports**: Open an issue with the `bug` label
- **Feature Requests**: Open an issue with the `enhancement` label

## References

- [MONOREPO.md](./MONOREPO.md) - Complete monorepo organization plan
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [packages/praxis-core/README.md](./packages/praxis-core/README.md) - Core package documentation
