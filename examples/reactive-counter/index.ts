/**
 * Example: Framework-Agnostic Reactive Counter
 * 
 * This example demonstrates using the Praxis reactive engine
 * without Svelte, in a pure JavaScript/TypeScript environment.
 */

import {
  createFrameworkAgnosticReactiveEngine,
  defineFact,
  defineEvent,
  defineRule,
  PraxisRegistry,
  findEvent,
} from '@plures/praxis';

// ============================================================================
// 1. Define the domain types
// ============================================================================

interface CounterContext {
  count: number;
  history: number[];
  lastAction: string;
}

const CountIncremented = defineFact<'CountIncremented', { amount: number }>('CountIncremented');
const CountDecremented = defineFact<'CountDecremented', { amount: number }>('CountDecremented');

const Increment = defineEvent<'INCREMENT', { amount?: number }>('INCREMENT');
const Decrement = defineEvent<'DECREMENT', { amount?: number }>('DECREMENT');
const Reset = defineEvent<'RESET', {}>('RESET');

// ============================================================================
// 2. Define the rules
// ============================================================================

const registry = new PraxisRegistry<CounterContext>();

registry.registerRule(
  defineRule<CounterContext>({
    id: 'counter.increment',
    description: 'Increment the counter',
    impl: (state, events) => {
      const event = findEvent(events, Increment);
      if (!event) return [];

      const amount = event.payload.amount ?? 1;
      state.context.count += amount;
      state.context.history.push(state.context.count);
      state.context.lastAction = `Incremented by ${amount}`;

      return [CountIncremented.create({ amount })];
    },
  })
);

registry.registerRule(
  defineRule<CounterContext>({
    id: 'counter.decrement',
    description: 'Decrement the counter',
    impl: (state, events) => {
      const event = findEvent(events, Decrement);
      if (!event) return [];

      const amount = event.payload.amount ?? 1;
      state.context.count -= amount;
      state.context.history.push(state.context.count);
      state.context.lastAction = `Decremented by ${amount}`;

      return [CountDecremented.create({ amount })];
    },
  })
);

registry.registerRule(
  defineRule<CounterContext>({
    id: 'counter.reset',
    description: 'Reset the counter',
    impl: (state, events) => {
      const event = findEvent(events, Reset);
      if (!event) return [];

      state.context.count = 0;
      state.context.history = [0];
      state.context.lastAction = 'Reset';

      return [];
    },
  })
);

// ============================================================================
// 3. Create the reactive engine
// ============================================================================

const engine = createFrameworkAgnosticReactiveEngine<CounterContext>({
  initialContext: {
    count: 0,
    history: [0],
    lastAction: 'Initial',
  },
});

// ============================================================================
// 4. Create derived/computed values
// ============================================================================

const countDisplay = engine.$derived((state) => `Count: ${state.context.count}`);

const historyDisplay = engine.$derived(
  (state) => `History: [${state.context.history.join(', ')}]`
);

const statusDisplay = engine.$derived((state) => {
  const { count, lastAction } = state.context;
  const status = count > 0 ? 'positive' : count < 0 ? 'negative' : 'zero';
  return `Status: ${status} (${lastAction})`;
});

// ============================================================================
// 5. Subscribe to changes
// ============================================================================

console.log('=== Framework-Agnostic Reactive Counter Example ===\n');

// Subscribe to the engine state
engine.subscribe((state) => {
  console.log('State changed:', {
    count: state.context.count,
    lastAction: state.context.lastAction,
    facts: state.facts.length,
  });
});

// Subscribe to derived values
const unsubCount = countDisplay.subscribe((value) => {
  console.log('  →', value);
});

const unsubHistory = historyDisplay.subscribe((value) => {
  console.log('  →', value);
});

const unsubStatus = statusDisplay.subscribe((value) => {
  console.log('  →', value);
});

// ============================================================================
// 6. Perform some mutations
// ============================================================================

console.log('\n--- Increment by 5 ---');
engine.apply((state) => {
  state.context.count += 5;
  state.context.history.push(state.context.count);
  state.context.lastAction = 'Incremented by 5';
});

console.log('\n--- Increment by 3 ---');
engine.apply((state) => {
  state.context.count += 3;
  state.context.history.push(state.context.count);
  state.context.lastAction = 'Incremented by 3';
});

console.log('\n--- Decrement by 2 ---');
engine.apply((state) => {
  state.context.count -= 2;
  state.context.history.push(state.context.count);
  state.context.lastAction = 'Decremented by 2';
});

console.log('\n--- Reset ---');
engine.apply((state) => {
  state.context.count = 0;
  state.context.history = [0];
  state.context.lastAction = 'Reset';
});

// ============================================================================
// 7. Demonstrate batched mutations
// ============================================================================

console.log('\n--- Batched mutation (increment 10 times) ---');
engine.apply((state) => {
  for (let i = 0; i < 10; i++) {
    state.context.count++;
  }
  state.context.history.push(state.context.count);
  state.context.lastAction = 'Batch increment 10x';
});

console.log('\n--- Nested object mutation ---');
engine.apply((state) => {
  // Push multiple values to history array
  state.context.history.push(state.context.count + 1);
  state.context.history.push(state.context.count + 2);
  state.context.lastAction = 'Added to history';
});

// ============================================================================
// 8. Clean up
// ============================================================================

console.log('\n--- Unsubscribing ---');
unsubCount();
unsubHistory();
unsubStatus();

console.log('\n--- Final state ---');
console.log({
  count: engine.context.count,
  history: engine.context.history,
  lastAction: engine.context.lastAction,
});

console.log('\n=== Example complete ===');

export { engine };
