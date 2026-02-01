# Praxis Monorepo Organization

## Overview

This document describes the Praxis repository organization as a monorepo, with clear package boundaries and a shared core library.

## Goals

1. **Clear Separation**: Separate core logic from integrations, tools, and examples
2. **Shared Foundation**: Make `praxis-core` the single source of truth for logic primitives
3. **Incremental Migration**: Enable gradual adoption without breaking existing code
4. **Developer Experience**: Improve discoverability and maintainability

## Target Structure

```
praxis/
├── packages/                    # Published packages
│   ├── praxis-core/            # Core logic library (contracts, rules, decision-ledger)
│   │   ├── src/
│   │   │   ├── logic/          # Facts, events, rules, constraints, engine
│   │   │   ├── schema/         # Schema definitions and validation
│   │   │   ├── decision-ledger/ # Decision ledger primitives
│   │   │   └── types/          # Shared TypeScript types
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── praxis-cli/             # Command-line interface
│   │   ├── src/
│   │   │   ├── commands/       # CLI commands
│   │   │   ├── generators/     # Code generators
│   │   │   └── templates/      # Project templates
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── praxis-svelte/          # Svelte 5 integration
│   │   ├── src/
│   │   │   ├── components/     # Reactive Svelte components
│   │   │   ├── generators/     # Component generators
│   │   │   └── runtime/        # Svelte runtime integration
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── praxis-cloud/           # Cloud sync and relay
│   │   ├── src/
│   │   │   ├── relay/          # Cloud relay server
│   │   │   └── sync/           # Sync protocol
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── praxis/                 # Main package (re-exports & compatibility)
│       ├── src/
│       │   └── index.ts        # Re-exports from other packages
│       ├── package.json
│       └── README.md
│
├── apps/                        # Example applications (not published)
│   ├── unified-app/            # Full-featured example
│   ├── terminal-canvas/        # Terminal UI example
│   └── cloud-sync/             # Cloud sync demo
│
├── tools/                       # Development tools (not published)
│   ├── ast-analyzer/           # AST analysis utilities
│   ├── decision-ledger/        # Decision ledger tooling
│   └── watcher/                # File watcher utilities
│
├── ui/                          # UI components and tools (not published)
│   ├── canvas/                 # CodeCanvas visual editor
│   ├── canvas-inspector/       # Canvas debugging tools
│   └── svelte-generator/       # UI generation utilities
│
├── docs/                        # Documentation
│   ├── core/                   # Core concepts documentation
│   ├── guides/                 # How-to guides
│   ├── tutorials/              # Step-by-step tutorials
│   └── decision-ledger/        # Decision ledger docs
│
├── .github/                     # GitHub workflows and config
├── package.json                 # Workspace root
├── tsconfig.json               # Root TypeScript config
└── README.md                    # Main README
```

## Package Descriptions

### packages/praxis-core

**Purpose**: Core logic library with no external integrations

**Contents**:
- Logic engine (facts, events, rules, constraints)
- Schema system (definitions, validation, normalization)
- Decision ledger primitives (contracts, behavior specs)
- Protocol definitions
- Type definitions

**Dependencies**: Minimal (only essential utilities)

**Published**: Yes (as `@plures/praxis-core`)

### packages/praxis-cli

**Purpose**: Command-line interface for scaffolding and code generation

**Contents**:
- Project scaffolding commands
- Code generators (components, schemas, rules)
- Template system
- Validation tools

**Dependencies**: praxis-core, commander, file system utilities

**Published**: Yes (as `@plures/praxis-cli`)

### packages/praxis-svelte

**Purpose**: Svelte 5 integration with runes and reactive components

**Contents**:
- Reactive engine with Svelte runes
- Component generators (Svelte components from schemas)
- Runtime integration
- Svelte-specific utilities

**Dependencies**: praxis-core, svelte (peer)

**Published**: Yes (as `@plures/praxis-svelte`)

### packages/praxis-cloud

**Purpose**: Cloud synchronization and relay server

**Contents**:
- Cloud relay server implementation
- Sync protocol
- WebSocket/HTTP adapters
- Cloud-specific adapters

**Dependencies**: praxis-core, networking libraries

**Published**: Yes (as `@plures/praxis-cloud`)

### packages/praxis

**Purpose**: Main package that re-exports everything for backwards compatibility

**Contents**:
- Re-exports from praxis-core, praxis-svelte, praxis-cli, praxis-cloud
- Maintains current API surface
- Provides unified imports for convenience

**Dependencies**: All other packages

**Published**: Yes (as `@plures/praxis` - current main package)

## Ownership Boundaries

### praxis-core
- **Owner**: Core team
- **Scope**: Logic primitives, schema system, decision ledger
- **Stability**: High (semver major for breaking changes)
- **Review**: Required for all changes

### praxis-cli
- **Owner**: Tooling team
- **Scope**: CLI commands, generators, templates
- **Stability**: Medium (can evolve more freely)
- **Review**: Required for new commands

