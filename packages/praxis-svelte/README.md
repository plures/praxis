# @plures/praxis-svelte

Svelte 5 integration for the Praxis application framework. Provides reactive components, runes-based state management, and component generators.

## Overview

`praxis-svelte` brings the power of Praxis logic engine to Svelte 5 with:

- **Reactive Engine**: Svelte runes-based state management
- **Component Generators**: Generate Svelte components from schemas
- **Runtime Integration**: Seamless integration with Svelte's reactivity system
- **Type Safety**: Full TypeScript support with Svelte 5 types

## Installation

```bash
npm install @plures/praxis-svelte svelte
```

**Note:** Svelte 5 is a peer dependency.

## Usage

### Reactive Engine with Runes

```typescript
import { createReactiveEngine } from '@plures/praxis-svelte';
import { defineRule, defineFact, defineEvent } from '@plures/praxis-core';

// Define your logic
const CounterIncremented = defineFact<'CounterIncremented', { value: number }>('CounterIncremented');
const IncrementEvent = defineEvent<'INCREMENT', {}>('INCREMENT');

const incrementRule = defineRule({
  id: 'counter.increment',
  impl: (state, events) => {
    if (events.find(IncrementEvent.is)) {
      const current = state.context.count || 0;
      state.context.count = current + 1;
      return [CounterIncremented.create({ value: current + 1 })];
    }
    return [];
  },
});

// Create reactive engine
const engine = createReactiveEngine({
  initialContext: { count: 0 },
  rules: [incrementRule],
});

// Use in Svelte component
const count = $derived(engine.context.count);

// Dispatch events
function increment() {
  engine.dispatch(IncrementEvent.create({}));
}
```

### Component Generation

Generate Svelte components from schemas:

```typescript
import { generateSvelteComponent } from '@plures/praxis-svelte';

const schema = {
  name: 'UserForm',
  fields: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'number', required: false },
  },
};

const component = await generateSvelteComponent({
  schema,
  outputPath: './src/components/UserForm.svelte',
});
```

### Using Generated Components

```svelte
<script lang="ts">
  import UserForm from './components/UserForm.svelte';
  
  let formData = $state({ name: '', email: '', age: undefined });
  
  function handleSubmit(data: typeof formData) {
    console.log('Form submitted:', data);
  }
</script>

<UserForm bind:data={formData} onSubmit={handleSubmit} />
```

### Reactive Stores (Svelte 4/5 Compatible)

For compatibility with Svelte 4:

```typescript
import { createPraxisStore } from '@plures/praxis-svelte';

const store = createPraxisStore({
  initialContext: { count: 0 },
  rules: [incrementRule],
});

// In Svelte component
$: count = $store.context.count;

// Dispatch events
store.dispatch(IncrementEvent.create({}));
```

### Advanced: Custom Components

Create custom reactive components:

```svelte
<script lang="ts">
  import { createReactiveEngine } from '@plures/praxis-svelte';
  import type { PraxisEngine } from '@plures/praxis-core';
  
  interface Props {
    engine: PraxisEngine<{ count: number }>;
  }
  
  let { engine }: Props = $props();
  
  const count = $derived(engine.context.count);
  const facts = $derived(engine.getFacts());
  
  function increment() {
    engine.step([IncrementEvent.create({})]);
  }
</script>

<div>
  <p>Count: {count}</p>
  <button onclick={increment}>Increment</button>
  <p>Facts: {facts.length}</p>
</div>
```

## API Reference

### `createReactiveEngine(config)`

Create a reactive Praxis engine with Svelte runes.

**Parameters:**
- `config.initialContext`: Initial context state
- `config.rules`: Array of rules to register
- `config.constraints`: Array of constraints to register

**Returns:** `ReactiveEngine` - A Praxis engine with reactive state

### `createPraxisStore(config)`

Create a Svelte store-based Praxis engine (Svelte 4/5 compatible).

**Parameters:**
- `config.initialContext`: Initial context state
- `config.rules`: Array of rules to register
- `config.constraints`: Array of constraints to register

**Returns:** `Writable<PraxisEngine>` - A Svelte writable store

### `generateSvelteComponent(config)`

Generate a Svelte component from a schema.

**Parameters:**
- `config.schema`: Schema definition
- `config.outputPath`: Output file path
- `config.options`: Generation options

**Returns:** `Promise<string>` - Generated component code

### Components

#### `TerminalNode.svelte`

A terminal/command-line component for executing commands.

```svelte
<script>
  import { TerminalNode } from '@plures/praxis-svelte/components';
</script>

<TerminalNode
  adapter={terminalAdapter}
  onCommand={handleCommand}
/>
```

## Examples

### Counter Example

```svelte
<script lang="ts">
  import { createReactiveEngine } from '@plures/praxis-svelte';
  import { defineRule, defineFact, defineEvent } from '@plures/praxis-core';
  
  const Incremented = defineFact<'Incremented', { value: number }>('Incremented');
  const Increment = defineEvent<'INCREMENT', {}>('INCREMENT');
  const Reset = defineEvent<'RESET', {}>('RESET');
  
  const rules = [
    defineRule({
      id: 'increment',
      impl: (state, events) => {
        if (events.find(Increment.is)) {
          const value = (state.context.count || 0) + 1;
          state.context.count = value;
          return [Incremented.create({ value })];
        }
        return [];
      },
    }),
    defineRule({
      id: 'reset',
      impl: (state, events) => {
        if (events.find(Reset.is)) {
          state.context.count = 0;
        }
        return [];
      },
    }),
  ];
  
  const engine = createReactiveEngine({
    initialContext: { count: 0 },
    rules,
  });
  
  const count = $derived(engine.context.count);
  
  function increment() {
    engine.step([Increment.create({})]);
  }
  
  function reset() {
    engine.step([Reset.create({})]);
  }
</script>

<div>
  <h1>Count: {count}</h1>
  <button onclick={increment}>Increment</button>
  <button onclick={reset}>Reset</button>
</div>
```

### Form Builder Example

See [examples/form-builder](../../examples/form-builder) for a complete example.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Watch mode
npm run test:watch
```

## License

MIT - See [LICENSE](../../LICENSE) for details

## Related Packages

- `@plures/praxis-core`: Core logic library
- `@plures/praxis`: Main package (re-exports from all packages)
- `@plures/praxis-cli`: Command-line interface
- `@plures/praxis-cloud`: Cloud sync and relay

## Links

- [Main Documentation](../../docs/README.md)
- [Svelte Integration Guide](../../docs/guides/svelte-integration.md)
- [Getting Started](../../docs/guides/getting-started.md)
