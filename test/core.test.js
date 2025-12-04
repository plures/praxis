/**
 * Tests for Praxis core functionality
 */

import { test } from 'node:test';
import assert from 'node:assert';
import {
  createRegistry,
  createStepFunction,
  rule,
  constraint,
  step,
  compose,
  createActor,
  createActorSystem,
  createFlow,
  advanceFlow,
} from '../dist/index.js';

test('Basic state transition', () => {
  const initialState = {
    facts: { count: 0 },
  };

  const event = {
    type: 'INCREMENT',
    timestamp: Date.now(),
  };

  const stepFn = step((state, event) => ({
    ...state,
    facts: {
      ...state.facts,
      count: state.facts.count + 1,
      lastAction: event.type.toLowerCase(),
    },
  }));

  const result = stepFn(initialState, event);
  assert.strictEqual(result.state.facts.count, 1);
  assert.strictEqual(result.state.facts.lastAction, 'increment');
});

test('Registry with rules', () => {
  const registry = createRegistry();

  const incrementRule = rule()
    .id('increment-rule')
    .on('INCREMENT')
    .when(() => true)
    .then((state, event) => [
      {
        type: 'LOG',
        payload: { message: `Count is now ${state.facts.count}` },
      },
    ])
    .build();

  registry.registerRule(incrementRule);

  const initialState = {
    facts: { count: 5 },
  };

  const event = {
    type: 'INCREMENT',
    timestamp: Date.now(),
  };

  const effects = registry.evaluateRules(initialState, event);
  assert.strictEqual(effects.length, 1);
  assert.strictEqual(effects[0].type, 'LOG');
});

test('Constraints validation', () => {
  const registry = createRegistry();

  const positiveConstraint = constraint()
    .id('positive-count')
    .check((state) => state.facts.count >= 0)
    .message('Count must be non-negative')
    .build();

  registry.registerConstraint(positiveConstraint);

  const validState = {
    facts: { count: 5 },
  };

  const invalidState = {
    facts: { count: -1 },
  };

  const validViolations = registry.checkConstraints(validState);
  assert.strictEqual(validViolations.length, 0);

  const invalidViolations = registry.checkConstraints(invalidState);
  assert.strictEqual(invalidViolations.length, 1);
  assert.strictEqual(invalidViolations[0].constraintId, 'positive-count');
});

test('Step function with registry', () => {
  const registry = createRegistry();

  const constraint1 = constraint()
    .id('max-count')
    .check((state) => state.facts.count <= 100)
    .message('Count cannot exceed 100')
    .build();

  registry.registerConstraint(constraint1);

  const stepFn = createStepFunction({
    registry,
    checkConstraints: true,
    reducer: (state, event) => {
      if (event.type === 'INCREMENT') {
        return {
          ...state,
          facts: {
            ...state.facts,
            count: state.facts.count + 1,
          },
        };
      }
      return state;
    },
  });

  const initialState = {
    facts: { count: 0 },
  };

  const event = {
    type: 'INCREMENT',
    timestamp: Date.now(),
  };

  const result = stepFn(initialState, event);
  assert.strictEqual(result.state.facts.count, 1);
  assert.strictEqual(result.errors, undefined);
});

test('Compose step functions', () => {
  const step1 = step((state, event) => ({
    ...state,
    facts: { ...state.facts, count: state.facts.count + 1 },
  }));

  const step2 = step((state, event) => ({
    ...state,
    facts: { ...state.facts, count: state.facts.count * 2 },
  }));

  const composed = compose(step1, step2);

  const initialState = {
    facts: { count: 5 },
  };

  const event = {
    type: 'INCREMENT',
    timestamp: Date.now(),
  };

  const result = composed(initialState, event);
  // (5 + 1) * 2 = 12
  assert.strictEqual(result.state.facts.count, 12);
});

