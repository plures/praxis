# Praxis

[![CI](https://github.com/plures/praxis/workflows/CI/badge.svg)](https://github.com/plures/praxis/actions/workflows/ci.yml)
[![CodeQL](https://github.com/plures/praxis/workflows/CodeQL/badge.svg)](https://github.com/plures/praxis/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/@plures/praxis.svg)](https://www.npmjs.com/package/@plures/praxis)
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

### Project Status

| Category | Status |
|----------|--------|
| **CI/CD** | ✅ Automated testing & builds |
| **Version** | 0.1.0 (Alpha) |
| **Runtime Support** | Node.js 18+, Deno (experimental) |
| **Package Registries** | npm ✅ / JSR 🚧 (coming soon) |
| **Test Coverage** | 63 tests passing |
| **Documentation** | 📚 In Progress |

### Integration Status

| Integration | Status | Notes |
|------------|--------|-------|
| **Praxis Cloud** | ✅ Available | Azure-hosted relay for sync & monetization |
| **PluresDB** | 🚧 In Development | Local-first reactive datastore |
| **Unum** | 🚧 Planned | Identity & channels |
| **Svelte** | ✅ Supported | Component generation |
| **Tauri** | 🚧 Planned | Cross-platform runtime |
| **CodeCanvas** | 🚧 Planned | Visual schema editor |
| **State-Docs** | 🚧 Planned | Documentation generation |

---

## Overview

Praxis is not just a logic engine—it's a **complete framework** for building modern, local-first, distributed applications. It provides:

- **Declarative Schemas**: Define your data models, logic, and components in a unified schema format
- **Logic/State Machines**: Pure, functional application logic with facts, events, rules, and constraints
- **Component Generation**: Automatically generate Svelte components from schemas
- **Local-First Data**: Integrated PluresDB for reactive, offline-capable data storage
- **Documentation Generation**: Automatic State-Docs generation from your schemas
- **Visual Design**: CodeCanvas integration for visual schema and logic editing
- **Orchestration**: DSC/MCP support for distributed system coordination
- **Cross-Platform Runtime**: Web, desktop, and mobile via Svelte + Tauri

### Framework Philosophy

### Core Framework Components

Praxis provides these integrated capabilities:

- **Schema System** – Declarative definitions that generate models, components, and documentation
- **Logic Engine** – Typed facts, events, rules, and constraints for application logic
- **Component Factory** – Generate Svelte components from schemas with data bindings
- **Data Layer** – PluresDB integration for reactive, local-first data storage
- **State Machines** – Flows and scenarios for orchestrated behaviors
- **Actors** – Effectful units for side effects and external system integration
- **Documentation** – Automatic State-Docs generation from schemas and logic
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
- **Svelte + Tauri**: Cross-platform runtime (web/desktop/mobile)

## Logic Engine Features

- 🎯 **Logic-First Design**: Build applications around facts, events, rules, and constraints
- 🔄 **Pure Functional Core**: State transitions via pure `step` functions
- 📝 **Fluent DSL**: Intuitive API for defining rules and constraints
- 🗂️ **Registry System**: Centralized management of rules and constraints
- 🌊 **Flows & Actors**: Orchestrate complex state transitions
- 📦 **JSON-Friendly**: All types are serializable for cross-platform use
- 🔒 **Type-Safe**: Full TypeScript support with strict typing
- 🔍 **Introspection**: Generate schemas, graphs, and visualizations of your logic
- 🌐 **Cross-Language**: PowerShell adapter with protocol versioning (C# coming soon)
- 📊 **Comprehensive Testing**: 63+ tests covering edge cases, failures, and actors
- 🎭 **Hero Example**: Full e-commerce demo with auth, cart, features, and actors

## What's New in v0.1.0

### 🧪 Hardened TypeScript Core
- **63 comprehensive tests** (up from 18) covering:
  - Edge cases and failure paths
  - Actor lifecycle and state change notifications
  - Constraint violations and rule errors
  - Registry operations and module composition
- Full test coverage ensures production-ready reliability

### 📖 Protocol Versioning (v1.0.0)
- **Explicit protocol version** (`protocolVersion` field in state)
- **Stability guarantees** for cross-language compatibility
- **Semantic versioning** with migration paths
- See [PROTOCOL_VERSIONING.md](./PROTOCOL_VERSIONING.md) for details

### 🔍 Visualization & Introspection
- **Registry introspection API** for examining rules and constraints
- **Graph export** in DOT (Graphviz) and Mermaid formats
- **JSON schema generation** for documentation and tooling
- **Search and query** capabilities for rules and constraints
- **Dependency tracking** and relationship visualization

### 💻 PowerShell Adapter
- **Full PowerShell module** (`Praxis.psm1`) for cross-language usage
- **CLI boundary** via JSON stdin/stdout
- **Protocol version checking** ensures compatibility
- **Complete example** with counter application
- See [powershell/README.md](./powershell/README.md) for usage

### 🎭 Hero Example: E-Commerce Platform
A comprehensive example demonstrating all Praxis features:
- **Authentication** with session management and timeouts
- **Shopping cart** with item management and calculations
- **Feature flags** for A/B testing (free shipping, loyalty program)
- **Discount rules** with conditional logic
- **Loyalty points** and order history
- **Actors** for logging and analytics
- **Constraints** enforcing business rules
- See [src/examples/hero-ecommerce/](./src/examples/hero-ecommerce/) for code

## Installation

### npm (Node.js)

```bash
npm install @plures/praxis
```

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
    "@plures/praxis": "npm:@plures/praxis@^0.1.0"
  }
}
```

### From Source

```bash
# Clone the repository
git clone https://github.com/plures/praxis.git
cd praxis

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
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

### Praxis Cloud (NEW!)

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
} from "@plures/praxis";

// Define the context type
interface AuthContext {
  currentUser: string | null;
}

// Define facts and events
const UserLoggedIn = defineFact<"UserLoggedIn", { userId: string }>("UserLoggedIn");
const Login = defineEvent<"LOGIN", { username: string }>("LOGIN");

// Define rules
const loginRule = defineRule<AuthContext>({
  id: "auth.login",
  description: "Process login event",
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
const result = engine.step([Login.create({ username: "alice" })]);
console.log(result.state.facts); // [{ tag: "UserLoggedIn", payload: { userId: "alice" } }]
console.log(engine.getContext()); // { currentUser: "alice" }
```

### With Constraints

```typescript
import { defineConstraint } from "@plures/praxis";

const maxSessionsConstraint = defineConstraint<AuthContext>({
  id: "auth.maxSessions",
  description: "Only one user can be logged in at a time",
  impl: (state) => {
    return state.context.currentUser === null || "User already logged in";
  },
});

registry.registerConstraint(maxSessionsConstraint);
```

### Svelte v5 Integration

```typescript
import { createPraxisStore, createDerivedStore } from "@plures/praxis/svelte";

const stateStore = createPraxisStore(engine);
const userStore = createDerivedStore(engine, (ctx) => ctx.currentUser);

// In Svelte component:
// $: currentUser = $userStore;
// <button on:click={() => stateStore.dispatch([Login.create({ username: "alice" })])}>
//   Login
// </button>
```

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
│   └── runtime/                   # Runtime abstractions
├── integrations/                  # Ecosystem integrations
│   ├── pluresdb/                 # PluresDB reactive datastore
│   ├── unum/                     # Unum identity and channels
│   ├── adp/                      # Architectural Decision Protocol
│   ├── state-docs/               # State-Docs documentation
│   └── canvas/                   # CodeCanvas visual editor
├── cli/                          # Command-line interface
│   ├── index.ts                  # CLI entry point
│   └── commands/                 # Command implementations
├── templates/                     # Project templates
│   ├── basic-app/                # Basic application template
│   ├── fullstack-app/            # Full-stack template
│   ├── component/                # Component template
│   └── orchestrator/             # Distributed orchestration template
├── examples/                      # Example applications
│   ├── offline-chat/             # Offline-first chat demo
│   ├── knowledge-canvas/         # Knowledge management with Canvas
│   ├── distributed-node/         # Self-orchestrating node demo
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

The repository includes four complete examples:

### 1. Hero E-Commerce (`src/examples/hero-ecommerce`)
**NEW!** Comprehensive example demonstrating all Praxis features in a single application:
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
**NEW!** Demonstrates local-first architecture with PluresDB:
- Offline message composition and storage
- Automatic sync when connected
- Message queue for offline messages
- Conflict resolution for concurrent edits
- Real-time features (typing indicators, read receipts)

See [examples/offline-chat/README.md](./examples/offline-chat/README.md)

### 3. Knowledge Canvas (`examples/knowledge-canvas`)
**NEW!** Showcases CodeCanvas integration for visual knowledge management:
- Visual knowledge graph editing
- Schema-driven content types
- Generated UI components
- State-Docs integration
- Collaborative editing

See [examples/knowledge-canvas/README.md](./examples/knowledge-canvas/README.md)

### 4. Self-Orchestrating Node (`examples/distributed-node`)
**NEW!** Demonstrates distributed orchestration with DSC/MCP:
- Automatic node discovery
- Self-healing behavior
- State synchronization across nodes
- Health monitoring and auto-scaling
- Failover and recovery

See [examples/distributed-node/README.md](./examples/distributed-node/README.md)

### 5. Auth Basic (`src/examples/auth-basic`)
Login/logout with facts, rules, and constraints.

```bash
npm run build
node dist/examples/auth-basic/index.js
```

### 6. Cart (`src/examples/cart`)
Shopping cart with multiple rules, constraints, and complex state management.

```bash
npm run build
node dist/examples/cart/index.js
```

### 7. Svelte Counter (`src/examples/svelte-counter`)
Counter example showing Svelte v5 integration with reactive stores.

```bash
npm run build
node dist/examples/svelte-counter/index.js
```

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

**NEW!** Tools for examining and visualizing your Praxis logic:

```typescript
import { createIntrospector, PRAXIS_PROTOCOL_VERSION } from "@plures/praxis";

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

Local-first reactive datastore for offline-capable applications.

```typescript
import { createPluresDB } from '@plures/pluresdb';

// Create database from schema
const db = createPluresDB({
  name: 'my-app',
  version: 1,
  stores: {
    // Generated from Praxis schema
    users: { keyPath: 'id', indexes: ['email'] },
    tasks: { keyPath: 'id', indexes: ['status', 'createdAt'] },
  },
  sync: {
    enabled: true,
    endpoint: 'ws://localhost:8080/sync',
    conflictResolution: 'last-write-wins',
  },
});

// Use with Praxis logic engine
engine.step([TaskCreated.create({ taskId, title })]);
await db.tasks.add({ id: taskId, title, status: 'pending' });
```

**Status**: Foundation in place (`src/integrations/pluresdb.ts`)  
**Documentation**: [docs/guides/pluresdb.md](./docs/guides/pluresdb.md)

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

**NEW!** Full PowerShell adapter for using Praxis from PowerShell scripts:

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

### C# (Coming Soon)

Cross-language adapter for C# is planned with similar JSON-based protocol.

## Future Roadmap

### Short Term (v0.2.0)
- Complete CLI implementation
- Basic project templates
- Component generation MVP
- Enhanced PluresDB integration

### Medium Term (v0.3.0 - v0.5.0)
- Full CodeCanvas integration
- Unum identity support
- State-Docs generation
- Multi-language schemas
- C# adapter

### Long Term (v1.0.0+)
- Mobile templates (iOS, Android)
- Enterprise features
- Advanced orchestration
- Performance optimizations
- Plugin ecosystem

## Future Directions

### Ecosystem Integration

- **Svelte v5**: Full reactive binding support (foundation in place)
- **pluresdb**: Reactive datastore integration, event sourcing
- **unum**: Identity/channels and messaging
- **Visualization**: VSCode extension, docs generator, canvas tools (introspection API ready)
- **ADP**: Architectural guardrails and static checks

### Cross-Language Support

The core protocol is designed to be implemented in other languages:

**C# (future)**:
```csharp
PraxisState Step(PraxisState state, IEnumerable<PraxisEvent> events);
```

**PowerShell (future)**:
```powershell
$newState = Invoke-PraxisStep -State $state -Events $events
```

### Advanced Features

- Prolog/CLP-inspired features (facts, rules, declarative constraints, goal-style interactions)
- Backtracking/search over state space
- Property-based testing support
- Automatic documentation generation
- Static analysis tools
```typescript
import {
  createRegistry,
  createStepFunction,
  rule,
  constraint,
  type PraxisState,
  type PraxisEvent,
} from '@plures/praxis';

// Define your state
interface AppState extends PraxisState {
  facts: {
    count: number;
    lastAction?: string;
  };
}

// Create a registry
const registry = createRegistry<AppState, PraxisEvent>();

// Define rules using the DSL
const incrementRule = rule<AppState, PraxisEvent>()
  .id('increment')
  .describe('Increment counter when increment event occurs')
  .on('INCREMENT')
  .when((state, event) => true)
  .then((state, event) => [{
    type: 'LOG',
    payload: { message: 'Counter incremented' }
  }])
  .build();

// Define constraints
const positiveCountConstraint = constraint<AppState>()
  .id('positive-count')
  .describe('Count must be non-negative')
  .check((state) => state.facts.count >= 0)
  .message('Count cannot be negative')
  .build();

// Register rules and constraints
registry.registerRule(incrementRule);
registry.registerConstraint(positiveCountConstraint);

// Create a step function with custom reducer
const step = createStepFunction<AppState, PraxisEvent>({
  registry,
  checkConstraints: true,
  reducer: (state, event) => {
    if (event.type === 'INCREMENT') {
      return {
        ...state,
        facts: {
          ...state.facts,
          count: state.facts.count + 1,
          lastAction: 'increment',
        },
      };
    }
    return state;
  },
});

// Use the step function
const initialState: AppState = {
  facts: { count: 0 },
};

const event: PraxisEvent = {
  type: 'INCREMENT',
  timestamp: Date.now(),
};

const result = step(initialState, event);
console.log(result.state.facts.count); // 1
console.log(result.effects); // [{ type: 'LOG', payload: { message: 'Counter incremented' } }]
```

## Core Concepts

### State and Events

**PraxisState** represents the current facts and context:

```typescript
interface PraxisState {
  facts: Record<string, unknown>;
  metadata?: {
    version?: number;
    lastUpdated?: number;
    [key: string]: unknown;
  };
}
```

**PraxisEvent** represents things that have happened:

```typescript
interface PraxisEvent {
  type: string;
  timestamp: number;
  data?: Record<string, unknown>;
  metadata?: {
    correlationId?: string;
    source?: string;
    [key: string]: unknown;
  };
}
```

### Rules

Rules are condition-action pairs that fire when conditions are met:

```typescript
const myRule = rule<MyState, MyEvent>()
  .id('my-rule')
  .describe('What this rule does')
  .priority(10) // Higher priority rules execute first
  .on('EVENT_TYPE') // Optional: only check for specific event types
  .when((state, event) => {
    // Condition: return true to fire the rule
    return state.facts.someValue > 10;
  })
  .then((state, event) => {
    // Action: return effects to execute
    return [
      { type: 'SEND_EMAIL', payload: { to: 'user@example.com' } },
      { type: 'LOG', payload: { level: 'info', message: 'Rule fired' } },
    ];
  })
  .build();
```

### Constraints

Constraints are invariants that must hold true:

```typescript
const myConstraint = constraint<MyState>()
  .id('my-constraint')
  .describe('What this constraint ensures')
  .check((state) => {
    // Return true if constraint is satisfied
    return state.facts.balance >= 0;
  })
  .message('Balance cannot be negative')
  .build();
```

### Registry

The registry manages rules and constraints:

```typescript
const registry = createRegistry<MyState, MyEvent>();

// Register rules and constraints
registry.registerRule(myRule);
registry.registerConstraint(myConstraint);

// Evaluate rules for a state transition
const effects = registry.evaluateRules(state, event);

// Check constraints
const violations = registry.checkConstraints(state);

// Get statistics
const stats = registry.getStats();
```

### Step Functions

Step functions are pure functions that transition state:

```typescript
// With registry integration
const step = createStepFunction({
  registry,
  checkConstraints: true,
  reducer: (state, event) => {
    // Your state transition logic
    return newState;
  },
});

// Simple step without registry
const simpleStep = step((state, event) => {
  // Direct state transformation
  return { ...state, facts: { ...state.facts, updated: true } };
});

// Compose multiple step functions
const composedStep = compose(step1, step2, step3);
```

### Actors

Actors maintain their own state and respond to events:

```typescript
import { createActor, createActorSystem } from '@plures/praxis';

// Create an actor
const myActor = createActor(
  'actor-1',
  initialState,
  stepFunction,
  'counter-actor'
);

// Create an actor system
const system = createActorSystem();
system.register(myActor);

// Send events to actors
const result = system.send('actor-1', event);

// Broadcast to all actors
const results = system.broadcast(event);
```

### Flows

Flows represent sequences of events:

```typescript
import { createFlow, advanceFlow } from '@plures/praxis';

// Define a flow
const flow = createFlow('onboarding-flow', [
  { id: 'step1', expectedEventType: 'USER_REGISTERED' },
  { id: 'step2', expectedEventType: 'EMAIL_VERIFIED' },
  { id: 'step3', expectedEventType: 'PROFILE_COMPLETED' },
]);

// Advance the flow with events
const { flow: updatedFlow, accepted } = advanceFlow(flow, event);

if (updatedFlow.complete) {
  console.log('Flow completed!');
}
```

## Architecture Principles

1. **Pure Functions**: State transitions are pure, predictable, and testable
2. **JSON-Friendly**: All data structures serialize to JSON for interoperability
3. **Logic-First**: Focus on business logic, not implementation details
4. **Composable**: Build complex behavior from simple, reusable pieces
5. **Type-Safe**: Leverage TypeScript for compile-time guarantees

## Advanced Usage

### Custom Event Types

```typescript
interface UserEvent extends PraxisEvent {
  type: 'USER_LOGIN' | 'USER_LOGOUT';
  data: {
    userId: string;
    sessionId: string;
  };
}

const registry = createRegistry<AppState, UserEvent>();
```

### Effect Handlers

Effects are side-effect descriptions that can be executed outside the pure core:

```typescript
async function executeEffects(effects: Effect[]) {
  for (const effect of effects) {
    switch (effect.type) {
      case 'SEND_EMAIL':
        await emailService.send(effect.payload);
        break;
      case 'LOG':
        console.log(effect.payload);
        break;
      // Add more effect handlers as needed
    }
  }
}

const result = step(state, event);
if (result.effects) {
  await executeEffects(result.effects);
}
```

## Future Roadmap

- 🌐 **Svelte v5 Integration**: First-class support for Svelte 5 runes
- 🗄️ **pluresdb/unum Integration**: Persistent state management
- 🔄 **C# Port**: Cross-platform compatibility
- ⚡ **PowerShell Module**: Scripting and automation support
- 🎭 **Advanced FSM Tools**: Internal state machine utilities
- 📊 **Visualization**: Flow and state visualization tools

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
