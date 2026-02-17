# Praxis Monorepo Architecture

This document describes the overall architecture of the Praxis repository after its monorepo transformation. It covers package structure, relationships, design principles, and architectural patterns.

## Table of Contents

- [Overview](#overview)
- [Monorepo Structure](#monorepo-structure)
- [Package Architecture](#package-architecture)
- [Design Principles](#design-principles)
- [System Architecture](#system-architecture)
- [Data Flow](#data-flow)
- [Integration Points](#integration-points)
- [Tooling & Automation](#tooling--automation)
- [Decision Ledger](#decision-ledger)
- [References](#references)

## Overview

Praxis is a **local-first application framework** that combines typed logic modeling (facts, events, rules, constraints), component generation (Svelte 5), and local-first data persistence (PluresDB). The framework is now organized as a **monorepo** with clear package boundaries, enabling modular development while maintaining a cohesive developer experience.

### Key Features

- **Logic Engine**: Declarative facts, events, rules, and constraints
- **Schema System**: Type-safe data modeling with validation
- **Component Generation**: Automatic Svelte 5 component generation from schemas
- **Decision Ledger**: Contract-based behavior specifications for rules and constraints
- **Local-First Data**: PluresDB integration with CRDT support
- **Distributed Systems**: Unum integration for peer-to-peer communication
- **Cloud Sync**: Optional Azure-based relay for multi-device synchronization
- **Visual Tools**: CodeCanvas for visual editing, State-Docs for documentation
- **CLI Tools**: Project scaffolding, code generation, and validation
- **Cross-Language**: Protocol versioning for multi-language implementations (C#, PowerShell)

## Monorepo Structure

```
praxis/
├── packages/                    # Published npm packages
│   ├── praxis-core/            # Core logic library (zero dependencies)
│   ├── praxis-cli/             # Command-line interface
│   ├── praxis-svelte/          # Svelte 5 integration
│   ├── praxis-cloud/           # Cloud sync and relay
│   └── praxis/                 # Main package (re-exports all)
├── apps/                        # Example applications (not published)
├── src/                         # Legacy source code (migration in progress)
├── core/                        # Core modules (being migrated to packages)
├── tools/                       # Development tools
├── ui/                          # UI components and tools
├── docs/                        # Documentation
├── examples/                    # Simple examples
├── test/                        # Test fixtures
└── .github/                     # CI/CD and automation

Workspace: PNPM with workspaces (packages/*, apps/*)
Build: TypeScript (tsup), Vite (Svelte)
Test: Vitest
Package Manager: pnpm@9.15.1
```

### Current Migration Status

The monorepo structure is in place with package directories and configurations, but code migration from legacy structure to packages is **in progress**. The `src/` and `core/` directories still contain the primary codebase while packages are being populated incrementally.

## Package Architecture

### Dependency Graph

```
┌─────────────────────────────────────────────────┐
│                    praxis                       │
│           (Main unified package)                │
│         Re-exports all sub-packages             │
└───────────┬────────────────┬───────────┬────────┘
            │                │           │
            ▼                ▼           ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ praxis-cli   │  │praxis-svelte │  │ praxis-cloud │
    │              │  │              │  │              │
    └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
           │                 │                 │
           └─────────────────┴─────────────────┘
                             │
                             ▼
                    ┌──────────────┐
                    │ praxis-core  │
                    │ (Zero deps)  │
                    └──────────────┘
```

### Package Descriptions

#### packages/praxis-core

**Purpose**: Core logic library with no external dependencies.

**Contents**:
- Logic engine (facts, events, rules, constraints, engine)
- Schema system (definitions, validation, normalization)
- Decision ledger primitives (contracts, behavior specs)
- Protocol definitions (versioned at 1.0.0)
- Type definitions

**Dependencies**: Minimal (only essential utilities)

**Exports**: `@plures/praxis-core`

**Stability**: High (semver major for breaking changes)

#### packages/praxis-cli

**Purpose**: Command-line interface for scaffolding and code generation.

**Contents**:
- Project scaffolding commands (`create`, `init`)
- Code generators (components, schemas, rules)
- Template system
- Validation tools (`validate`, `scan:rules`)
- Conversation ingestion CLI (`conversations`)
- Cloud management commands (`login`, `cloud`)

**Dependencies**: praxis-core, commander, js-yaml, file system utilities

**Exports**: `@plures/praxis-cli` (binary: `praxis-cli`)

**Stability**: Medium (can evolve more freely)

#### packages/praxis-svelte

**Purpose**: Svelte 5 integration with runes and reactive components.

**Contents**:
- Reactive engine with Svelte runes
- Component generators (Svelte components from schemas)
- Runtime integration
- Svelte-specific utilities (TerminalNode.svelte, etc.)

**Dependencies**: praxis-core, svelte (peer)

**Exports**: `@plures/praxis-svelte`

**Stability**: Medium (tracks Svelte releases)

#### packages/praxis-cloud

**Purpose**: Cloud synchronization and relay server.

**Contents**:
- Cloud relay server implementation (Azure Functions)
- Sync protocol (delta-based, CRDT-aware)
- WebSocket/HTTP adapters
- Authentication (GitHub OAuth, device flow)
- Billing integration (GitHub Sponsors, Marketplace)
- Provisioning and tenant management

**Dependencies**: praxis-core, networking libraries, Azure SDK

**Exports**: `@plures/praxis-cloud`

**Stability**: Medium (independent evolution)

#### packages/praxis

**Purpose**: Main package that re-exports everything for backwards compatibility.

**Contents**:
- Re-exports from praxis-core, praxis-svelte, praxis-cli, praxis-cloud
- Maintains current API surface
- Provides unified imports for convenience

**Dependencies**: All other packages

**Exports**: `@plures/praxis` (current main package)

**Subpath Exports**:
- `./` → Core engine and schema
- `./svelte` → Svelte integration
- `./schema` → Schema utilities
- `./component` → Component generation
- `./cloud` → Cloud sync APIs
- `./components` → Pre-built Svelte components

## Design Principles

### 1. Local-First Architecture

**Philosophy**: Applications should work fully offline, with optional cloud sync.

**Implementation**:
- All logic runs locally in the Praxis engine
- PluresDB provides local persistence
- Cloud relay is optional, not required
- CRDTs enable conflict-free merges when syncing

### 2. Zero-Dependency Core

**Philosophy**: Core logic should be pure, portable, and dependency-free.

**Implementation**:
- `praxis-core` has no external dependencies
- Integrations (Svelte, cloud) are in separate packages
- Easier to use in different environments (Node, browser, Deno)
- Reduces security surface area

### 3. Declarative Logic

**Philosophy**: Application logic should be expressed as rules and constraints, not imperative code.

**Implementation**:
```typescript
// Define facts
const UserLoggedIn = defineFact<'UserLoggedIn', { userId: string }>('UserLoggedIn');

// Define rules
const loginRule = defineRule({
  id: 'auth.login',
  description: 'Process login event',
  impl: (state, events) => {
    const evt = events.find(Login.is);
    if (!evt) return [];
    state.context.currentUser = evt.payload.username;
    return [UserLoggedIn.create({ userId: evt.payload.username })];
  },
});
```

### 4. Contract-Based Behavior (Decision Ledger)

**Philosophy**: Rules and constraints should have explicit contracts defining their behavior.

**Implementation**:
- Every rule/constraint should have a contract attached via `meta.contract`
- Contracts specify examples, invariants, and edge cases
- Contracts are validated in tests
- See `docs/decision-ledger/DOGFOODING.md` for guidelines

### 5. Incremental Migration

**Philosophy**: Major refactorings should be incremental and non-breaking.

**Implementation**:
- Monorepo structure added without moving code
- Main `@plures/praxis` package maintains backwards compatibility
- Users can migrate to granular imports gradually
- Each migration step is testable and reversible

### 6. Protocol Versioning

**Philosophy**: Enable cross-language implementations with stability guarantees.

**Implementation**:
- Protocol version 1.0.0 (semantic versioning)
- JSON-serializable protocol types
- Cross-language coordination for changes
- 6-month support for previous major version
- See `PROTOCOL_VERSIONING.md` for details

## System Architecture

### Core Engine Architecture

```
┌────────────────────────────────────────────────────┐
│                  Application                       │
└───────────────────┬────────────────────────────────┘
                    │ Events
                    ▼
┌────────────────────────────────────────────────────┐
│              Praxis Engine                         │
│  ┌──────────────────────────────────────────────┐ │
│  │         PraxisRegistry                       │ │
│  │  - Facts, Events, Rules, Constraints         │ │
│  └──────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────┐ │
│  │         Engine Loop                          │ │
│  │  1. Process events                           │ │
│  │  2. Execute rules (emit facts)               │ │
│  │  3. Check constraints                        │ │
│  │  4. Update state                             │ │
│  │  5. Notify actors                            │ │
│  └──────────────────────────────────────────────┘ │
└───────────┬─────────────────────────┬──────────────┘
            │ Facts                   │ State Changes
            ▼                         ▼
┌─────────────────────┐    ┌─────────────────────┐
│      Actors         │    │   Persistence       │
│  - Logging          │    │  - PluresDB         │
│  - Analytics        │    │  - Azure Blob       │
│  - UI Updates       │    │  - Local Storage    │
└─────────────────────┘    └─────────────────────┘
```

### Conversation Ingestion System

```
┌─────────────────────────────────────────────────────┐
│            Conversation Pipeline                    │
│                                                     │
│  Input → Capture → Redact → Normalize → Classify  │
│            ↓        ↓         ↓           ↓        │
│         JSON     PII       Format      Keywords    │
│                 Removal   Cleanup     Detection    │
│                                                     │
│  Classify → Candidates → Gate → Emit               │
│      ↓          ↓          ↓      ↓                │
│   Tags      Issue/Doc   Quality  GitHub/FS         │
│            Templates    Checks                      │
└─────────────────────────────────────────────────────┘
```

**Features**:
- Deterministic-first (no LLM required)
- PII redaction (emails, phones, IPs, SSNs, credit cards)
- Quality gates (min length, valid title, metadata, duplicates)
- Hard-gated GitHub emitter (requires `--commit-intent`)
- Multiple emitters (filesystem, GitHub issues)

### Cloud Sync Architecture

```
┌──────────────────────────────────────────────────┐
│                Local App                         │
│  Praxis Engine + PluresDB + Unum                │
└────────────┬─────────────────────────────────────┘
             │ HTTPS/WebSocket
             ▼
┌──────────────────────────────────────────────────┐
│         Praxis Cloud Relay (Azure)              │
│  ┌────────────────────────────────────────────┐ │
│  │  Azure Functions (Serverless)              │ │
│  │  - /sync - Delta synchronization           │ │
│  │  - /health - Health checks                 │ │
│  │  - /stats - Usage statistics               │ │
│  │  - /usage - Current usage metrics          │ │
│  └────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────┐ │
│  │  Authentication (GitHub OAuth)             │ │
│  │  - Device flow                             │ │
│  │  - Token validation                        │ │
│  │  - Sponsors API integration                │ │
│  └────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────┐ │
│  │  Storage (Azure Blob Storage)              │ │
│  │  - Tenant namespaces (gh-{user}-{hash})    │ │
│  │  - CRDT-aware deltas                       │ │
│  │  - Encrypted at rest                       │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────┐
│            GitHub Integration                    │
│  - OAuth (authentication)                        │
│  - Sponsors API (billing)                        │
│  - Marketplace (enterprise)                      │
└──────────────────────────────────────────────────┘
```

## Data Flow

### Event Processing Flow

```
Event Creation → Engine.step() → Rules Execution → Facts Emission
                                        ↓
                                 State Update
                                        ↓
                                 Constraints Check
                                        ↓
                                 Actor Notification
                                        ↓
                                 Persistence (PluresDB)
```

### Schema to Component Flow

```
Schema Definition → Schema Validation → Component Generation
                                              ↓
                                       Svelte Component
                                              ↓
                                       UI Rendering
```

### Cloud Sync Flow

```
Local Change → Delta Calculation → Relay /sync → Storage
                                                     ↓
                                              Broadcast
                                                     ↓
                                          Other Devices
```

## Integration Points

### PluresDB Integration

- **Purpose**: Local-first persistence with CRDT support
- **Adapter**: `createPluresDBAdapter({ db, registry })`
- **Features**: Automatic fact persistence, query interface, conflict-free merges
- **Package**: `@plures/pluresdb@^1.6.10`

### Unum Integration

- **Purpose**: Distributed peer-to-peer communication
- **Features**: Identity management, channel-based messaging, event broadcasting
- **Use Case**: Real-time collaboration without central server

### Svelte Integration

- **Purpose**: Reactive UI components
- **Features**: Runes-based reactivity, automatic re-rendering, component generation
- **Exports**: `@plures/praxis/svelte`

### Azure Functions Integration

- **Purpose**: Serverless cloud relay
- **Endpoints**: `/sync`, `/health`, `/stats`, `/usage`
- **Deployment**: Azure Functions (Node.js runtime)

### GitHub Integration

- **OAuth**: Device flow for CLI authentication
- **Sponsors API**: Subscription tier verification
- **Marketplace**: Enterprise billing (preparatory)
- **Webhooks**: Sponsorship and marketplace events

## Tooling & Automation

### Build System

- **TypeScript**: Strict mode, ESM/CJS dual builds
- **tsup**: Fast TypeScript bundler
- **Vite**: Development server and Svelte bundling
- **PNPM**: Fast, disk-efficient package manager

### Testing

- **Vitest**: Fast, ESM-native test runner
- **Coverage**: 63 tests for core, 18 for conversations subsystem
- **Fixtures**: `test/fixtures/` for test data

### CI/CD (GitHub Actions)

```
Workflows:
├── ci.yml                    # Main CI (build, test, typecheck)
├── codeql.yml                # Security scanning
├── release.yml               # Automated releases
├── publish.yml               # npm/JSR publishing
├── publish-nuget.yml         # C# NuGet publishing
├── batch-pin-bumps.yml       # Weekly dependency updates
├── bot-weekly-log.yml        # Bot activity logging
├── praxis-pr-overlap-guard.yml  # PR overlap detection
├── stale.yml                 # Stale issue management
└── auto-version-bump.yml     # Automated versioning
```

### Bot Workflows

**Philosophy**: Batched weekly updates to reduce commit churn.

**Workflows**:
1. **batch-pin-bumps** (Mondays, 08:00 UTC): Batch dependency pin bumps
2. **Dependabot** (Mondays, 09:00 UTC): Grouped dependency updates
   - npm-production (weekly)
   - npm-dev-tools (weekly)
   - github-actions (weekly)
3. **bot-weekly-log** (Mondays, 10:00 UTC): Commit activity log to `.github/bot-logs/`

**Audit Trail**: Weekly logs in `.github/bot-logs/YYYY-WWW.md` linked from `INDEX.md`

**PR Overlap Guard**: Custom trigram-based title matching and patch signature comparison to detect overlapping PRs.

### Decision Ledger Tools

- **scan:rules**: `npm run scan:rules` - Scan for rules/constraints and check contracts
- **validate:contracts**: `npm run validate:contracts` - Validate all contracts
- **validate:contracts:sarif**: Output validation results in SARIF format

### CLI Commands

```bash
# Project management
praxis create app <name>        # Create new app with scaffolding
praxis create component <name>  # Create Svelte component
praxis init                     # Initialize existing project

# Development
praxis dev                      # Start dev server
praxis build                    # Build for production

# Validation
praxis validate                 # Validate contracts
praxis scan:rules               # Scan for rules with contracts

# Conversations
praxis conversations capture    # Capture conversation
praxis conversations push       # Process through pipeline
praxis conversations classify   # Classify and generate candidate
praxis conversations emit       # Emit to GitHub/filesystem

# Cloud
praxis login                    # Authenticate with GitHub
praxis cloud init               # Initialize cloud sync
praxis cloud status             # Check connection status
praxis cloud usage              # View usage metrics
```

## Decision Ledger

### Overview

Praxis dogfoods its own Decision Ledger system to ensure all rules and constraints have explicit behavioral contracts.

### Requirements

When adding or modifying rules/constraints:
1. Create/update a contract via `defineContract`
2. Attach it to `meta.contract` on the rule/constraint
3. Add/update tests that cover contract examples and invariants
4. Update decision-ledger docs if behavior changes

### Running Checks

```bash
npm run scan:rules           # Scan for rules without contracts
npm run validate:contracts   # Validate all contracts
```

### Documentation

- `docs/decision-ledger/DOGFOODING.md` - Guidelines for dogfooding
- `docs/decision-ledger/BEHAVIOR_LEDGER.md` - Behavior ledger concepts
- `docs/decision-ledger/decisions/` - Architectural decision records

## References

### Core Documentation

- [README.md](./README.md) - Main project documentation
- [MONOREPO.md](./MONOREPO.md) - Monorepo organization plan
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - User migration guide
- [PROTOCOL_VERSIONING.md](./PROTOCOL_VERSIONING.md) - Protocol versioning
- [FRAMEWORK.md](./FRAMEWORK.md) - Framework concepts
- [GETTING_STARTED.md](./GETTING_STARTED.md) - Quick start guide

### Feature Documentation

- [CONVERSATIONS_IMPLEMENTATION.md](./CONVERSATIONS_IMPLEMENTATION.md) - Conversation ingestion
- [DECISION_LEDGER_IMPLEMENTATION.md](./DECISION_LEDGER_IMPLEMENTATION.md) - Decision ledger
- [CROSS_LANGUAGE_SYNC.md](./CROSS_LANGUAGE_SYNC.md) - Cross-language support
- [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) - Implementation status

### Package Documentation

- `packages/praxis-core/README.md` - Core library documentation
- `packages/praxis-cli/README.md` - CLI documentation
- `packages/praxis-svelte/README.md` - Svelte integration documentation
- `packages/praxis-cloud/README.md` - Cloud sync documentation
- `packages/praxis/README.md` - Main package documentation

### Decision Records

- `docs/decision-ledger/decisions/2026-02-01-monorepo-organization.md` - Monorepo decision
- `docs/decision-ledger/decisions/` - All architectural decisions

### Bot & Workflow Documentation

- `docs/BOT_UPDATE_POLICY.md` - Bot update policies
- `docs/workflows/pr-overlap-guard.md` - PR overlap detection
- `docs/TESTING_BOT_WORKFLOWS.md` - Bot workflow testing

### Cloud & Monetization

- `docs/MONETIZATION.md` - GitHub-based monetization
- `github/marketplace/listing.md` - Marketplace listing
- `src/cloud/README.md` - Cloud implementation details

---

**Last Updated**: 2026-02-16  
**Version**: 1.2.26  
**Protocol Version**: 1.0.0