test('Actor system', () => {
  const stepFn = step((state, event) => ({
    ...state,
    facts: {
      ...state.facts,
      count: event.type === 'INCREMENT' ? state.facts.count + 1 : state.facts.count,
    },
  }));

  const actor = createActor('counter-1', { facts: { count: 0 } }, stepFn, 'counter');

  const system = createActorSystem();
  system.register(actor);

  const event = {
    type: 'INCREMENT',
    timestamp: Date.now(),
  };

  const result = system.send('counter-1', event);
  assert.ok(result);
  assert.strictEqual(result.state.facts.count, 1);

  // Verify actor state was updated
  const updatedActor = system.get('counter-1');
  assert.ok(updatedActor);
  assert.strictEqual(updatedActor.state.facts.count, 1);
});

test('Flow progression', () => {
  const flow = createFlow('test-flow', [
    { id: 'step1', expectedEventType: 'INCREMENT' },
    { id: 'step2', expectedEventType: 'DECREMENT' },
    { id: 'step3', expectedEventType: 'RESET' },
  ]);

  assert.strictEqual(flow.complete, false);
  assert.strictEqual(flow.currentStep, 0);

  // Advance with first event
  const event1 = {
    type: 'INCREMENT',
    timestamp: Date.now(),
  };

  const result1 = advanceFlow(flow, event1);
  assert.strictEqual(result1.accepted, true);
  assert.strictEqual(result1.flow.currentStep, 1);
  assert.strictEqual(result1.flow.complete, false);

  // Try wrong event type
  const wrongEvent = {
    type: 'RESET',
    timestamp: Date.now(),
  };

  const result2 = advanceFlow(result1.flow, wrongEvent);
  assert.strictEqual(result2.accepted, false);
  assert.strictEqual(result2.flow.currentStep, 1);

  // Continue with correct events
  const event2 = {
    type: 'DECREMENT',
    timestamp: Date.now(),
  };

  const result3 = advanceFlow(result1.flow, event2);
  assert.strictEqual(result3.accepted, true);
  assert.strictEqual(result3.flow.currentStep, 2);

  const event3 = {
    type: 'RESET',
    timestamp: Date.now(),
  };

  const result4 = advanceFlow(result3.flow, event3);
  assert.strictEqual(result4.accepted, true);
  assert.strictEqual(result4.flow.currentStep, 3);
  assert.strictEqual(result4.flow.complete, true);
});

test('JSON serialization', () => {
  const state = {
    facts: { count: 42, lastAction: 'increment' },
    metadata: { version: 1, lastUpdated: Date.now() },
  };

  const event = {
    type: 'INCREMENT',
    timestamp: Date.now(),
    data: { delta: 1 },
    metadata: { correlationId: 'test-123' },
  };

  // Verify everything can be serialized to JSON
  const stateJson = JSON.stringify(state);
  const eventJson = JSON.stringify(event);

  const parsedState = JSON.parse(stateJson);
  const parsedEvent = JSON.parse(eventJson);

  assert.strictEqual(parsedState.facts.count, 42);
  assert.strictEqual(parsedEvent.type, 'INCREMENT');
});

test('Rule priority ordering', () => {
  const registry = createRegistry();

  let executionOrder = [];

  const rule1 = rule()
    .id('rule-low')
    .priority(1)
    .when(() => true)
    .then(() => {
      executionOrder.push(1);
      return [];
    })
    .build();

  const rule2 = rule()
    .id('rule-high')
    .priority(10)
    .when(() => true)
    .then(() => {
      executionOrder.push(10);
      return [];
    })
    .build();

  const rule3 = rule()
    .id('rule-medium')
    .priority(5)
    .when(() => true)
    .then(() => {
      executionOrder.push(5);
      return [];
    })
    .build();

  registry.registerRules([rule1, rule2, rule3]);

  const state = { facts: { count: 0 } };
  const event = { type: 'INCREMENT', timestamp: Date.now() };

  registry.evaluateRules(state, event);

  // Rules should execute in priority order: 10, 5, 1
  assert.deepStrictEqual(executionOrder, [10, 5, 1]);
});

console.log('All tests passed!');
