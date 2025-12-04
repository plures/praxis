# Praxis

[![CI](https://github.com/plures/praxis/workflows/CI/badge.svg)](https://github.com/plures/praxis/actions/workflows/ci.yml)
[![CodeQL](https://github.com/plures/praxis/workflows/CodeQL/badge.svg)](https://github.com/plures/praxis/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/@plures/praxis.svg)](https://www.npmjs.com/package/@plures/praxis)
[![NuGet](https://img.shields.io/nuget/v/Plures.Praxis.svg)](https://www.nuget.org/packages/Plures.Praxis/)
[![JSR](https://jsr.io/badges/@plures/praxis)](https://jsr.io/@plures/praxis)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Deno Compatible](https://img.shields.io/badge/deno-compatible-brightgreen)](https://deno.land/)

**The Full Plures Application Framework**

---

## 📊 Project Dashboard

### Quick Links

- 📖 [Documentation](./docs/) | [Getting Started](./GETTING_STARTED.md) | [Framework Guide](./FRAMEWORK.md)
- 💬 [Discussions](https://github.com/plures/praxis/discussions) | [Issues](https://github.com/plures/praxis/issues)
- 🚀 [Contributing](./CONTRIBUTING.md) | [Security Policy](./SECURITY.md)
- 📋 [Changelog](./CHANGELOG.md) | [Roadmap](https://github.com/plures/praxis/issues?q=is%3Aissue+is%3Aopen+label%3Aroadmap)
- 🔄 [Cross-Language Sync](./CROSS_LANGUAGE_SYNC.md) | [C# Documentation](./csharp/Praxis/README.md)

### Project Status

| Category               | Status                                    |
| ---------------------- | ----------------------------------------- |
| **CI/CD**              | ✅ Automated testing & builds             |
| **Version**            | 1.0.2 (Stable)                            |
| **Runtime Support**    | Node.js 18+, Deno (experimental), .NET 8+ |
| **Package Registries** | npm ✅ / NuGet ✅ / JSR ✅                |
| **Test Coverage**      | 327 TypeScript + 95 C# tests passing      |
| **Documentation**      | 📚 Comprehensive guides available         |

### Language Support

| Language       | Package        | Registry | Status       |
| -------------- | -------------- | -------- | ------------ |
| **TypeScript** | @plures/praxis | npm      | ✅ Available |
| **C#**         | Plures.Praxis  | NuGet    | ✅ Available |
| **PowerShell** | Praxis.psm1    | GitHub   | ✅ Available |

### Integration Status

| Integration      | Status          | Notes                                        |
| ---------------- | --------------- | -------------------------------------------- |
| **Praxis Cloud** | ✅ Available    | Azure-hosted relay for sync & monetization   |
| **PluresDB**     | ✅ Available    | Local-first reactive datastore with 32 tests |
| **Unum**         | ✅ Available    | Identity & channels integration              |
| **Svelte 5**     | ✅ Full Support | Runes API, stores, history, time-travel      |
| **Tauri**        | ✅ Available    | Cross-platform desktop runtime               |
| **CodeCanvas**   | ✅ Available    | Visual schema editor & FSM enforcement       |
| **State-Docs**   | ✅ Available    | Documentation generation from schemas        |

---

## Overview

Praxis is not just a logic engine—it's a **complete framework** for building modern, local-first, distributed applications. It provides:

- **Declarative Schemas**: Define your data models, logic, and components in a unified schema format (PSF)
- **Logic/State Machines**: Pure, functional application logic with facts, events, rules, and constraints
- **Component Generation**: Automatically generate Svelte components from schemas
- **Local-First Data**: Integrated PluresDB for reactive, offline-capable data storage
- **Documentation Generation**: Automatic documentation generation from schemas with Mermaid diagrams
- **Visual Design**: CodeCanvas integration for visual schema and logic editing
- **Real-Time Code ↔ Canvas Sync**: Bidirectional synchronization between code and visual editor
- **Orchestration**: DSC/MCP support for distributed system coordination
- **Cross-Platform Runtime**: Web, desktop, and mobile via Svelte + Tauri

## 🚀 Praxis 1.0 Architecture

Praxis 1.0 introduces a **schema-driven, modular architecture** where the Praxis Schema Format (PSF) serves as the single source of truth.

### Praxis Schema Format (PSF)

PSF is the canonical JSON/AST format that defines your entire application:

```json
{
  "$version": "latest",
  "id": "my-app",
  "name": "My Application",
  "facts": [...],
  "events": [...],
  "rules": [...],
  "constraints": [...],
  "models": [...],
  "components": [...],
  "flows": [...]
}
```

From this schema, Praxis generates:

- **TypeScript types** for facts, events, rules
- **Svelte components** for UI
- **Markdown documentation** with Mermaid diagrams
- **Database schemas** for PluresDB
- **Canvas visualization** for visual editing

### Modular Folder Structure

```
/praxis
├── core/                     # Core framework modules
│   ├── schema-engine/        # PSF types, compiler, generator, validator
│   ├── logic-engine/         # Rules, constraints, engine, PSF adapter
│   ├── db-adapter/           # PluresDB sync engine
│   └── codegen/              # Documentation and code generators
├── ui/                       # UI modules
│   ├── svelte-generator/     # PSF-aware Svelte component generation
│   └── canvas/               # Visual canvas state and projection
├── tools/                    # Developer tools
│   ├── cli/                  # Command-line interface
│   └── watcher/              # File watching and live sync
├── extensions/               # Optional integrations
│   ├── dsc/                  # DSC/MCP orchestration
│   ├── azure/                # Azure integration
│   └── devtools/             # Developer tools
└── examples/                 # Example applications
    ├── hero-shop/            # Full e-commerce example
    └── todo/                 # Minimal todo example
```

### Framework Philosophy

### Core Framework Components

Praxis provides these integrated capabilities:

- **Schema Engine** – PSF parser, compiler, generator, and validator
- **Logic Engine** – Typed facts, events, rules, and constraints for application logic
- **Component Factory** – Generate Svelte components from schemas with data bindings
- **Data Layer** – PluresDB integration for reactive, local-first data storage
- **State Machines** – Flows and scenarios for orchestrated behaviors
- **Actors** – Effectful units for side effects and external system integration
- **Terminal Nodes** – Execute commands and scripts within the Praxis framework
- **Documentation** – Automatic documentation generation from schemas with Mermaid diagrams
- **Visual IDE** – CodeCanvas integration for schema and logic editing
- **Orchestration** – DSC/MCP support for distributed coordination
- **CLI Tools** – Command-line interface for scaffolding and generation

### Design Philosophy

1. **Schema-Driven Development**
   - Define once, generate everywhere (models, components, docs, orchestration)
   - Single source of truth for your application structure
   - Type-safe by default across all layers

2. **Local-First Architecture**
   - Offline-capable by default with PluresDB
   - Sync when connected, work always
   - Data ownership and privacy built-in

3. **Strong typing and functional programming**
   - Core abstractions are strongly typed: `Fact<Tag, Payload>`, `Event<Tag, Payload>`, `Rule<Context, InFact, OutFact>`
   - Pure functions for testability and reasoning
   - Immutable state updates

4. **Visual and Code Workflows**
   - CodeCanvas for visual schema and logic editing
   - Full code-level control when needed
   - Seamless transitions between visual and code

5. **Cross-Platform and Cross-Language**
   - TypeScript-first with C# and PowerShell support
   - Web, desktop, mobile via Svelte + Tauri
   - Language-agnostic core protocol for maximum portability

## Framework Features

### 🏗️ Full Application Framework

- **Schema-Driven**: Define data models, logic, and UI in unified schemas
- **Component Generation**: Auto-generate Svelte components from schemas
- **CLI Tools**: `praxis create`, `praxis generate`, `praxis canvas` commands
- **Templates**: Pre-built app templates (basic, fullstack, distributed)
- **Integrated Stack**: PluresDB + Unum + ADP + State-Docs + Canvas

### 🎨 Visual Development

- **CodeCanvas Integration**: Visual schema and logic editor
- **Component Preview**: See generated components in real-time
- **Flow Visualization**: Visualize state machines and orchestration
- **Interactive Docs**: Navigate documentation with State-Docs

### 🔌 Ecosystem Integration

- **PluresDB**: Local-first reactive data storage
- **Unum**: Identity and channels for distributed systems
- **ADP**: Architectural guardrails and decision tracking
- **State-Docs**: Living documentation generation
- **Svelte 5**: Full runes support with history and time-travel
- **Tauri**: Cross-platform runtime (web/desktop/mobile)

### ⚡ Svelte 5 Integration

- **Runes API**: Modern `$state`, `$derived`, `$effect` support
- **History States**: Built-in undo/redo and time-travel debugging
- **Store API**: Backward-compatible stores for Svelte 4/5
- **Type Safety**: Full TypeScript support with composables
- **Zero Config**: Works out of the box with Svelte 5

## Logic Engine Features

- 🎯 **Logic-First Design**: Build applications around facts, events, rules, and constraints
- 🔄 **Pure Functional Core**: State transitions via pure `step` functions
- 📝 **Fluent DSL**: Intuitive API for defining rules and constraints
- 🗂️ **Registry System**: Centralized management of rules and constraints
- 🌊 **Flows & Actors**: Orchestrate complex state transitions
- 📦 **JSON-Friendly**: All types are serializable for cross-platform use
- 🔒 **Type-Safe**: Full TypeScript support with strict typing
- 🔍 **Introspection**: Generate schemas, graphs, and visualizations of your logic
- 🌐 **Cross-Language**: C#, PowerShell, and TypeScript implementations with protocol versioning
- 📊 **Comprehensive Testing**: 327 TypeScript and 95 C# tests covering all features
- 🎭 **Hero Example**: Full e-commerce demo with auth, cart, features, and actors

## Installation

### npm (Node.js)

```bash
npm install @plures/praxis
```

### NuGet (.NET / C#)

```bash
dotnet add package Plures.Praxis
```

Or add to your `.csproj`:

```xml
<PackageReference Include="Plures.Praxis" Version="0.2.1" />
```

See [C# Documentation](./csharp/Praxis/README.md) for detailed usage.

### JSR (Deno)

```bash
# Coming soon - JSR publishing in progress
deno add @plures/praxis
```

For now, you can use Praxis with Deno via import maps:

```typescript
// import_map.json
{
  "imports": {
    "@plures/praxis": "npm:@plures/praxis@^0.2.1"
  }
}
```

### From Source

```bash
# Clone the repository
git clone https://github.com/plures/praxis.git
cd praxis

# TypeScript
npm install
npm run build
npm test

# C#
cd csharp
dotnet build
dotnet test
```

## Quick Start

### Using the Praxis CLI

The Praxis CLI provides commands for creating and managing applications.

```bash
# Install Praxis globally
npm install -g @plures/praxis

# Create a new application
praxis create app my-app
cd my-app
npm install

# Generate code from schemas
praxis generate --schema src/schemas/app.schema.ts

# Open CodeCanvas for visual editing
praxis canvas src/schemas/app.schema.ts

# Start development server
npm run dev

# Build for production
npm run build
```

Available CLI commands:

- `praxis login` - Authenticate with GitHub (device flow or token)
- `praxis logout` - Log out from Praxis Cloud
- `praxis whoami` - Show current authenticated user
- `praxis create app [name]` - Create new application
- `praxis create component [name]` - Create new component
- `praxis generate` - Generate code from schemas
- `praxis canvas [schema]` - Open visual editor
- `praxis orchestrate` - Manage distributed systems
- `praxis cloud init` - Connect to Praxis Cloud
- `praxis cloud status` - Check cloud connection
- `praxis cloud sync` - Manually sync to cloud
- `praxis cloud usage` - View cloud usage metrics
- `praxis dev` - Start development server
- `praxis build` - Build for production

See [docs/guides/getting-started.md](./docs/guides/getting-started.md) for detailed instructions.

### Praxis Cloud

Connect your application to Praxis Cloud for automatic synchronization with GitHub-native authentication and billing:

```bash
# Authenticate with GitHub
npx praxis login

# Initialize cloud connection
npx praxis cloud init

# In your code
import { connectRelay } from "@plures/praxis/cloud";

const relay = await connectRelay("https://praxis-relay.azurewebsites.net", {
  appId: "my-app",
  authToken: process.env.GITHUB_TOKEN,
  autoSync: true
});

// Sync automatically handles CRDT merge
await relay.sync({
  type: "delta",
  appId: "my-app",
  clock: {},
  facts: [...],
  timestamp: Date.now()
});
```

See [src/cloud/README.md](./src/cloud/README.md) and [examples/cloud-sync](./examples/cloud-sync) for details.

### Basic Example (Logic Engine)

```typescript
import {
  createPraxisEngine,
  PraxisRegistry,
  defineFact,
  defineEvent,
  defineRule,
} from '@plures/praxis';

// Define the context type
interface AuthContext {
  currentUser: string | null;
}

// Define facts and events
const UserLoggedIn = defineFact<'UserLoggedIn', { userId: string }>('UserLoggedIn');
const Login = defineEvent<'LOGIN', { username: string }>('LOGIN');

// Define rules
const loginRule = defineRule<AuthContext>({
  id: 'auth.login',
  description: 'Process login event',
  impl: (state, events) => {
    const loginEvent = events.find(Login.is);
    if (loginEvent) {
      state.context.currentUser = loginEvent.payload.username;
      return [UserLoggedIn.create({ userId: loginEvent.payload.username })];
    }
    return [];
  },
});

// Create engine
const registry = new PraxisRegistry<AuthContext>();
registry.registerRule(loginRule);

const engine = createPraxisEngine({
  initialContext: { currentUser: null },
  registry,
});

// Dispatch events
const result = engine.step([Login.create({ username: 'alice' })]);
console.log(result.state.facts); // [{ tag: "UserLoggedIn", payload: { userId: "alice" } }]
console.log(engine.getContext()); // { currentUser: "alice" }
```

### With Constraints

```typescript
import { defineConstraint } from '@plures/praxis';

const maxSessionsConstraint = defineConstraint<AuthContext>({
  id: 'auth.maxSessions',
  description: 'Only one user can be logged in at a time',
  impl: (state) => {
    return state.context.currentUser === null || 'User already logged in';
  },
});

registry.registerConstraint(maxSessionsConstraint);
```

### Svelte 5 Integration

#### Store API (Svelte 4/5 Compatible)

```typescript
import { createPraxisStore, createDerivedStore } from '@plures/praxis/svelte';

const stateStore = createPraxisStore(engine);
const userStore = createDerivedStore(engine, (ctx) => ctx.currentUser);

// In Svelte component:
// $: currentUser = $userStore;
// <button on:click={() => stateStore.dispatch([Login.create({ username: "alice" })])}>
//   Login
// </button>
```

#### Runes API (Svelte 5 Only)

```svelte
<script lang="ts">
  import { usePraxisEngine } from '@plures/praxis/svelte';
  import { createMyEngine, Login } from './my-engine';

  const engine = createMyEngine();
  const {
    context,      // Reactive context
    dispatch,     // Dispatch events
    undo,         // Undo last action
    redo,         // Redo action
    canUndo,      // Boolean: can undo?
    canRedo,      // Boolean: can redo?
  } = usePraxisEngine(engine, {
    enableHistory: true,    // Enable undo/redo
    maxHistorySize: 50,     // Keep last 50 snapshots
  });
</script>

<div>
  <p>User: {context.currentUser || 'Guest'}</p>

  <button onclick={() => dispatch([Login.create({ username: 'alice' })])}>
    Login
  </button>

  <button onclick={undo} disabled={!canUndo}>
    ⟲ Undo
  </button>

  <button onclick={redo} disabled={!canRedo}>
    ⟳ Redo
  </button>
</div>
```

See the [Advanced Todo Example](src/examples/advanced-todo/) for a complete demo with:

- Undo/redo functionality
- Time-travel debugging
- Keyboard shortcuts
- Beautiful UI

For comprehensive guides:

- [Svelte Integration Guide](docs/guides/svelte-integration.md)
- [History State Pattern](docs/guides/history-state-pattern.md)
- [Parallel State Pattern](docs/guides/parallel-state-pattern.md)

## Core Protocol

The language-neutral core protocol forms the foundation of Praxis:

```typescript
// Facts and Events
interface PraxisFact {
  tag: string;
  payload: unknown;
}

interface PraxisEvent {
  tag: string;
  payload: unknown;
}

// State
interface PraxisState {
  context: unknown;
  facts: PraxisFact[];
  meta?: Record<string, unknown>;
}

// Step Function (the conceptual core)
type PraxisStepFn = (
  state: PraxisState,
  events: PraxisEvent[],
  config: PraxisStepConfig
) => PraxisStepResult;
```

This protocol is:

- Pure and deterministic (data in → data out)
- No side effects, no global state
- JSON-friendly for cross-language compatibility
- The foundation for all higher-level TypeScript APIs

## Framework Architecture

```
/praxis
├── core/                          # Core framework
│   ├── schema/                    # Schema system
│   │   └── types.ts              # Schema type definitions
│   ├── logic/                     # Logic engine (existing src/core/)
│   │   ├── protocol.ts           # Language-neutral protocol
│   │   ├── rules.ts              # Rules, constraints, and registry
│   │   ├── engine.ts             # LogicEngine implementation
│   │   ├── actors.ts             # Actor system
│   │   └── introspection.ts      # Introspection and visualization
│   ├── component/                 # Component generation
│   │   └── generator.ts          # Svelte component generator
│   ├── pluresdb/                  # PluresDB integration core
│   │   ├── adapter.ts            # Database adapter interface
│   │   ├── store.ts              # Reactive store implementation
│   │   ├── schema-registry.ts    # Schema registry for PluresDB
│   │   └── generator.ts          # PluresDB config generator
│   └── runtime/                   # Runtime abstractions
├── cloud/                         # Praxis Cloud integration
│   ├── auth.ts                   # GitHub OAuth authentication
│   ├── billing.ts                # Tier-based billing
│   ├── provisioning.ts           # Tenant provisioning
│   └── relay/                    # Azure relay service
├── integrations/                  # Ecosystem integrations
│   ├── pluresdb.ts               # PluresDB integration exports
│   ├── svelte.ts                 # Svelte 5 integration
│   ├── unum/                     # Unum identity and channels
│   ├── adp/                      # Architectural Decision Protocol
│   ├── state-docs/               # State-Docs documentation
│   └── canvas/                   # CodeCanvas visual editor
├── components/                    # Svelte components
│   └── TerminalNode.svelte       # Terminal node component
├── cli/                          # Command-line interface
│   ├── index.ts                  # CLI entry point
│   └── commands/                 # Command implementations
├── templates/                     # Project templates
│   ├── basic-app/                # Basic application template
│   └── fullstack-app/            # Full-stack template
├── examples/                      # Example applications
│   ├── offline-chat/             # Offline-first chat demo
│   ├── knowledge-canvas/         # Knowledge management with Canvas
│   ├── distributed-node/         # Self-orchestrating node demo
│   ├── terminal-node/            # Terminal node demo
│   ├── terminal-canvas/          # Terminal + canvas demo
│   ├── cloud-sync/               # Cloud sync demo
│   ├── github-monetization/      # GitHub monetization demo
│   ├── simple-app/               # Simple app demo
│   ├── auth-basic/               # Login/logout example
│   ├── cart/                     # Shopping cart example
│   ├── svelte-counter/           # Svelte integration example
│   └── hero-ecommerce/           # Comprehensive e-commerce demo
└── docs/                         # Framework documentation
    ├── guides/                   # User guides
    │   ├── getting-started.md   # Getting started guide
    │   ├── canvas.md            # CodeCanvas guide
    │   └── orchestration.md     # Orchestration guide
    ├── api/                      # API reference
    └── architecture/             # Architecture documentation
```

See [FRAMEWORK.md](./FRAMEWORK.md) for complete architecture documentation.

## Examples

The repository includes multiple complete examples:

### 1. Hero E-Commerce (`src/examples/hero-ecommerce`)

Comprehensive example demonstrating all Praxis features in a single application:

- Authentication with session management
- Shopping cart with discount rules
- Feature flags for A/B testing
- Loyalty program with points
- Actors for logging and analytics
- Constraints enforcing business rules

```bash
npm run build
node dist/examples/hero-ecommerce/index.js
```

### 2. Offline-First Chat (`examples/offline-chat`)

Demonstrates local-first architecture with PluresDB:

- Offline message composition and storage
- Automatic sync when connected
- Message queue for offline messages
- Conflict resolution for concurrent edits
- Real-time features (typing indicators, read receipts)

See [examples/offline-chat/README.md](./examples/offline-chat/README.md)

### 3. Knowledge Canvas (`examples/knowledge-canvas`)

Showcases CodeCanvas integration for visual knowledge management:

- Visual knowledge graph editing
- Schema-driven content types
- Generated UI components
- State-Docs integration
- Collaborative editing

See [examples/knowledge-canvas/README.md](./examples/knowledge-canvas/README.md)

### 4. Self-Orchestrating Node (`examples/distributed-node`)

Demonstrates distributed orchestration with DSC/MCP:

- Automatic node discovery
- Self-healing behavior
- State synchronization across nodes
- Health monitoring and auto-scaling
- Failover and recovery

See [examples/distributed-node/README.md](./examples/distributed-node/README.md)

### 5. Terminal Node (`examples/terminal-node`)

Demonstrates the terminal node feature for command execution:

- Terminal adapter creation and configuration
- Command execution and history tracking
- YAML schema loading with terminal nodes
- PluresDB binding configuration (ready for integration)
- Both text and widget input modes

```bash
npm run build
node examples/terminal-node/index.js
```

See [examples/terminal-node/README.md](./examples/terminal-node/README.md) and [docs/TERMINAL_NODE.md](./docs/TERMINAL_NODE.md)

### 6. Auth Basic (`src/examples/auth-basic`)

Login/logout with facts, rules, and constraints.

```bash
npm run build
node dist/examples/auth-basic/index.js
```

### 7. Cart (`src/examples/cart`)

Shopping cart with multiple rules, constraints, and complex state management.

```bash
npm run build
node dist/examples/cart/index.js
```

### 8. Svelte Counter (`src/examples/svelte-counter`)

Counter example showing Svelte v5 integration with reactive stores.

```bash
npm run build
node dist/examples/svelte-counter/index.js
```

### 9. Terminal Canvas (`examples/terminal-canvas`)

Combines terminal nodes with visual canvas features in a Svelte app.

See [examples/terminal-canvas/README.md](./examples/terminal-canvas/README.md)

### 10. GitHub Monetization (`examples/github-monetization`)

Example of GitHub-based monetization integration with Praxis Cloud.

See [examples/github-monetization/README.md](./examples/github-monetization/README.md)

### 11. Simple App (`examples/simple-app`)

A minimal example demonstrating basic Praxis schema usage.

See [examples/simple-app/README.md](./examples/simple-app/README.md)

### 12. Cloud Sync (`examples/cloud-sync`)

Demonstrates real-time synchronization with Praxis Cloud relay service.

See [examples/cloud-sync/README.md](./examples/cloud-sync/README.md)

## API Reference

### Core Types

- `PraxisFact`, `PraxisEvent`, `PraxisState` - Protocol types
- `LogicEngine<TContext>` - Main engine class
- `PraxisRegistry<TContext>` - Rule and constraint registry
- `Actor<TContext>` - Actor interface
- `ActorManager<TContext>` - Actor lifecycle management

### DSL Functions

- `defineFact<TTag, TPayload>(tag)` - Define a typed fact
- `defineEvent<TTag, TPayload>(tag)` - Define a typed event
- `defineRule<TContext>(options)` - Define a rule
- `defineConstraint<TContext>(options)` - Define a constraint
- `defineModule<TContext>(options)` - Bundle rules and constraints

### Helpers

- `findEvent(events, definition)` - Find first matching event
- `findFact(facts, definition)` - Find first matching fact
- `filterEvents(events, definition)` - Filter events by type
- `filterFacts(facts, definition)` - Filter facts by type

### Introspection & Visualization

Tools for examining and visualizing your Praxis logic:

```typescript
import { createIntrospector, PRAXIS_PROTOCOL_VERSION } from '@plures/praxis';

const introspector = createIntrospector(registry);

// Get statistics
const stats = introspector.getStats();
console.log(`Rules: ${stats.ruleCount}, Constraints: ${stats.constraintCount}`);

// Generate JSON schema
const schema = introspector.generateSchema(PRAXIS_PROTOCOL_VERSION);

// Generate graph visualization
const graph = introspector.generateGraph();

// Export to Graphviz DOT format
const dot = introspector.exportDOT();
fs.writeFileSync('registry.dot', dot);

// Export to Mermaid format
const mermaid = introspector.exportMermaid();

// Search rules and constraints
const authRules = introspector.searchRules('auth');
const maxConstraints = introspector.searchConstraints('max');
```

**Available methods:**

- `getStats()` - Get registry statistics
- `generateSchema(protocolVersion)` - Generate JSON schema
- `generateGraph()` - Generate graph representation
- `exportDOT()` - Export to Graphviz DOT format
- `exportMermaid()` - Export to Mermaid diagram format
- `getRuleInfo(id)` - Get detailed rule information
- `getConstraintInfo(id)` - Get detailed constraint information
- `searchRules(query)` - Search rules by text
- `searchConstraints(query)` - Search constraints by text

## Ecosystem Integration

Praxis integrates with the full Plures ecosystem:

### PluresDB Integration

Local-first reactive datastore for offline-capable applications. **Now fully implemented** with 32 tests covering all features.

```typescript
import {
  createInMemoryDB,
  createPraxisDBStore,
  createPluresDBAdapter,
  attachToEngine,
} from '@plures/praxis/pluresdb';

// Create an in-memory database
const db = createInMemoryDB();

// Create a PraxisDB store for facts and events
const store = createPraxisDBStore({ db });

// Or create an adapter to attach to an engine
const adapter = createPluresDBAdapter({
  db,
  registry,
  initialContext: {},
});

// Attach adapter to engine for automatic persistence
adapter.attachEngine(engine);

// Persist facts and events
await adapter.persistFacts([{ tag: 'UserLoggedIn', payload: { userId: 'alice' } }]);
await adapter.persistEvents([{ tag: 'LOGIN', payload: { username: 'alice' } }]);

// Subscribe to changes
adapter.subscribeToEvents((events) => {
  console.log('New events:', events);
});
```

**Features:**

- **In-memory adapter**: Ready-to-use implementation for development and testing
- **Reactive store**: Watch for changes with callbacks
- **Schema registry**: Store and retrieve schemas in PluresDB
- **Config generator**: Generate PluresDB configuration from Praxis schemas
- **Engine integration**: Automatic fact/event persistence

**Status**: ✅ Available (`src/core/pluresdb/`, `src/integrations/pluresdb.ts`)  
**Tests**: 32 tests covering adapter, store, registry, and engine integration

### Unum Integration

Identity and channels for distributed systems.

```typescript
import { createUnumIdentity, createChannel } from '@plures/unum';

// Create identity
const identity = await createUnumIdentity({
  name: 'my-app-node',
  keys: await generateKeys(),
});

// Create channel for messaging
const channel = await createChannel({
  name: 'app-events',
  participants: [identity.id],
});

// Integrate with Praxis actors
const unumActor = createActor('unum-bridge', identity, async (event) => {
  // Bridge Praxis events to Unum channels
  await channel.publish(event);
});
```

**Status**: Planned  
**Use Cases**: Distributed messaging, identity management, authentication

### ADP Integration

Architectural Decision Protocol for guardrails and governance.

```typescript
import { createADP } from '@plures/adp';

// Track architectural decisions from schemas
const adp = createADP({
  source: 'praxis-schema',
  decisions: [
    {
      id: 'ADR-001',
      title: 'Use PluresDB for local-first storage',
      context: 'Need offline-capable data storage',
      decision: 'Adopt PluresDB',
      consequences: ['Offline support', 'Sync complexity'],
    },
  ],
});

// Enforce guardrails
adp.enforce({
  rule: 'no-direct-database-access',
  check: (code) => !code.includes('direct-sql'),
});
```

**Status**: Planned  
**Use Cases**: Architecture documentation, compliance checking, guardrails

### State-Docs Integration

Living documentation generated from Praxis schemas.

```typescript
import { generateStateDocs } from '@plures/state-docs';

// Generate documentation from schema
const docs = await generateStateDocs({
  schema: appSchema,
  logic: logicDefinitions,
  components: componentDefinitions,
  output: './docs',
  format: 'markdown', // or 'html', 'pdf'
});

// Documentation includes:
// - Data model diagrams
// - Logic flow diagrams
// - Component catalog
// - API reference
// - Usage examples
```

**Status**: Planned  
**Documentation**: See examples for State-Docs integration patterns

### CodeCanvas Integration

Visual IDE for schema and logic editing.

```bash
# Open Canvas for visual editing
praxis canvas src/schemas/app.schema.ts

# Features:
# - Visual schema design
# - Logic flow editor
# - Component preview
# - Real-time collaboration
# - Export to code
```

**Status**: Planned  
**Documentation**: [docs/guides/canvas.md](./docs/guides/canvas.md)

### Svelte + Tauri Runtime

Cross-platform runtime for web, desktop, and mobile.

```typescript
// Svelte v5 integration (available now)
import { createPraxisStore } from '@plures/praxis/svelte';

const stateStore = createPraxisStore(engine);
const userStore = createDerivedStore(engine, (ctx) => ctx.currentUser);

// In Svelte component:
// $: currentUser = $userStore;

// Desktop app with Tauri
npm run tauri:dev    // Development
npm run tauri:build  // Production
```

**Status**: Svelte integration available, Tauri templates planned  
**Platform Support**: Web (now), Desktop (planned), Mobile (future)

## Cross-Language Usage

### PowerShell

Full PowerShell adapter for using Praxis from PowerShell scripts:

```powershell
# Import module
Import-Module ./powershell/Praxis.psm1

# Initialize adapter
Initialize-PraxisAdapter -EnginePath "./dist/adapters/cli.js"

# Create state and events
$state = New-PraxisState -Context @{ count = 0 }
$event = New-PraxisEvent -Tag "INCREMENT" -Payload @{}

# Process step
$result = Invoke-PraxisStep -State $state -Events @($event) -ConfigPath "./config.json"

# Use result
Write-Host "Count: $($result.state.context.count)"
```

See [powershell/README.md](./powershell/README.md) for complete documentation and examples.

### C# (.NET 8+)

Full C# implementation with functional, immutable design:

```csharp
using Praxis.Core;
using Praxis.Dsl;

// Define facts and events
var UserLoggedIn = PraxisDsl.DefineFact<UserPayload>("UserLoggedIn");
var Login = PraxisDsl.DefineEvent<LoginPayload>("LOGIN");

record UserPayload(string UserId);
record LoginPayload(string Username);

// Define rules
var loginRule = PraxisDsl.DefineRule<AuthContext>(
    id: "auth.login",
    description: "Process login event",
    impl: (state, context, events) =>
    {
        var loginEvent = events.FindEvent(Login);
        if (loginEvent != null)
        {
            var payload = Login.GetPayload(loginEvent);
            return [UserLoggedIn.Create(new UserPayload(payload?.Username ?? "unknown"))];
        }
        return [];
    });

// Create engine
var registry = new PraxisRegistry<AuthContext>();
registry.RegisterRule(loginRule);

var engine = PraxisEngine.Create(new PraxisEngineOptions<AuthContext>
{
    InitialContext = new AuthContext(null),
    Registry = registry
});

// Dispatch events
var result = engine.Step([Login.Create(new LoginPayload("alice"))]);
Console.WriteLine($"Facts: {result.State.Facts.Count}"); // Facts: 1
```

See [csharp/Praxis/README.md](./csharp/Praxis/README.md) for complete documentation.

## Roadmap

### Current Focus

- Full CodeCanvas integration
- Enhanced Unum identity support
- Advanced State-Docs generation
- Multi-language schema support
- Real PluresDB sync with CRDT/offline-first capabilities

### Long Term

- Mobile templates (iOS, Android)
- Enterprise features
- Advanced orchestration
- Performance optimizations
- Plugin ecosystem

## Cross-Language Support

The core protocol is implemented across multiple languages:

**TypeScript** (Primary, npm: `@plures/praxis`)

```typescript
import { createPraxisEngine, PraxisRegistry } from '@plures/praxis';

const engine = createPraxisEngine({
  initialContext: {},
  registry: new PraxisRegistry(),
});
const result = engine.step(events);
```

**C#** (.NET 8+, NuGet: `Plures.Praxis`)

```csharp
var engine = PraxisEngine.Create(new PraxisEngineOptions<TContext> { ... });
var result = engine.Step(events);
```

See [csharp/Praxis/README.md](./csharp/Praxis/README.md) for full documentation.

**PowerShell** (GitHub: `Praxis.psm1`)

```powershell
$newState = Invoke-PraxisStep -State $state -Events $events
```

See [powershell/README.md](./powershell/README.md) for full documentation.

All implementations share the same protocol version and JSON format for interoperability.
See [CROSS_LANGUAGE_SYNC.md](./CROSS_LANGUAGE_SYNC.md) for details on keeping implementations in sync.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Type check
npm run typecheck
```

### Deno Development

```bash
# Run with Deno
deno task dev

# Run tests
deno task test

# Lint and format
deno task lint
deno task fmt
```

For more detailed development information, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) to get started.

- 🐛 [Report a bug](https://github.com/plures/praxis/issues/new?template=bug_report.yml)
- 💡 [Request a feature](https://github.com/plures/praxis/issues/new?template=enhancement.yml)
- 📖 [Improve documentation](https://github.com/plures/praxis/issues/new?template=bug_report.yml)
- 🔒 [Report a security issue](./SECURITY.md)

Please review our [Code of Conduct](./CODE_OF_CONDUCT.md) before participating.

## Support

- 📚 [Documentation](./docs/)
- 💬 [GitHub Discussions](https://github.com/plures/praxis/discussions)
- 🐛 [Issue Tracker](https://github.com/plures/praxis/issues)
- 🌐 [Plures Organization](https://github.com/plures)

---

**Praxis** – Because application logic should be practical, provable, and portable.

---

Built with ❤️ by the plures team
