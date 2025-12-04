# Simple Todo App Example

This example demonstrates the Praxis "Golden Path" from schema to working application.

## Overview

This is a minimal but complete Praxis application showing:

- Schema-driven development
- Logic module generation
- Component generation
- PluresDB configuration

## Project Structure

```
simple-app/
├── praxis.schema.js         # Schema definition
├── generated/               # Generated code
│   ├── logic/              # Logic module
│   │   ├── facts.ts        # Fact definitions
│   │   ├── events.ts       # Event definitions
│   │   ├── rules.ts        # Rule definitions
│   │   ├── engine.ts       # Engine setup
│   │   └── index.ts        # Exports
│   ├── components/         # Svelte components
│   │   ├── TodoForm.svelte
│   │   ├── TodoList.svelte
│   │   ├── TodoItem.svelte
│   │   └── ... (types & docs)
│   └── pluresdb-config.ts  # Database config
└── README.md
```

## Getting Started

### 1. Generate Code

From the repository root:

```bash
cd examples/simple-app
node ../../dist/cli/index.js generate --schema praxis.schema.js
```

This generates:

- **Logic module** with facts, events, rules, and engine
- **Svelte components** for forms, lists, and displays
- **PluresDB configuration** for local-first data storage

### 2. Review Generated Code

Check out the generated files:

```bash
# Logic files
cat generated/logic/facts.ts
cat generated/logic/events.ts
cat generated/logic/engine.ts

# Components
cat generated/components/TodoForm.svelte
cat generated/components/TodoList.svelte

# Database config
cat generated/pluresdb-config.ts
```

### 3. Integrate Into Your App

The generated code can be integrated into a Svelte application:

```typescript
// In your main app
import { createEngine } from './generated/logic/engine.js';
import { CREATE_TODO, COMPLETE_TODO } from './generated/logic/events.js';
import { initDB } from './generated/pluresdb-config.js';

// Initialize logic engine
const engine = createEngine();

// Initialize database (when PluresDB is available)
const db = initDB();

// Dispatch events
const result = engine.step([
  CREATE_TODO.create({
    title: 'Learn Praxis',
    description: 'Complete the tutorial',
  }),
]);

console.log('State:', engine.getContext());
```

## Schema Details

The `praxis.schema.js` file defines:

- **Models**: Data structures (Todo)
- **Components**: UI components (TodoForm, TodoList, TodoItem)
- **Logic**: Events, facts, and rules for todo management

## Features Demonstrated

✅ **Schema-Driven Development**

- Single source of truth
- Type-safe code generation
- Automatic documentation

✅ **Logic Engine**

- Event-driven architecture
- Pure function state management
- Rule-based logic

✅ **Component Generation**

- Svelte components from schema
- Automatic data binding
- TypeScript types included

✅ **Local-First Data**

- PluresDB configuration
- Offline-capable by design
- Sync ready

## Next Steps

1. **Customize Logic**: Edit generated rules in `generated/logic/rules.ts`
2. **Style Components**: Add CSS to generated Svelte components
3. **Add Features**: Extend the schema with more models and logic
4. **Build UI**: Create a Svelte app using the generated components

## Learn More

- [Praxis Documentation](../../docs/guides/getting-started.md)
- [Schema Reference](../../docs/api/schema.md)
- [Component Generation](../../docs/api/components.md)
- [Logic Engine](../../docs/api/logic.md)
