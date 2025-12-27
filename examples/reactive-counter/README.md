# Framework-Agnostic Reactive Counter Example

This example demonstrates the **framework-agnostic reactive engine** in Praxis. It shows how to use reactivity without Svelte, in a pure JavaScript/TypeScript environment.

## Features Demonstrated

1. **Proxy-based Reactivity**: Automatic change detection using JavaScript Proxies
2. **Derived/Computed Values**: Create values that automatically update when dependencies change
3. **Subscription Management**: Subscribe to state changes with automatic cleanup
4. **Batched Mutations**: Multiple changes in a single `apply()` call trigger only one notification
5. **Nested Object Tracking**: Track changes in nested objects and arrays

## Running the Example

```bash
# From the praxis root directory
npm run build
node dist/examples/reactive-counter/index.js
```

## Key Concepts

### Creating a Reactive Engine

```typescript
import { createFrameworkAgnosticReactiveEngine } from '@plures/praxis';

const engine = createFrameworkAgnosticReactiveEngine({
  initialContext: {
    count: 0,
    history: [0],
    lastAction: 'Initial',
  },
});
```

### Subscribing to State Changes

```typescript
// Subscribe to all state changes
engine.subscribe((state) => {
  console.log('State changed:', state.context);
});

// Creates an unsubscribe function
const unsubscribe = engine.subscribe((state) => {
  console.log('Count:', state.context.count);
});

// Later...
unsubscribe();
```

### Creating Derived Values

```typescript
// Derived values automatically recompute when dependencies change
const doubled = engine.$derived((state) => state.context.count * 2);

// Subscribe to derived value changes
doubled.subscribe((value) => {
  console.log('Doubled:', value);
});
```

### Applying Mutations

```typescript
// All mutations within apply() are batched
// Notifications happen only once, after all changes are complete
engine.apply((state) => {
  state.context.count += 5;
  state.context.history.push(state.context.count);
  state.context.lastAction = 'Incremented by 5';
});
```

### Nested Object Reactivity

```typescript
// Changes to nested objects and arrays are tracked automatically
engine.apply((state) => {
  // Array mutations are reactive
  state.context.history.push(10);
  state.context.history.push(20);
  
  // Object property changes are reactive
  state.context.lastAction = 'Updated';
});
```

## Comparison with Svelte Integration

### Framework-Agnostic (This Example)

```typescript
import { createFrameworkAgnosticReactiveEngine } from '@plures/praxis';

const engine = createFrameworkAgnosticReactiveEngine({
  initialContext: { count: 0 }
});

// Manual subscription
engine.subscribe((state) => {
  console.log('Count:', state.context.count);
});

// Derived values with subscription
const doubled = engine.$derived((state) => state.context.count * 2);
doubled.subscribe((value) => console.log(value));
```

### Svelte Integration

```svelte
<script lang="ts">
  import { createReactiveEngine } from '@plures/praxis/svelte';
  
  const engine = createReactiveEngine({
    initialContext: { count: 0 },
    registry
  });
  
  // Svelte automatically tracks reactivity
  const doubled = $derived(engine.context.count * 2);
</script>

<p>Count: {engine.context.count}</p>
<p>Doubled: {doubled}</p>
```

## Use Cases

The framework-agnostic reactive engine is perfect for:

- **Node.js applications** that need reactive state management
- **CLI tools** with interactive state
- **Testing** reactive logic without a UI framework
- **Backend services** with reactive data flows
- **Non-Svelte frontends** (React, Vue, Angular, etc.) that want Praxis logic
- **Universal/isomorphic code** that runs in both browser and Node.js

## Expected Output

When you run this example, you'll see:

```
=== Framework-Agnostic Reactive Counter Example ===

State changed: { count: 0, lastAction: 'Initial', facts: 0 }
  → Count: 0
  → History: [0]
  → Status: zero (Initial)

--- Increment by 5 ---
State changed: { count: 5, lastAction: 'Incremented by 5', facts: 0 }
  → Count: 5
  → History: [0, 5]
  → Status: positive (Incremented by 5)

--- Increment by 3 ---
State changed: { count: 8, lastAction: 'Incremented by 3', facts: 0 }
  → Count: 8
  → History: [0, 5, 8]
  → Status: positive (Incremented by 3)

...
```

## Learn More

- See the [main README](../../README.md) for more about Praxis
- Check out [Svelte integration](../../docs/guides/svelte-integration.md) for frontend usage
- Explore [reactive engine tests](../../src/__tests__/reactive-engine.test.ts) for more examples
