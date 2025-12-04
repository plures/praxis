/**
 * Example: Counter Application using Praxis
 *
 * This example demonstrates:
 * - Defining custom state and events
 * - Creating rules with the DSL
 * - Setting up constraints
 * - Using a registry with step functions
 * - Handling effects
 */

import { createRegistry, createStepFunction, rule, constraint } from '../dist/index.js';

// Define application state
const initialState = {
  facts: {
    count: 0,
    history: [],
    locked: false,
  },
};

// Create registry
const registry = createRegistry();

// Define rules
const logIncrementRule = rule()
  .id('log-increment')
  .describe('Log when counter is incremented')
  .on('INCREMENT')
  .when((state, event) => !state.facts.locked)
  .then((state, event) => [
    {
      type: 'LOG',
      payload: {
        level: 'info',
        message: `Counter incremented from ${state.facts.count - 1} to ${state.facts.count}`,
      },
    },
  ])
  .priority(10)
  .build();

const alertHighValueRule = rule()
  .id('alert-high-value')
  .describe('Alert when counter reaches high value')
  .on('INCREMENT')
  .when((state, event) => state.facts.count >= 10)
  .then((state, event) => [
    {
      type: 'ALERT',
      payload: {
        message: 'Counter has reached a high value!',
        value: state.facts.count,
      },
    },
  ])
  .priority(5)
  .build();

const lockOnResetRule = rule()
  .id('lock-on-reset')
  .describe('Lock counter when reset')
  .on('RESET')
  .when(() => true)
  .then((state, event) => [
    {
      type: 'LOG',
      payload: {
        level: 'warning',
        message: 'Counter was reset and locked',
      },
    },
  ])
  .build();

// Register rules
registry.registerRules([logIncrementRule, alertHighValueRule, lockOnResetRule]);

// Define constraints
const countRangeConstraint = constraint()
  .id('count-range')
  .describe('Count must be between 0 and 100')
  .check((state) => state.facts.count >= 0 && state.facts.count <= 100)
  .message('Count must be between 0 and 100')
  .build();

const historyLimitConstraint = constraint()
  .id('history-limit')
  .describe('History cannot exceed 50 entries')
  .check((state) => state.facts.history.length <= 50)
  .message('History limit exceeded')
  .build();

// Register constraints
registry.registerConstraints([countRangeConstraint, historyLimitConstraint]);

// Create step function with custom reducer
const step = createStepFunction({
  registry,
  checkConstraints: true,
  reducer: (state, event) => {
    const timestamp = event.timestamp;

    switch (event.type) {
      case 'INCREMENT':
        if (state.facts.locked) {
          return state;
        }
        return {
          ...state,
          facts: {
            ...state.facts,
            count: state.facts.count + 1,
            history: [
              ...state.facts.history,
              { action: 'increment', timestamp, count: state.facts.count + 1 },
            ],
          },
          metadata: {
            ...state.metadata,
            lastUpdated: timestamp,
            version: (state.metadata?.version || 0) + 1,
          },
        };

      case 'DECREMENT':
        if (state.facts.locked) {
          return state;
        }
        return {
          ...state,
          facts: {
            ...state.facts,
            count: Math.max(0, state.facts.count - 1),
            history: [
              ...state.facts.history,
              { action: 'decrement', timestamp, count: Math.max(0, state.facts.count - 1) },
            ],
          },
          metadata: {
            ...state.metadata,
            lastUpdated: timestamp,
            version: (state.metadata?.version || 0) + 1,
          },
        };

      case 'RESET':
        return {
          ...state,
          facts: {
            ...state.facts,
            count: 0,
            locked: true,
            history: [...state.facts.history, { action: 'reset', timestamp, count: 0 }],
          },
          metadata: {
            ...state.metadata,
            lastUpdated: timestamp,
            version: (state.metadata?.version || 0) + 1,
          },
        };

      case 'UNLOCK':
        return {
          ...state,
          facts: {
            ...state.facts,
            locked: false,
          },
          metadata: {
            ...state.metadata,
            lastUpdated: timestamp,
            version: (state.metadata?.version || 0) + 1,
          },
        };

      default:
        return state;
    }
  },
});

// Effect handler
function executeEffects(effects) {
  effects.forEach((effect) => {
    switch (effect.type) {
      case 'LOG':
        console.log(`[${effect.payload.level.toUpperCase()}] ${effect.payload.message}`);
        break;
      case 'ALERT':
        console.log(`🚨 ALERT: ${effect.payload.message} (value: ${effect.payload.value})`);
        break;
      default:
        console.log(`Unknown effect: ${effect.type}`);
    }
  });
}

// Run example
console.log('=== Praxis Counter Example ===\n');

let currentState = initialState;

// Helper function to process events
function processEvent(type, data = {}) {
  console.log(`\n📨 Event: ${type}`);
  const event = {
    type,
    timestamp: Date.now(),
    data,
  };

  const result = step(currentState, event);

  if (result.errors && result.errors.length > 0) {
    console.log('❌ Errors:', result.errors);
  } else {
    currentState = result.state;
    console.log(`✅ Count: ${currentState.facts.count}, Locked: ${currentState.facts.locked}`);

    if (result.effects && result.effects.length > 0) {
      console.log('📤 Effects:');
      executeEffects(result.effects);
    }
  }
}

// Simulate a sequence of events
processEvent('INCREMENT');
processEvent('INCREMENT');
processEvent('INCREMENT');
processEvent('INCREMENT');
processEvent('INCREMENT');
processEvent('INCREMENT');
processEvent('INCREMENT');
processEvent('INCREMENT');
processEvent('INCREMENT');
processEvent('INCREMENT'); // Should trigger alert
processEvent('INCREMENT');

console.log('\n--- Attempting to decrement ---');
processEvent('DECREMENT');

console.log('\n--- Resetting counter ---');
processEvent('RESET'); // Should lock the counter

console.log('\n--- Attempting to increment while locked ---');
processEvent('INCREMENT'); // Should be ignored

console.log('\n--- Unlocking counter ---');
processEvent('UNLOCK');

console.log('\n--- Incrementing after unlock ---');
processEvent('INCREMENT');

// Display final state
console.log('\n=== Final State ===');
console.log(JSON.stringify(currentState, null, 2));

// Display registry statistics
console.log('\n=== Registry Statistics ===');
console.log(JSON.stringify(registry.getStats(), null, 2));
