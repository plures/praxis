/**
 * Benchmark Suite — State Updates
 *
 * Measures performance of state management operations:
 * - Fact deduplication strategies (none, last-write-wins, append)
 * - Growing fact stores (10, 100, 1000 existing facts)
 * - Fact retraction
 * - maxFacts eviction
 * - Direct context updates (updateContext)
 * - addFacts (bulk injection)
 */

import { describe, bench } from 'vitest';
import { createPraxisEngine } from '../core/engine.js';
import { PraxisRegistry } from '../core/rules.js';
import { RuleResult } from '../core/rule-result.js';
import type { PraxisFact, PraxisEvent } from '../core/protocol.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface BenchContext {
  seq: number;
}

const tick: PraxisEvent = { tag: 'tick', payload: {} };

function makeFacts(n: number, tag = 'existing-fact'): PraxisFact[] {
  return Array.from({ length: n }, (_, i) => ({ tag: `${tag}-${i}`, payload: { i } }));
}

function makeEmittingEngine(
  dedup: 'none' | 'last-write-wins' | 'append',
  initialFacts: PraxisFact[] = [],
  maxFacts = 1000,
) {
  const registry = new PraxisRegistry<BenchContext>({ compliance: { enabled: false } });
  registry.registerRule({
    id: 'emitter',
    description: 'Emits one new fact per step',
    impl: (state) => {
      // Use the current step count embedded in context to produce a stable, deterministic fact tag
      return RuleResult.emit([{ tag: 'emitted', payload: { seq: state.context.seq } }]);
    },
  });
  return createPraxisEngine<BenchContext>({
    initialContext: { seq: 0 },
    registry,
    initialFacts,
    factDedup: dedup,
    maxFacts,
  });
}

// ─── Deduplication strategies ─────────────────────────────────────────────────

describe('state updates — fact deduplication strategies', () => {
  bench('dedup: last-write-wins — emit into empty store', () => {
    const engine = makeEmittingEngine('last-write-wins');
    engine.step([tick]);
  });

  bench('dedup: append — emit into empty store', () => {
    const engine = makeEmittingEngine('append');
    engine.step([tick]);
  });

  bench('dedup: none — emit into empty store', () => {
    const engine = makeEmittingEngine('none');
    engine.step([tick]);
  });

  bench('dedup: last-write-wins — 100 existing facts', () => {
    const engine = makeEmittingEngine('last-write-wins', makeFacts(100));
    engine.step([tick]);
  });

  bench('dedup: append — 100 existing facts', () => {
    const engine = makeEmittingEngine('append', makeFacts(100));
    engine.step([tick]);
  });

  bench('dedup: none — 100 existing facts', () => {
    const engine = makeEmittingEngine('none', makeFacts(100));
    engine.step([tick]);
  });

  bench('dedup: last-write-wins — 1000 existing facts', () => {
    const engine = makeEmittingEngine('last-write-wins', makeFacts(1000));
    engine.step([tick]);
  });

  bench('dedup: append — 1000 existing facts', () => {
    const engine = makeEmittingEngine('append', makeFacts(1000));
    engine.step([tick]);
  });
});

// ─── maxFacts eviction ────────────────────────────────────────────────────────

describe('state updates — maxFacts eviction', () => {
  bench('maxFacts=10, store at capacity (append)', () => {
    const engine = makeEmittingEngine('append', makeFacts(10), 10);
    engine.step([tick]);
  });

  bench('maxFacts=100, store at capacity (append)', () => {
    const engine = makeEmittingEngine('append', makeFacts(100), 100);
    engine.step([tick]);
  });

  bench('maxFacts=1000, store at capacity (append)', () => {
    const engine = makeEmittingEngine('append', makeFacts(1000), 1000);
    engine.step([tick]);
  });
});

// ─── Fact retraction ──────────────────────────────────────────────────────────

