# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.0]: https://github.com/plures/praxis/releases/tag/v1.0.0
[0.2.1]: https://github.com/plures/praxis/releases/tag/v0.2.1
[0.2.0]: https://github.com/plures/praxis/releases/tag/v0.2.0
[0.1.0]: https://github.com/plures/praxis/releases/tag/v0.1.0
