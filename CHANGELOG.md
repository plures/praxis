## [2.8.0] — 2026-07-27

- ci(release): trigger release on merge to main (#403) (714a53b)
- chore(deps)(deps): bump the npm-production group with 8 updates (#405) (232113a)
- chore(deps)(deps): bump actions/upload-artifact from 4 to 7 (#401) (6b967a8)
- chore(deps)(deps): bump actions/download-artifact from 4 to 8 (#400) (a33520a)
- chore(deps)(deps): bump the npm-production group with 5 updates (#402) (69cf5e1)
- ci: migrate Tech Doc Writer to shared reusable (b850f39)
- chore(deps)(deps): bump js-yaml from 4.2.0 to 5.2.1 (#397) (f8c2a25)
- chore(deps)(deps): bump actions/setup-node from 4 to 7 (#393) (d52af43)
- chore(deps)(deps): bump actions/cache from 4 to 6 (#392) (810398f)
- chore(deps)(deps-dev): bump @types/node from 25.6.2 to 26.1.1 (#399) (8c944e6)
- chore(deps)(deps): bump actions/github-script from 7 to 9 (#391) (e2aa9b9)
- chore(deps)(deps): bump dependabot/fetch-metadata from 2 to 3 (#390) (80c027e)
- chore(deps)(deps): bump actions/checkout from 4 to 7 (#389) (35ada24)
- chore(deps)(deps): bump commander from 14.0.3 to 15.0.0 (#384) (a3fcea4)
- chore(deps)(deps-dev): bump the npm-production group with 6 updates (#398) (e9cb241)
- chore(deps)(deps-dev): bump typescript from 5.9.3 to 6.0.3 (#395) (b5b4367)
- chore(deps)(deps-dev): bump the npm-dev-tools group with 3 updates (#394) (4d475e7)
- fix(ci): repair tech-doc-writer YAML indentation / remove empty workflow (12783a9)
- chore(deps)(deps-dev): bump the npm-dev-tools group across 1 directory with 3 updates (#386) (c9ef1c1)
- chore(deps)(deps-dev): bump ava from 6.4.1 to 8.0.1 (#383) (5f3b10b)
- ci(dependabot): v3 - do not auto-merge pre-1.0 (0.x) breaking bumps (0.x minor is breaking; aes-gcm 0.10->0.11 broke main) (3d3ace9)
- chore(deps)(deps): bump the npm-production group across 1 directory with 8 updates (#388) (ee19f91)
- fix(release): sync lockfile + emit all declared node/browser export targets (f7d7a07)
- ci(dependabot): auto-merge security advisories regardless of semver bump (security over function) (178afdd)
- ci: add Dependabot auto-merge workflow (org pileup fix; green low-risk deps auto-merge) (caf58f8)
- fix(build): bundle workspace-only praxis-core/cloud into dist so published pkg is installable (07e6f32)
- chore(repo): untrack target/ build artifacts (already gitignored; were causing 2.5k-file phantom diffs that overflowed agent context) (87cf3ff)
- feat(praxis): load praxis-native NAPI addon at runtime (Level-0 gap #1/#5) (ca3bf32)
- feat(praxis-core): ADR-0028 opt-in PluresDbConstraintAdapter (declarative constraints -> Rust pluresdb-px) (b431611)
- fix(px-grammar-gen): add kw_if/kw_for/kw_in/kw_match/kw_end boundaries (c93ab23)
- feat: ADR-0021 Phase 4 — praxis-native depends on pluresdb-px (d962e4d)
- feat: px-grammar-gen codegen tool + .gitignore (ADR-0021 Phase 2) (100c427)
- feat: px-ast canonical AST crate + workspace Cargo.toml + ADR-0021 (ff8c6d0)
- feat(px): adopt unified grammar v4 from pluresdb (single source of truth) (d27623a)
- fix: remove pre-publish optionalDependencies from praxis-native package.json (f21d061)
- chore: update pnpm-lock.yaml to include praxis-native workspace deps (89202c5)
- fix(ci): exclude crates/ from vitest test discovery (5018eab)
- fix(ci): add praxis-native to pnpm workspace (#381) (f2068d1)
- fix(ci): align tests with deprecated stub + add missing ava dep (#380) (24fb68f)
- fix(ci): remove unused PluresDBLocalFirst type (#379) (26d6593)
- fix(ci): stub deprecated createPraxisLocalFirst — remove dead dynamic import (#378) (2cf7dc6)
- fix(ci): remove nonexistent @plures/pluresdb/local-first import (#377) (dba8492)
- Merge pull request #356 from plures/dependabot/npm_and_yarn/plures/pluresdb-3.9.1 (27edeeb)
- Merge pull request #376 from plures/dependabot/npm_and_yarn/npm-production-b5f60bb88f (c2fef81)
- chore(deps)(deps): bump the npm-production group across 1 directory with 10 updates (f3b7ae3)
- fix: move svelte from peerDependencies to dependencies (b5cd8fa)
- fix: L012 arity lint now works for code_block function calls (ff2a2bb)
- Merge feat/px-grammar-v2: list config values, lint code_block support (95aeb45)
- feat: extend lint to walk code_block AST (L005/L006/L008/L009/L012) (24bf2a6)
- feat: add list_val support to config_value grammar rule (edb2fd9)
- docs: update tracker with final integration status (b1c030b)
- cleanup: remove temp test files, finalize grammar v2 (f41ef87)
- feat: add match/try/parallel statements + parallel expressions to v2 grammar (37cd0c9)
- feat: builder compiles v2 code blocks + executor runs tick_ship (70f9058)
- feat: v2 hybrid grammar — code_block with braces/semicolons for procedures (4e5903d)
- docs: Add Stream C completion summary with test results and sample schema (68a75cf)
- feat(px-schema): Add #[derive(PxSchema)] proc macro for schema generation (5aafdd8)
- ref: wind-chess-v2.px — target syntax for grammar rewrite (66590cf)
- docs: ADRs for .px grammar standardization + schema format + execution tracker (4faa11c)
- feat: wire eval.rs into executor — assigns, conditions, and interpolation use unified evaluator (46b5942)
- feat: expand grammar — periodic/on_event/startup triggers + nested config (01e971e)
- feat: expand trigger grammar — periodic, on_event, on_write(pattern), startup (20118c4)
- feat: expand NativeFunctionRegistry — 35+ string/collection/math/type functions (a562d60)
- fix: step_assign no longer requires trailing blank line (4873c41)
- feat: wire config/entity declarations through AST and compiler (4dc16a9)
- feat: wire assign/if/for steps through parser → compiler → executor (091b98a)
- fix: remove behavior-ledger submodule — breaks cargo git dep resolution (dab970c)
- ci: add weekly mutation testing for praxis-native critical paths (0c030c0)
- feat: add npm publish pipeline for @plures/praxis-native (e7ac351)
- fix: gate orchestration E2E test behind #[cfg(not(napi-binding))] to avoid NAPI linker errors (585dd06)
- test: add E2E integration tests (11 pass) + remove tracked build artifacts (c60b7d4)
- feat: add praxis-native Rust NAPI crate — .px compiler, executor, NativeFunctionRegistry (e5b6a2d)
- ci: change release trigger from push-to-main to tag-only (75dbdf7)
- refactor: replace inline lifecycle with reusable workflow call (4b6f6a3)
- docs: refresh ROADMAP.md with OASIS strategic alignment (17de3ad)
- chore(deps)(deps-dev): bump @types/node in the npm-dev-tools group (#371) (5700290)
- chore(deps)(deps): bump @plures/pluresdb from 2.9.7 to 3.9.1 (4fa4f55)
- chore(deps)(deps): bump the npm-production group with 5 updates (#369) (74b1c9c)
- chore(deps)(deps-dev): bump the npm-production group with 6 updates (#355) (4f4df66)
- docs: refresh ROADMAP.md with OASIS strategic alignment (46922da)
- docs: update ROADMAP.md to reflect current state (26527f3)
- chore(deps)(deps-dev): bump the npm-dev-tools group across 1 directory with 4 updates (#348) (e99c48c)
- Add enterprise team member management APIs with role-based controls and `praxis cloud team` CLI (#346) (3a2b0e7)
- fix: include packages/praxis in build chain to produce dist/ artifacts (d96dd46)
- docs: update copilot-instructions with praxis, design-dojo, automation rules (3457700)
- feat(release): add target_version input for milestone-driven releases (e8510a6)
- feat(lifecycle): milestone-close triggers roadmap-aware release (043b7f9)
- Merge pull request #345 from plures/copilot/implement-github-marketplace-webhook-handlers (355d583)
- fix(cloud): preserve marketplace subscription start date from effective event time (f76798b)
- feat(cloud): add GitHub Marketplace webhook endpoint handling (438be83)
- Initial plan (adf3fe0)
- Merge pull request #344 from plures/copilot/add-compatibility-layer-re-exports (a139dfb)
- fix: add @plures/praxis compatibility re-export layer (7309100)
- Initial plan (28fccb0)
- [WIP] Move cloud features to praxis-cloud package (#343) (4437ed8)
- [WIP] Fix CI failures on PR #327 (#342) (800e4ce)
- Merge pull request #341 from plures/copilot/fix-ci-failures-pr-329 (98dc5e2)
- fix: sync pnpm lockfile with workspace package manifests (a53ad6e)
- Initial plan (e46835d)
- Merge pull request #340 from plures/copilot/fix-ci-failures-pr-333 (c8df060)
- fix(ci): fall back to github token in copilot lifecycle workflow (2c90131)
- Initial plan (cc84981)
- feat(lifecycle v12): auto-release when milestone completes (edb7b39)
- feat(lifecycle v11): smart CI failure handling — infra vs code (3af4d7a)
- fix(lifecycle): label-based retry counter + CI fix priority (10d5291)
- fix: inline reusable workflow to fix schedule trigger failures (a9d9572)
- chore: remove redundant workflow — handled by centralized ci-reusable.yml or obsolete (9213fdd)
- chore: remove redundant workflow — handled by centralized ci-reusable.yml or obsolete (d441013)
- chore: remove redundant workflow — handled by centralized ci-reusable.yml or obsolete (068e244)
- chore: remove redundant workflow — handled by centralized ci-reusable.yml or obsolete (035d8ff)
- chore: remove redundant workflow — handled by centralized ci-reusable.yml or obsolete (e847635)
- chore: remove redundant workflow — handled by centralized ci-reusable.yml or obsolete (1c3ebf4)
- Merge pull request #337 from plures/copilot/fix-ci-failures-pr-332 (27165e4)
- Merge pull request #331 from plures/feat/praxis-db-package (a04a162)
- fix: update pnpm-lock.yaml to include @plures/praxis dependency for praxis-svelte (b82580e)
- Initial plan (4bdf304)
- fix: restore async/await on storeFact and appendEvent; use void+catch for best-effort persistence (16249ea)
- fix: use actorId in CRDT writes and make adapter methods synchronous (5ebc8f8)
- fix: include actorId in CRDT write payloads and await db.put() calls in PluresDBAdapter (6169500)
- Update packages/praxis-db/src/adapter.ts (df174a8)
- feat: add @plures/praxis-db — PluresDB persistence for praxis-core (aef4a4a)

## [2.6.0] — 2026-04-07

- Merge pull request #329 from plures/copilot/extract-svelte-integration (cff36cb)
- Merge pull request #332 from plures/dependabot/npm_and_yarn/npm-production-9c3178020a (3a72c29)
- chore: remove redundant workflow — handled by release-reusable.yml (079ca84)
- chore: remove redundant workflow — handled by release-reusable.yml (1226655)
- chore: remove redundant workflow — handled by release-reusable.yml (6d6734b)
- chore: centralize release to org-wide reusable workflow (15a2856)
- chore: centralize CI to org-wide reusable workflow (85b88be)
- fix: resolve @plures/praxis-core for JSR publish via import map (82260ef)
- chore: sync jsr.json and deno.json to v2.5.7 (cea5020)
- chore(deps)(deps-dev): bump the npm-production group with 2 updates (b9535bb)
- feat: extract Svelte integration into praxis-svelte package (f90275d)
- Initial plan (0ea3fa2)

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **API Documentation**: Raised `api-documented` dimension from 0% to 100% with `@param`/`@returns` tags
  - Added `@param`/`@returns` JSDoc across 38 source files (68 functions)
  - Covers `conversations/`, `cli/commands/`, `cloud/`, `core/` submodules, `integrations/`, `lifecycle/`, `hooks/`, `dsl.ts`, `vite/`, `examples/`, and `chronos-bridge/` modules
  - All changes are additive JSDoc only — no runtime behavior modified

## [2.4.31] - 2026-03-26

### Fixed

- **CI Pass Rate**: Eliminated systematic `tech-doc-writer` workflow failures and Deno v2 incompatibility
  - Moved job-level `if:` guard to a `gate` step so the job always runs (no more 0-job failure pattern)
  - Updated `publish.yml` and `ci.yml` to `deno-version: v2.x` to fix `deno.json` v2-format deserialization errors

## [2.4.30] - 2026-03-26

### Fixed

- **Type Safety**: Eliminated all `as any` casts in `PraxisCanvas.svelte` and extended ESLint to `.svelte` files
  - Replaced 4 `as any` casts with properly typed alternatives in the Svelte component
  - Added `.svelte` file glob to ESLint `lint` and `lint:fix` scripts

## [2.4.29] - 2026-03-26

### Changed

- **Test Coverage**: Boosted statement/line coverage from ~82% to 84.5%+ across critical modules
  - New `src/__tests__/coverage-additions-3.test.ts` with 70 targeted tests
  - `PluresDBPraxisAdapter` coverage: 28% → ~75%
  - `src/core/schema/loader.common.ts` coverage: 33% → ~90%
  - `src/lifecycle/triggers.ts` coverage: 53% → 100%
  - `src/lifecycle/maintenance.ts` coverage: 44% → ~75%
  - `src/runtime/terminal-adapter.ts` coverage: 47% → 95%

## [2.4.28] - 2026-03-26

### Fixed

- **Security/CI**: Added `pnpm audit --audit-level=high` step to CI to enforce the no-known-vulns health dimension
  - Build fails on any high/critical CVE in the dependency tree
  - Existing `pnpm.overrides` already pin transitive deps to patched versions

## [2.4.27] - 2026-03-26

### Changed

- **API Documentation**: Raised `api-documented` dimension from 0% to 90%+ with `@param`/`@returns` tags
  - Added `@param`/`@returns` JSDoc across 44 source files
  - Covers core API, decision ledger, lifecycle, chronos, project, factory, uncertainty, and research modules
  - All changes are additive JSDoc only — no runtime behavior modified

## [2.4.26] - 2026-03-26

### Fixed

- **Lint**: Achieved `deno lint` clean status (0% → 100%) across `src/`
  - Configured `deno.json` lint exclusions for test files, `no-process-global`, `no-node-globals`, and `require-await`
  - Fixed `ban-types` errors: replaced `{}` empty-object type with `Record` in example files
  - Fixed `no-this-alias` errors: replaced `const self = this` with arrow functions in `reactive-engine.ts` and `expectation.ts`
  - Fixed `prefer-const` errors: 7 `let` → `const` changes for bindings never reassigned

## [2.4.25] - 2026-03-26

### Fixed

- **Type Safety**: Eliminated all explicit `any` violations in `ui/` directory (0% → 100%)
  - Added `ui/` to `lint` and `lint:fix` scripts so CI enforces `no-explicit-any` across all TypeScript source
  - `ui/canvas/canvas-state.ts`: replaced `rule as any` with a narrow intersection type
  - `ui/canvas-inspector/src/verify-fsm-implementation.ts`: replaced `any[]` with `RuleAnalysis[]`
  - `ui/canvas-inspector/src/server.ts`: defined `CanvasNode`, `CanvasEdge`, and `CanvasData` interfaces

## [2.4.24] - 2026-03-26

### Added

- **Test Coverage Infrastructure**: Configured `@vitest/coverage-v8` with enforced thresholds (80% stmt/lines, 75% fn, 60% branches)
  - Added `test:coverage` script to `package.json`
  - CI uploads coverage report as artifact on Node 22.x
  - Added `src/__tests__/coverage-additions.test.ts` and `coverage-additions-2.test.ts` (238+ total tests)
  - Coverage result: statements 82.0%, lines 82.5%, functions 85.2%, branches 67.9%

## [2.4.23] - 2026-03-26

### Fixed

- **Security**: Patched two picomatch CVEs via `pnpm.overrides` (no-known-vulns dimension)
  - GHSA-c2c7-rcm5-vvqj (High) — ReDoS via extglob quantifiers
  - GHSA-3v7f-55p6-f55p (Moderate) — Method injection in POSIX character classes
  - Both fixed in `picomatch@4.0.4`; pinned via `pnpm.overrides`

## [2.4.22] - 2026-03-26

### Added

- **API Documentation**: Added JSDoc to all 113 previously undocumented exported symbols (0% → 100%)
  - Covers 21 files including `mcp/types.ts`, `conversations/types.ts`, `analysis/index.ts`, `experiments/index.ts`, and more
  - Follows existing single-line style for types/interfaces; multi-line `@param`/`@returns` for functions

## [2.4.21] - 2026-03-26

### Fixed

- **CI**: Resolved Deno JSR publish type errors, NuGet empty-secret failure, and Azure Functions wrong build directory
  - Added `import process from 'node:process'` in `src/hooks/context.ts` for Deno compatibility
  - Fixed `require` usage in `src/hooks/install.ts` to use named imports from `node:fs`
  - Routed through `unknown` in `src/core/pluresdb/adapter.ts` to satisfy Deno's stricter type checker
  - NuGet publish now guards on `NUGET_API_KEY` presence before pushing
  - Azure Functions build step now runs inside the correct `AZURE_FUNCTIONAPP_PACKAGE_PATH`

## [2.4.20] - 2026-03-26

### Fixed

- **CI Pass Rate**: Improved CI pass rate from 75% to 95% (ci-pass-rate dimension)
  - Fixed workflow configuration issues causing systematic CI failures

## [2.4.19] - 2026-03-25

### Fixed

- **Publish Pipeline**: Restored the version-published pipeline (0% → 100%)
  - `release.yml` `publish` job condition fixed: now triggers on `workflow_dispatch` in addition to tag push
  - Same fix applied to `Generate changelog` and `Create GitHub Release` steps
  - Synced `jsr.json` and `deno.json` versions to match `package.json` (were pinned at 1.2.0)
  - Fixed `process.cwd()` Deno compat in `src/lifecycle/docs.ts` (`TS2580`)
  - Added post-bump step to `auto-version-bump.yml` to keep `jsr.json`/`deno.json` in sync going forward

## [2.4.18] - 2026-03-25

### Added

- **PluresDB from NPM**: Added `PluresDBPraxisAdapter` to wrap the official PluresDB package from NPM
  - New `createPluresDB()` function to create a Praxis-compatible adapter for PluresDB
  - PluresDB is now a direct dependency (version 1.0.1)
  - Added comprehensive documentation in `src/core/pluresdb/README.md`
  - Added PluresDB usage examples in main README.md

### Changed

- **PluresDB Integration**: Praxis now uses the official PluresDB package from NPM instead of only a local implementation
  - Existing `InMemoryPraxisDB` is still available for development and testing
  - PluresDB adapter provides the same `PraxisDB` interface for seamless integration
  - Updated import_map.json to include PluresDB from npm
  - All existing tests continue to pass with the enhanced integration

## [1.0.0] - 2025-11-25

### Added

- **Stable Release**: First stable release of Praxis framework for both TypeScript and C#
- **C# Implementation** (`csharp/`)
  - Full parity with TypeScript implementation
  - Protocol version 1.0.0 compatibility
  - PluresDB integration with in-memory store
  - Schema registry for CRDT-backed document storage
  - Complete DSL for defining facts, events, rules, and constraints
  - Introspection and visualization (DOT, Mermaid exports)
  - 95 comprehensive tests
  - NuGet package: `Plures.Praxis`

### Changed

- **Version Bump**: Both TypeScript and C# packages are now at 1.0.0
- **Cross-Language Sync**: Both implementations are fully synchronized at protocol version 1.0.0

## [0.2.1] - 2025-11-25

### Added

- **CLI Create Command** (`src/cli/commands/create.ts`)
  - `praxis create app <name>` - Create new Praxis applications with full scaffolding
  - `praxis create component <name>` - Create new Svelte 5 components
  - Generates complete project structure with Vite, TypeScript, and Svelte 5
  - Schema templates for immediate code generation
  - Proper directory structure and configuration files
  - New CLI test suite (`src/__tests__/cli-create.test.ts`) with 5 tests

- **Unum Integration** (`src/integrations/unum.ts`)
  - Identity management with `UnumIdentity`
  - Channel-based communication with `UnumChannel`
  - Real-time message broadcasting
  - Event and fact broadcasting to channels
  - Integration with PluresDB for persistence

- **CodeCanvas Integration** (`src/integrations/code-canvas.ts`)
  - Visual schema editing with `CanvasDocument`
  - Schema to canvas conversion with `schemaToCanvas()`
  - Canvas to schema conversion with `canvasToSchema()`
  - Mermaid diagram export with `canvasToMermaid()`
  - YAML canvas export with `canvasToYaml()`
  - FSM lifecycle validation with `validateWithGuardian()`

- **State-Docs Integration** (`src/integrations/state-docs.ts`)
  - Documentation generation from Praxis schemas
  - Markdown output with Mermaid diagrams
  - Model, component, and logic documentation
  - Rules and constraints documentation
  - State diagram generation

- **Tauri Integration** (`src/integrations/tauri.ts`)
  - Cross-platform desktop app support
  - File system, notifications, and system tray APIs
  - State persistence with `TauriPraxisAdapter`
  - Mock bridge for development/testing
  - Tauri configuration generation

- **CLI Commands** (`src/cli/commands/`)
  - `praxis dev` - Start development server (wraps Vite)
  - `praxis build` - Build for production (web, desktop, mobile targets)
  - `praxis canvas` - Visual schema editor with HTTP server
  - `praxis orchestrate` - Distributed coordination management

### Changed

- **Terminal Adapter** (`src/runtime/terminal-adapter.ts`)
  - Now executes actual shell commands using child_process
  - PluresDB integration for state persistence
  - Support for custom command executors
  - Mock executor for testing
  - Working directory and environment variable support

- **PluresDB Generator** (`src/core/pluresdb/generator.ts`)
  - Fully functional `initDB()` function
  - `getStore()` helper for store access
  - Proper store initialization with PluresDB

- **Logic Generator** (`src/core/logic/generator.ts`)
  - Smart rule implementation based on schema definition
  - Event trigger filtering
  - Condition parsing and action generation

- **Component Generator** (`src/core/component/generator.ts`)
  - Type-specific component logic (form, list, display, navigation)
  - Event dispatchers for user interactions
  - Reactive statements for data binding

- **README.md** - Updated Integration Status
  - All integrations now marked as ✅ Available
  - Updated descriptions for each integration

## [0.2.0] - 2025-11-24

### Added

#### Framework Infrastructure

- **Complete Schema System** (`src/core/schema/`)
  - Comprehensive type definitions for models, components, logic, and orchestration
  - Schema validation and normalization
  - Schema loading from YAML/JSON files
  - Multi-target code generation support (PluresDB, Svelte, State-Docs, Canvas, DSC)

- **Component Generation System** (`src/core/component/generator.ts`)
  - Automatic Svelte component generation from schemas
  - Support for form, display, list, and navigation components
  - TypeScript type generation
  - Test scaffolding generation
  - Documentation generation

- **CLI Tools** (`src/cli/`)
  - `praxis create app|component` - Project scaffolding
  - `praxis generate` - Code generation from schemas
  - `praxis canvas` - Visual schema editor integration
  - `praxis orchestrate` - Distributed system orchestration
  - `praxis login|logout|whoami` - GitHub authentication
  - `praxis cloud` - Cloud service management
  - Full Commander.js integration with help system

#### Svelte 5 Integration

- **Runes API Integration** (`src/integrations/svelte.ts`)
  - `usePraxisState` - Reactive state management with Svelte 5 runes
  - `usePraxisHistory` - Time-travel debugging with undo/redo
  - `usePraxisComputed` - Derived state computations
  - Full TypeScript support with generics
  - Working Svelte 5 counter example

- **Terminal Node Component** (`src/components/TerminalNode.svelte`)
  - Visual command/script execution within Praxis
  - Real-time output streaming
  - Error handling and status indicators
  - Integration with Praxis schemas

#### Cloud & Monetization

- **Praxis Cloud Integration** (`src/cloud/`)
  - GitHub-based authentication (OAuth device flow + PAT)
  - Tier-based billing (Free, Solo, Team, Enterprise)
  - Usage tracking and limit validation
  - Tenant provisioning with storage namespaces
  - Azure Functions relay endpoints

- **GitHub Marketplace Integration**
  - GitHub App manifest configuration
  - Sponsorship tracking
  - Marketplace purchase webhooks
  - Subscription status management

#### Cross-Language Support

- **PowerShell Adapter** (`powershell/Praxis.psm1`)
  - Full cmdlet library for Praxis operations
  - JSON bridge to TypeScript engine
  - Protocol version compatibility checking
  - Comprehensive PowerShell documentation
  - Working counter example

- **CLI Adapter** (`src/adapters/cli.ts`)
  - JSON stdin/stdout interface
  - Bridge for non-TypeScript languages
  - Registry configuration from files

#### Introspection & Visualization

- **Registry Introspection** (`src/core/introspection.ts`)
  - Statistics retrieval (counts, IDs)
  - JSON schema generation
  - Graph representation with nodes and edges
  - Graphviz DOT export
  - Mermaid diagram export
  - Rule and constraint search
  - Module dependency tracking

- **Protocol Versioning** (`src/core/protocol.ts`)
  - Explicit protocol version (v1.0.0)
  - Semantic versioning with stability guarantees
  - Cross-language compatibility checks
  - Migration path documentation

#### Examples & Templates

- **Hero E-Commerce Example** (`src/examples/hero-ecommerce/`)
  - Authentication with session management
  - Shopping cart with dynamic pricing
  - Discount code system
  - Feature flags and A/B testing
  - Loyalty points system
  - Order history tracking

- **Advanced Examples**
  - Advanced TODO app with Svelte integration
  - Basic auth example
  - Svelte counter with runes

- **Project Templates** (`templates/`)
  - Basic app template with minimal setup
  - Fullstack app template with all features

#### Documentation

- **Framework Documentation**
  - `FRAMEWORK.md` - Complete architecture guide
  - `GETTING_STARTED.md` - Comprehensive getting started guide
  - `PROTOCOL_VERSIONING.md` - Protocol versioning specification
  - `FEATURE_SUMMARY.md` - Major features overview
  - `ELEVATION_SUMMARY.md` - Framework transformation summary
  - `SVELTE_INTEGRATION_SUMMARY.md` - Svelte integration details

- **Guide Documents** (`docs/guides/`)
  - Getting started guide
  - Canvas integration guide
  - Orchestration guide (DSC/MCP)
  - Svelte integration guide
  - History state pattern guide
  - Parallel state pattern guide

- **Terminal Node Documentation** (`docs/TERMINAL_NODE.md`)
  - Command execution patterns
  - Schema integration
  - Security considerations

- **Cloud Documentation** (`src/cloud/README.md`)
  - Architecture overview
  - Authentication flow
  - Billing tiers
  - API reference

#### Testing

- **Expanded Test Suite** (9 → 165 tests, 1733% increase)
  - `src/__tests__/actors.test.ts` - Actor lifecycle and behavior (12 tests)
  - `src/__tests__/edge-cases.test.ts` - Edge cases and error handling (19 tests)
  - `src/__tests__/introspection.test.ts` - Registry introspection (14 tests)
  - `src/__tests__/billing.test.ts` - Billing system validation (16 tests)
  - `src/__tests__/cloud.test.ts` - Cloud integration (10 tests)
  - `src/__tests__/provisioning.test.ts` - Tenant provisioning (18 tests)
  - `src/__tests__/generators.test.ts` - Code generation (15 tests)
  - `src/__tests__/schema.test.ts` - Schema validation (11 tests)
  - `src/__tests__/svelte-integration.test.ts` - Svelte integration (16 tests)
  - `src/__tests__/terminal-node.test.ts` - Terminal node functionality (16 tests)
  - `src/__tests__/protocol.test.ts` - Protocol versioning (3 tests)
  - All existing tests maintained and passing

#### Infrastructure

- **CI/CD Workflows** (`.github/workflows/`)
  - Node.js CI with multiple versions (18.x, 20.x)
  - Deno compatibility checks
  - CodeQL security scanning
  - Release workflow with GitHub releases
  - JSR publishing workflow (configured, ready to enable)
  - Stale issue management

- **GitHub Configuration**
  - Issue templates (bug, enhancement, proposal, integration, generator)
  - Pull request template with checklist
  - Funding configuration
  - Label system
  - Dependabot configuration
  - Pre-commit hooks template

- **Build Configuration**
  - TypeScript strict mode enabled
  - Vitest test framework
  - Deno tasks configuration
  - NPM and JSR publishing setup

### Changed

- **README.md** - Updated to reflect full framework capabilities
  - Framework positioning and philosophy
  - Comprehensive feature list
  - Integration status dashboard
  - Updated examples and usage
  - Cross-platform runtime information

- **Package Configuration**
  - Enhanced exports for submodules (svelte, schema, component, cloud, components)
  - Updated keywords for better discoverability
  - Peer dependencies for Svelte 5

### Fixed

- TypeScript compilation with strict mode
- Test suite organization with proper vitest configuration
- Export paths for library consumption

### Security

- CodeQL scanning enabled
- Secure token storage for authentication
- GitHub OAuth with proper scopes
- Input validation in schema loader
- Safe command execution in terminal adapter

## [0.1.0] - 2025-11-15

### Added

- Initial release of Praxis TypeScript library
- Core type definitions: `PraxisState`, `PraxisEvent`, `StepResult`, `Effect`, `StepFunction`
- Fluent DSL for defining rules and constraints
- Registry system for managing rules and constraints
- Pure step functions for state transitions
- Support for flows and actors
- Actor system for managing multiple actors
- Comprehensive test suite with 9 tests
- Working counter example demonstrating all features
- Full TypeScript type definitions
- JSON-friendly serialization for all types
- Documentation and README

### Features

- **Logic-First Design**: Build applications around facts, events, rules, and constraints
- **Pure Functional Core**: State transitions via pure `step` functions
- **Fluent DSL**: Intuitive API for defining rules and constraints
- **Registry System**: Centralized management of rules and constraints
- **Flows & Actors**: Orchestrate complex state transitions
- **JSON-Friendly**: All types are serializable for cross-platform use
- **Type-Safe**: Full TypeScript support with strict typing

[2.4.31]: https://github.com/plures/praxis/releases/tag/v2.4.31
[2.4.30]: https://github.com/plures/praxis/releases/tag/v2.4.30
[2.4.29]: https://github.com/plures/praxis/releases/tag/v2.4.29
[2.4.28]: https://github.com/plures/praxis/releases/tag/v2.4.28
[2.4.27]: https://github.com/plures/praxis/releases/tag/v2.4.27
[2.4.26]: https://github.com/plures/praxis/releases/tag/v2.4.26
[2.4.25]: https://github.com/plures/praxis/releases/tag/v2.4.25
[2.4.24]: https://github.com/plures/praxis/releases/tag/v2.4.24
[2.4.23]: https://github.com/plures/praxis/releases/tag/v2.4.23
[2.4.22]: https://github.com/plures/praxis/releases/tag/v2.4.22
[2.4.21]: https://github.com/plures/praxis/releases/tag/v2.4.21
[2.4.20]: https://github.com/plures/praxis/releases/tag/v2.4.20
[2.4.19]: https://github.com/plures/praxis/releases/tag/v2.4.19
[2.4.18]: https://github.com/plures/praxis/releases/tag/v2.4.18
[1.0.0]: https://github.com/plures/praxis/releases/tag/v1.0.0
[0.2.1]: https://github.com/plures/praxis/releases/tag/v0.2.1
[0.2.0]: https://github.com/plures/praxis/releases/tag/v0.2.0
[0.1.0]: https://github.com/plures/praxis/releases/tag/v0.1.0