describe('state updates — fact retraction', () => {
  bench('retract 1 fact from 10', () => {
    const registry = new PraxisRegistry<BenchContext>({ compliance: { enabled: false } });
    registry.registerRule({
      id: 'retractor',
      description: 'Retracts a fact',
      impl: () => RuleResult.retract(['existing-fact-0']),
    });
    const engine = createPraxisEngine<BenchContext>({
      initialContext: { seq: 0 },
      registry,
      initialFacts: makeFacts(10),
    });
    engine.step([tick]);
  });

  bench('retract 1 fact from 100', () => {
    const registry = new PraxisRegistry<BenchContext>({ compliance: { enabled: false } });
    registry.registerRule({
      id: 'retractor',
      description: 'Retracts a fact',
      impl: () => RuleResult.retract(['existing-fact-0']),
    });
    const engine = createPraxisEngine<BenchContext>({
      initialContext: { seq: 0 },
      registry,
      initialFacts: makeFacts(100),
    });
    engine.step([tick]);
  });

  bench('retract 10 facts from 100', () => {
    const registry = new PraxisRegistry<BenchContext>({ compliance: { enabled: false } });
    const tags = Array.from({ length: 10 }, (_, i) => `existing-fact-${i}`);
    registry.registerRule({
      id: 'bulk-retractor',
      description: 'Retracts many facts',
      impl: () => RuleResult.retract(tags),
    });
    const engine = createPraxisEngine<BenchContext>({
      initialContext: { seq: 0 },
      registry,
      initialFacts: makeFacts(100),
    });
    engine.step([tick]);
  });
});

// ─── Context updates ──────────────────────────────────────────────────────────

describe('state updates — context updates', () => {
  bench('updateContext — scalar mutation', () => {
    const registry = new PraxisRegistry<BenchContext>({ compliance: { enabled: false } });
    const engine = createPraxisEngine<BenchContext>({
      initialContext: { seq: 0 },
      registry,
    });
    engine.updateContext(ctx => ({ ...ctx, seq: ctx.seq + 1 }));
  });

  bench('updateContext — 100 sequential mutations', () => {
    const registry = new PraxisRegistry<BenchContext>({ compliance: { enabled: false } });
    const engine = createPraxisEngine<BenchContext>({
      initialContext: { seq: 0 },
      registry,
    });
    for (let i = 0; i < 100; i++) {
      engine.updateContext(ctx => ({ ...ctx, seq: ctx.seq + 1 }));
    }
  });

  bench('addFacts — bulk inject 50 facts', () => {
    const registry = new PraxisRegistry<BenchContext>({ compliance: { enabled: false } });
    const engine = createPraxisEngine<BenchContext>({
      initialContext: { seq: 0 },
      registry,
    });
    engine.addFacts(makeFacts(50));
  });

  bench('clearFacts — clear 500-fact store', () => {
    const registry = new PraxisRegistry<BenchContext>({ compliance: { enabled: false } });
    const engine = createPraxisEngine<BenchContext>({
      initialContext: { seq: 0 },
      registry,
      initialFacts: makeFacts(500),
    });
    engine.clearFacts();
  });
});

// ─── getState / getContext (read overhead) ────────────────────────────────────

describe('state updates — read operations', () => {
  bench('getState — empty facts', () => {
    const registry = new PraxisRegistry<BenchContext>({ compliance: { enabled: false } });
    const engine = createPraxisEngine<BenchContext>({ initialContext: { seq: 0 }, registry });
    engine.getState();
  });

  bench('getState — 100 facts', () => {
    const registry = new PraxisRegistry<BenchContext>({ compliance: { enabled: false } });
    const engine = createPraxisEngine<BenchContext>({
      initialContext: { seq: 0 },
      registry,
      initialFacts: makeFacts(100),
    });
    engine.getState();
  });

  bench('getFacts — 500 facts', () => {
    const registry = new PraxisRegistry<BenchContext>({ compliance: { enabled: false } });
    const engine = createPraxisEngine<BenchContext>({
      initialContext: { seq: 0 },
      registry,
      initialFacts: makeFacts(500),
    });
    engine.getFacts();
  });
});
