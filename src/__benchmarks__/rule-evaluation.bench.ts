/**
 * Benchmark Suite — Rule Evaluation
 *
 * Measures throughput of the core rule evaluation pipeline:
 * - Single rule with no events (catch-all)
 * - Single rule with event-type filtering
 * - Many rules (N=10, 50) fan-out
 * - Rules returning noop / skip vs emit
 * - Constraint checking overhead
 * - Event batch sizes (1, 10, 100)
 */

import { describe, bench } from 'vitest';
import { createPraxisEngine } from '../core/engine.js';
import { PraxisRegistry } from '../core/rules.js';
import { RuleResult } from '../core/rule-result.js';
import type { PraxisEvent } from '../core/protocol.js';

// ─── Shared fixtures ────────────────────────────────────────────────────────

interface BenchContext {
  value: number;
  label: string;
}

const singleEvent: PraxisEvent[] = [{ tag: 'tick', payload: { seq: 1 } }];

function makeEvents(n: number): PraxisEvent[] {
  return Array.from({ length: n }, (_, i) => ({ tag: 'tick', payload: { seq: i } }));
}

function makeRegistry(ruleCount: number, opts: { filtered?: boolean; emit?: boolean } = {}) {
  const registry = new PraxisRegistry<BenchContext>({ compliance: { enabled: false } });

  for (let i = 0; i < ruleCount; i++) {
    registry.registerRule({
      id: `rule-${i}`,
      description: `Bench rule ${i}`,
      ...(opts.filtered ? { eventTypes: ['tick'] } : {}),
      impl: (_state, _events) => {
        if (opts.emit) {
          return RuleResult.emit([{ tag: `fact-${i}`, payload: { i } }]);
        }
        return RuleResult.noop();
      },
    });
  }

  return registry;
}

function makeEngine(ruleCount: number, opts: { filtered?: boolean; emit?: boolean; dedup?: 'none' | 'last-write-wins' | 'append' } = {}) {
  return createPraxisEngine<BenchContext>({
    initialContext: { value: 0, label: 'bench' },
    registry: makeRegistry(ruleCount, opts),
    factDedup: opts.dedup ?? 'last-write-wins',
  });
}

// ─── Single rule ─────────────────────────────────────────────────────────────

describe('rule evaluation — single rule', () => {
  bench('catch-all rule returning noop', () => {
    const engine = makeEngine(1, { emit: false });
    engine.step(singleEvent);
  });

  bench('catch-all rule emitting one fact', () => {
    const engine = makeEngine(1, { emit: true });
    engine.step(singleEvent);
  });

  bench('event-filtered rule (matching event)', () => {
    const engine = makeEngine(1, { filtered: true, emit: true });
    engine.step(singleEvent);
  });

  bench('event-filtered rule (no matching event)', () => {
    const engine = makeEngine(1, { filtered: true, emit: true });
    engine.step([{ tag: 'other', payload: {} }]);
  });
});

// ─── Multiple rules ───────────────────────────────────────────────────────────

describe('rule evaluation — many rules', () => {
  bench('10 catch-all rules, all noop', () => {
    const engine = makeEngine(10, { emit: false });
    engine.step(singleEvent);
  });

  bench('10 catch-all rules, all emit', () => {
    const engine = makeEngine(10, { emit: true });
    engine.step(singleEvent);
  });

  bench('50 catch-all rules, all noop', () => {
    const engine = makeEngine(50, { emit: false });
    engine.step(singleEvent);
  });

  bench('50 catch-all rules, all emit', () => {
    const engine = makeEngine(50, { emit: true });
    engine.step(singleEvent);
  });

  bench('50 event-filtered rules (half match)', () => {
    const registry = new PraxisRegistry<BenchContext>({ compliance: { enabled: false } });
    for (let i = 0; i < 25; i++) {
      registry.registerRule({
        id: `rule-tick-${i}`,
        description: `tick rule ${i}`,
        eventTypes: ['tick'],
        impl: () => RuleResult.noop(),
      });
    }
    for (let i = 0; i < 25; i++) {
      registry.registerRule({
        id: `rule-other-${i}`,
        description: `other rule ${i}`,
        eventTypes: ['other'],
        impl: () => RuleResult.noop(),
      });
    }
    const engine = createPraxisEngine<BenchContext>({
      initialContext: { value: 0, label: 'bench' },
      registry,
    });
    engine.step(singleEvent);
  });
});

// ─── Event batch sizes ────────────────────────────────────────────────────────

describe('rule evaluation — event batch size', () => {
  bench('1 event, 5 rules', () => {
    const engine = makeEngine(5, { emit: false });
    engine.step(makeEvents(1));
  });

  bench('10 events, 5 rules', () => {
    const engine = makeEngine(5, { emit: false });
    engine.step(makeEvents(10));
  });

  bench('100 events, 5 rules', () => {
    const engine = makeEngine(5, { emit: false });
    engine.step(makeEvents(100));
  });
});

// ─── Constraints ──────────────────────────────────────────────────────────────

describe('rule evaluation — constraint checking', () => {
  bench('no constraints', () => {
    const engine = makeEngine(5, { emit: false });
    engine.step(singleEvent);
  });

  bench('5 passing constraints', () => {
    const registry = new PraxisRegistry<BenchContext>({ compliance: { enabled: false } });
    for (let i = 0; i < 5; i++) {
      registry.registerConstraint({
        id: `constraint-${i}`,
        description: `Bench constraint ${i}`,
        impl: () => true,
      });
    }
    const engine = createPraxisEngine<BenchContext>({
      initialContext: { value: 0, label: 'bench' },
      registry,
    });
    engine.step(singleEvent);
  });

  bench('20 passing constraints', () => {
    const registry = new PraxisRegistry<BenchContext>({ compliance: { enabled: false } });
    for (let i = 0; i < 20; i++) {
      registry.registerConstraint({
        id: `constraint-${i}`,
        description: `Bench constraint ${i}`,
        impl: (state) => state.context.value >= 0,
      });
    }
    const engine = createPraxisEngine<BenchContext>({
      initialContext: { value: 0, label: 'bench' },
      registry,
    });
    engine.step(singleEvent);
  });
});

// ─── stepWithContext ──────────────────────────────────────────────────────────

describe('rule evaluation — stepWithContext', () => {
  bench('stepWithContext — single rule, context update + event', () => {
    const engine = makeEngine(1, { emit: true });
    engine.stepWithContext(ctx => ({ ...ctx, value: ctx.value + 1 }), singleEvent);
  });

  bench('stepWithContext — 10 rules, context update + event', () => {
    const engine = makeEngine(10, { emit: false });
    engine.stepWithContext(ctx => ({ ...ctx, value: ctx.value + 1 }), singleEvent);
  });
});

// ─── Repeated steps (stateful) ────────────────────────────────────────────────

describe('rule evaluation — repeated steps on same engine', () => {
  bench('100 sequential steps — 1 rule emitting (last-write-wins dedup)', () => {
    const engine = makeEngine(1, { emit: true, dedup: 'last-write-wins' });
    for (let i = 0; i < 100; i++) {
      engine.step([{ tag: 'tick', payload: { seq: i } }]);
    }
  });

  bench('100 sequential steps — 5 rules noop', () => {
    const engine = makeEngine(5, { emit: false });
    for (let i = 0; i < 100; i++) {
      engine.step(singleEvent);
    }
  });
});