### praxis-svelte
- **Owner**: Integration team
- **Scope**: Svelte-specific code
- **Stability**: Medium (tracks Svelte releases)
- **Review**: Required for API changes

### praxis-cloud
- **Owner**: Cloud team
- **Scope**: Cloud relay and sync
- **Stability**: Medium (independent evolution)
- **Review**: Required for protocol changes

## Migration Plan

### Phase 1: Additive Structure (Non-Breaking)

**Goal**: Add new structure without moving existing code

**Steps**:
1. Create `packages/` directory
2. Create individual package directories with package.json files
3. Set up TypeScript workspace references
4. Update root package.json with workspaces configuration
5. Add documentation for new structure

**Status**: No code moves yet, purely additive

**Validation**: Existing build and tests still pass

### Phase 2: Core Extraction

**Goal**: Extract praxis-core as a standalone package

**Steps**:
1. Move `core/logic-engine/` → `packages/praxis-core/src/logic/`
2. Move `src/core/` logic files → `packages/praxis-core/src/`
3. Move `src/decision-ledger/` → `packages/praxis-core/src/decision-ledger/`
4. Update imports in existing code to use `@praxis/core` or workspace reference
5. Build praxis-core independently
6. Run tests

**Validation**: All tests pass, praxis-core builds successfully

### Phase 3: CLI Extraction

**Goal**: Extract CLI as a standalone package

**Steps**:
1. Move `src/cli/` → `packages/praxis-cli/src/`
2. Move CLI templates → `packages/praxis-cli/templates/`
3. Update dependencies in praxis-cli/package.json
4. Update imports
5. Test CLI commands

**Validation**: CLI commands work, builds successfully

### Phase 4: Svelte Integration Extraction

**Goal**: Extract Svelte integration as a standalone package

**Steps**:
1. Move `src/integrations/svelte.ts` → `packages/praxis-svelte/src/`
2. Move `src/components/` → `packages/praxis-svelte/src/components/`
3. Move `src/core/reactive-engine.svelte.ts` → `packages/praxis-svelte/src/runtime/`
4. Update imports
5. Test Svelte integration

**Validation**: Svelte examples work, builds successfully

### Phase 5: Compatibility Layer

**Goal**: Maintain backwards compatibility in main package

**Steps**:
1. Create `packages/praxis/` as the main package
2. Re-export all APIs from sub-packages
3. Update main package.json to depend on sub-packages
4. Verify all existing imports still work

**Validation**: Existing code using `@plures/praxis` works unchanged

### Phase 6: Examples to Apps

**Goal**: Move examples to `apps/` directory

**Steps**:
1. Create `apps/` directory
2. Move `examples/unified-app/` → `apps/unified-app/`
3. Move `examples/terminal-canvas/` → `apps/terminal-canvas/`
4. Move `examples/cloud-sync/` → `apps/cloud-sync/`
5. Update their dependencies to use workspace packages
6. Keep other examples in `examples/` for now (simple examples)

**Validation**: Apps build and run successfully

## Migration Principles

1. **Incremental**: Make small, testable changes
2. **Reversible**: Each step can be rolled back independently
3. **Non-Breaking**: Maintain backwards compatibility
4. **Validated**: Test after each change
5. **Documented**: Update docs as we go

## Dependency Graph

```
praxis (main package)
├── praxis-core (no internal dependencies)
├── praxis-cli
│   └── praxis-core
├── praxis-svelte
│   └── praxis-core
└── praxis-cloud
    └── praxis-core

apps/*
├── praxis (or individual packages)
└── external dependencies

tools/*
├── praxis-core (minimal)
└── tool-specific dependencies
```

## Current Status

- [x] Documentation created
- [ ] Package structure created
- [ ] Core extraction
- [ ] CLI extraction
- [ ] Svelte extraction
- [ ] Cloud extraction
- [ ] Compatibility layer
- [ ] Examples migration
- [ ] Final validation

## Next Steps

1. Review this plan with the team
2. Create initial package.json files for each package
3. Set up TypeScript workspace configuration
4. Begin Phase 1 implementation

## Decision Log

### Decision: Use npm workspaces instead of separate repos
**Date**: 2026-02-01
**Rationale**: 
- Easier to coordinate changes across packages
- Shared tooling and CI/CD
- Simpler for contributors
- Can publish packages independently while keeping them in sync

### Decision: Keep main package as re-export layer
**Date**: 2026-02-01
**Rationale**:
- Maintains backwards compatibility
- Users can choose granular or unified imports
- Allows gradual migration for existing users

### Decision: Make praxis-core dependency-free
**Date**: 2026-02-01
**Rationale**:
- Core logic should be pure and portable
- Easier to use in different environments
- Clearer separation of concerns
- Reduces security surface area

## References

- [Lerna Monorepo Guide](https://lerna.js.org/)
- [npm Workspaces Documentation](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
