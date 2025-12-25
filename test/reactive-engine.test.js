/**
 * Tests for ReactiveLogicEngine
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { ReactiveLogicEngine } from '../dist/node/index.js';

test('ReactiveLogicEngine - Basic instantiation', () => {
  const initialContext = { count: 0, name: 'test' };
  const engine = new ReactiveLogicEngine({
    initialContext,
    initialFacts: ['fact1', 'fact2'],
    initialMeta: { version: 1 },
  });

  assert.strictEqual(engine.context.count, 0);
  assert.strictEqual(engine.context.name, 'test');
  assert.deepStrictEqual(engine.facts, ['fact1', 'fact2']);
  assert.deepStrictEqual(engine.meta, { version: 1 });
});

test('ReactiveLogicEngine - Context access', () => {
  const engine = new ReactiveLogicEngine({
    initialContext: { value: 42 },
  });

  assert.strictEqual(engine.context.value, 42);
  assert.strictEqual(engine.state.context.value, 42);
});

test('ReactiveLogicEngine - Apply mutations', () => {
  const engine = new ReactiveLogicEngine({
    initialContext: { count: 0 },
    initialFacts: [],
  });

  engine.apply((state) => {
    state.context.count = 10;
    state.facts.push('newFact');
    state.meta.updated = true;
  });

  assert.strictEqual(engine.context.count, 10);
  assert.deepStrictEqual(engine.facts, ['newFact']);
  assert.strictEqual(engine.meta.updated, true);
});

test('ReactiveLogicEngine - Multiple mutations', () => {
  const engine = new ReactiveLogicEngine({
    initialContext: { items: [] },
    initialFacts: [],
  });

  engine.apply((state) => {
    state.context.items.push('item1');
  });

  engine.apply((state) => {
    state.context.items.push('item2');
  });

  assert.deepStrictEqual(engine.context.items, ['item1', 'item2']);
});

test('ReactiveLogicEngine - Facts management', () => {
  const engine = new ReactiveLogicEngine({
    initialContext: {},
    initialFacts: ['initial'],
  });

  assert.deepStrictEqual(engine.facts, ['initial']);

  engine.apply((state) => {
    state.facts.push('added');
  });

  assert.deepStrictEqual(engine.facts, ['initial', 'added']);
});

test('ReactiveLogicEngine - Meta management', () => {
  const engine = new ReactiveLogicEngine({
    initialContext: {},
    initialMeta: { key1: 'value1' },
  });

  assert.strictEqual(engine.meta.key1, 'value1');

  engine.apply((state) => {
    state.meta.key2 = 'value2';
  });

  assert.strictEqual(engine.meta.key1, 'value1');
  assert.strictEqual(engine.meta.key2, 'value2');
});

test('ReactiveLogicEngine - Default values', () => {
  const engine = new ReactiveLogicEngine({
    initialContext: { test: true },
  });

  assert.deepStrictEqual(engine.facts, []);
  assert.deepStrictEqual(engine.meta, {});
});

console.log('All ReactiveLogicEngine tests passed!');
