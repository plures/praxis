# Decision: Monorepo Organization with Package Boundaries

**Date**: 2026-02-01

**Status**: Proposed

**Context**: The Praxis repository has grown to include multiple concerns (core logic, Svelte integration, CLI tools, cloud features) all in a single package structure. This makes it difficult for users to use only what they need and creates unclear ownership boundaries.

## Decision

Organize the Praxis repository as a monorepo with clearly separated packages:

1. **@plures/praxis-core**: Core logic library (facts, events, rules, constraints, schemas, decision ledger)
2. **@plures/praxis-cli**: Command-line interface and code generators
3. **@plures/praxis-svelte**: Svelte 5 integration and reactive runtime
4. **@plures/praxis-cloud**: Cloud sync and relay server
5. **@plures/praxis**: Main package that re-exports everything

## Rationale

### Benefits

1. **Clearer Boundaries**: Each package has a well-defined purpose and ownership
2. **Smaller Bundles**: Users can import only what they need (tree-shaking at package level)
3. **Independent Versioning**: Packages can evolve at different rates (though we'll keep them synchronized initially)
4. **Better Testing**: Each package can be tested in isolation
5. **Easier Onboarding**: New contributors can focus on specific packages
6. **Zero-Dependency Core**: Core logic has no external dependencies, making it portable

### Trade-offs

1. **Complexity**: More packages to manage and publish
2. **Migration Effort**: Requires gradual migration of existing code
3. **Build Coordination**: Need to ensure packages build in correct order
4. **Import Changes**: Users may need to update imports (though backwards compatibility is maintained)

### Alternatives Considered

1. **Keep Current Structure**: Rejected because it doesn't scale well and creates unclear boundaries
2. **Separate Repositories**: Rejected because it makes coordination harder and increases overhead
3. **Lerna/Nx Monorepo**: Considered but decided to start with npm workspaces for simplicity

## Implementation Plan

### Phase 1: Documentation (Complete)
- Create MONOREPO.md with target structure
- Create package README files
- Update CONTRIBUTING.md and README.md
- Create MIGRATION_GUIDE.md

### Phase 2: Package Structure (In Progress)
- Create package directories
- Create package.json files
- Set up workspace configuration
- Configure build tools

### Phase 3: Core Extraction
- Move logic engine to praxis-core
- Move schema system to praxis-core
- Move decision ledger to praxis-core
- Update imports
- Verify tests

### Phase 4: Integration Extraction
- Move CLI to praxis-cli
- Move Svelte integration to praxis-svelte
- Move cloud features to praxis-cloud
- Update imports
- Verify tests

### Phase 5: Compatibility Layer
- Create main praxis package with re-exports
- Verify existing imports work
- Document new import patterns

### Phase 6: Examples Migration
- Move example apps to apps/
- Update dependencies
- Verify apps work

## Success Criteria

1. All packages build successfully
2. All tests pass
3. Existing imports continue to work
4. New granular imports are available
5. Documentation is updated
6. CI/CD pipeline works with new structure

## Risks and Mitigations

### Risk: Breaking Existing Users
**Mitigation**: Maintain backwards compatibility with main package re-exports

### Risk: Build Complexity
**Mitigation**: Use npm workspaces for simple, native build coordination

### Risk: Package Versioning Confusion
**Mitigation**: Keep all packages synchronized at the same version initially

### Risk: Migration Takes Too Long
**Mitigation**: Incremental approach allows partial progress; existing code still works

## Principles

1. **Incremental**: Changes happen step-by-step
2. **Non-Breaking**: Existing code continues to work
3. **Reversible**: Each step can be rolled back
4. **Tested**: Tests run after each change
5. **Documented**: Updates documented as we go

## References

- [MONOREPO.md](../../../MONOREPO.md) - Complete monorepo plan
- [MIGRATION_GUIDE.md](../../../MIGRATION_GUIDE.md) - User and contributor guide
- [npm Workspaces Documentation](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)

## Review and Approval

- **Proposed by**: Copilot
- **Reviewed by**: [Pending]
- **Approved by**: [Pending]

## Follow-up Actions

1. Review this decision with team
2. Get approval to proceed with implementation
3. Complete Phase 2 (package structure)
4. Begin Phase 3 (core extraction)
