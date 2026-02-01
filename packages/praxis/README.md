# @plures/praxis

**The Full Plures Application Framework** - Unified package with declarative schemas, logic engine, component generation, and local-first data.

> **Note:** This is the main package that re-exports functionality from all Praxis sub-packages for convenience. For smaller bundle sizes, you can import directly from individual packages.

## Overview

Praxis is a complete framework for building logic-driven applications with:

- **Logic Engine** (`@plures/praxis-core`): Facts, events, rules, and constraints
- **Svelte Integration** (`@plures/praxis-svelte`): Reactive components and UI generation
- **CLI Tools** (`@plures/praxis-cli`): Scaffolding and code generation
- **Cloud Sync** (`@plures/praxis-cloud`): Distributed state and collaboration

## Installation

```bash
npm install @plures/praxis
```

For Deno:
```bash
deno add @plures/praxis
```

## Quick Start

```typescript
import {
  createPraxisEngine,
  defineFact,
  defineEvent,
  defineRule,
} from '@plures/praxis';

// Define facts and events
const UserLoggedIn = defineFact<'UserLoggedIn', { userId: string }>('UserLoggedIn');
const LoginEvent = defineEvent<'LOGIN', { username: string }>('LOGIN');

// Define rules
const loginRule = defineRule({
  id: 'auth.login',
  description: 'Process login events',
  impl: (state, events) => {
    const evt = events.find(LoginEvent.is);
    if (!evt) return [];
    return [UserLoggedIn.create({ userId: evt.payload.username })];
  },
});

// Create and use engine
const engine = createPraxisEngine({
  initialContext: {},
  rules: [loginRule],
});

engine.step([LoginEvent.create({ username: 'alice' })]);
```

## Package Exports

This package provides convenient access to all Praxis functionality:

### Core Logic (`@plures/praxis-core`)

```typescript
import {
  createPraxisEngine,
  PraxisRegistry,
  defineFact,
  defineEvent,
  defineRule,
  defineConstraint,
  defineContract,
} from '@plures/praxis';
```

Or import directly:
```typescript
import { createPraxisEngine } from '@plures/praxis-core';
```

### Svelte Integration (`@plures/praxis-svelte`)

```typescript
import {
  createReactiveEngine,
  createPraxisStore,
  generateSvelteComponent,
} from '@plures/praxis/svelte';
```

Or import directly:
```typescript
import { createReactiveEngine } from '@plures/praxis-svelte';
```

### CLI Tools (`@plures/praxis-cli`)

```typescript
import {
  scaffold,
  generate,
  validate,
} from '@plures/praxis/cli';
```

Or import directly:
```typescript
import { scaffold } from '@plures/praxis-cli';
```

### Cloud Sync (`@plures/praxis-cloud`)

```typescript
import {
  createCloudRelay,
  createSyncClient,
  createDistributedEngine,
} from '@plures/praxis/cloud';
```

Or import directly:
```typescript
import { createCloudRelay } from '@plures/praxis-cloud';
```

## When to Use This Package

### ✅ Use `@plures/praxis` when:

- You want all Praxis features in one package
- You're building a complete application
- Bundle size is not a critical concern
- You prefer convenient unified imports

### 🎯 Use individual packages when:

- You only need specific functionality
- Bundle size optimization is important
- You're building a library that uses Praxis
- You want to minimize dependencies

## Examples

### Full Application Example

```typescript
import {
  createPraxisEngine,
  defineRule,
  createReactiveEngine,
  createCloudRelay,
} from '@plures/praxis';

// 1. Define your logic
const rules = [/* your rules */];

// 2. Create reactive engine for Svelte
const engine = createReactiveEngine({
  initialContext: {},
  rules,
});

// 3. Optional: Enable cloud sync
const relay = await createCloudRelay({
  port: 3000,
});
```

### Component Generation

```typescript
import { generateSvelteComponent } from '@plures/praxis/svelte';

const component = await generateSvelteComponent({
  schema: mySchema,
  outputPath: './src/components/MyComponent.svelte',
});
```

### CLI Usage

```bash
# Use the Praxis CLI
npx @plures/praxis init my-app
npx @plures/praxis generate component User
npx @plures/praxis validate
```

## Documentation

- [Getting Started](../../docs/guides/getting-started.md)
- [Logic Engine](../../docs/core/logic-engine.md)
- [Svelte Integration](../../docs/guides/svelte-integration.md)
- [Cloud Sync](../../docs/guides/cloud-sync.md)
- [CLI Usage](../../docs/core/cli-usage.md)

## Monorepo Structure

Praxis is organized as a monorepo. See [MONOREPO.md](../../MONOREPO.md) for details on the repository organization.

## Migration Guide

If you're upgrading from an older version, see [MIGRATION_GUIDE.md](../../MIGRATION_GUIDE.md).

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

## License

MIT - See [LICENSE](../../LICENSE) for details

## Sub-Packages

This package includes and re-exports from:

- **[@plures/praxis-core](../praxis-core/README.md)**: Core logic library
- **[@plures/praxis-cli](../praxis-cli/README.md)**: Command-line interface
- **[@plures/praxis-svelte](../praxis-svelte/README.md)**: Svelte 5 integration
- **[@plures/praxis-cloud](../praxis-cloud/README.md)**: Cloud sync and relay

## Links

- [NPM Package](https://www.npmjs.com/package/@plures/praxis)
- [JSR Package](https://jsr.io/@plures/praxis)
- [GitHub Repository](https://github.com/plures/praxis)
- [Documentation](../../docs/README.md)
- [Issue Tracker](https://github.com/plures/praxis/issues)
