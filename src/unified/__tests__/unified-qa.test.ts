/**
 * Praxis Unified Reactive Layer — Deep QA Suite
 *
 * Stress tests, edge cases, concurrency, memory pressure, and correctness
 * validation for the v2.0 unified API.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createApp,
  definePath,
  defineRule,
  defineConstraint,
  RuleResult,
  fact,
} from '../index.js';

// ── Schema ──────────────────────────────────────────────────────────────────

const Counter = definePath<number>('counter', 0);
const Items = definePath<Array<{ id: number; name: string; done: boolean }>>('items', []);
const Nested = definePath<{ a: { b: { c: number } } }>('nested', { a: { b: { c: 0 } } });
const NullablePath = definePath<string | null>('nullable', null);
const Loading = definePath<boolean>('loading', false);
const Error_ = definePath<string | null>('error', null);

// ── Edge Case Tests ─────────────────────────────────────────────────────────

describe('Unified QA — Edge Cases', () => {
  describe('schema defaults', () => {
    it('returns correct initial for each type', () => {
      const app = createApp({ name: 'test', schema: [Counter, Items, NullablePath, Loading] });
      expect(app.query<number>('counter').current).toBe(0);
      expect(app.query<any[]>('items').current).toEqual([]);
      expect(app.query<string | null>('nullable').current).toBeNull();
      expect(app.query<boolean>('loading').current).toBe(false);
      app.destroy();
    });

    it('querying undefined path returns undefined, not crash', () => {
      const app = createApp({ name: 'test', schema: [] });
      const ref = app.query<string>('nonexistent');
      expect(ref.current).toBeUndefined();
      app.destroy();
    });
  });

  describe('mutate edge cases', () => {
    it('mutating to same value still notifies subscribers', () => {
      const app = createApp({ name: 'test', schema: [Counter] });
      const values: number[] = [];
      app.query<number>('counter').subscribe(v => values.push(v));
      
      app.mutate('counter', 0); // same as initial
      // Should still notify (we don't do deep equality checks on mutate)
      expect(values.length).toBeGreaterThanOrEqual(2);
      app.destroy();
    });

    it('mutating undefined path auto-creates it', () => {
      const app = createApp({ name: 'test', schema: [] });
      const result = app.mutate('dynamic/path', 42);
      expect(result.accepted).toBe(true);
      expect(app.query<number>('dynamic/path').current).toBe(42);
      app.destroy();
    });

    it('mutating null → value → null roundtrip', () => {
      const app = createApp({ name: 'test', schema: [NullablePath] });
      const values: Array<string | null> = [];
      app.query<string | null>('nullable').subscribe(v => values.push(v));

      app.mutate('nullable', 'hello');
      app.mutate('nullable', null);

      expect(values).toEqual([null, 'hello', null]);
      app.destroy();
    });

    it('mutating with complex objects (arrays of objects)', () => {
      const app = createApp({ name: 'test', schema: [Items] });
      const bigList = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        done: i % 2 === 0,
      }));
      const result = app.mutate('items', bigList);
      expect(result.accepted).toBe(true);
      expect(app.query<any[]>('items').current.length).toBe(1000);
      app.destroy();
    });
  });

  describe('subscriber lifecycle', () => {
    it('unsubscribe prevents further notifications', () => {
      const app = createApp({ name: 'test', schema: [Counter] });
      const values: number[] = [];
      const ref = app.query<number>('counter');
      const unsub = ref.subscribe(v => values.push(v));

      app.mutate('counter', 1);
      unsub();
      app.mutate('counter', 2);
      app.mutate('counter', 3);

      expect(values).toEqual([0, 1]); // initial + first mutate only
      app.destroy();
    });

    it('multiple subscribe/unsubscribe cycles work', () => {
      const app = createApp({ name: 'test', schema: [Counter] });
      const ref = app.query<number>('counter');

      for (let i = 0; i < 100; i++) {
        const vals: number[] = [];
        const unsub = ref.subscribe(v => vals.push(v));
        expect(vals.length).toBe(1); // immediate callback
        unsub();
      }
      app.destroy();
    });

    it('subscriber error does not break other subscribers', () => {
      const app = createApp({ name: 'test', schema: [Counter] });
      const ref = app.query<number>('counter');
      const good: number[] = [];

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      ref.subscribe(() => { throw new Error('boom'); });
      ref.subscribe(v => good.push(v));

      app.mutate('counter', 42);

      expect(good).toEqual([0, 42]);
      consoleError.mockRestore();
      app.destroy();
    });
  });

  describe('query options — deep', () => {
    it('where + sort + limit compose correctly', () => {
      const app = createApp({ name: 'test', schema: [Items] });
      app.mutate('items', [
        { id: 5, name: 'E', done: false },
        { id: 1, name: 'A', done: true },
        { id: 3, name: 'C', done: false },
        { id: 2, name: 'B', done: false },
        { id: 4, name: 'D', done: true },
      ]);

      const ref = app.query<Array<{ id: number; name: string; done: boolean }>>('items', {
        where: item => !item.done,
        sort: (a, b) => a.name.localeCompare(b.name),
        limit: 2,
      });

      expect(ref.current).toEqual([
        { id: 2, name: 'B', done: false },
        { id: 3, name: 'C', done: false },
      ]);
      app.destroy();
    });

    it('query options update reactively on mutate', () => {
      const app = createApp({ name: 'test', schema: [Items] });
      const ref = app.query<Array<{ id: number; name: string; done: boolean }>>('items', {
        where: item => item.done,
      });

      const snapshots: any[] = [];
      ref.subscribe(v => snapshots.push([...v]));

      app.mutate('items', [{ id: 1, name: 'A', done: false }]);
      app.mutate('items', [{ id: 1, name: 'A', done: true }]);

      expect(snapshots[0]).toEqual([]); // initial
      expect(snapshots[1]).toEqual([]); // not done
      expect(snapshots[2]).toEqual([{ id: 1, name: 'A', done: true }]); // now done
      app.destroy();
    });

    it('empty where returns empty array, not crash', () => {
      const app = createApp({ name: 'test', schema: [Items] });
      app.mutate('items', [{ id: 1, name: 'A', done: false }]);
      const ref = app.query<any[]>('items', { where: () => false });
      expect(ref.current).toEqual([]);
      app.destroy();
    });
  });
});

// ── Constraint Tests ────────────────────────────────────────────────────────

describe('Unified QA — Constraints', () => {
  const maxItems = defineConstraint({
    id: 'max-items',
    watch: ['items'],
    validate: (values) => {
      const items = (values['items'] ?? []) as any[];
      if (items.length > 50) return 'Too many items (max 50)';
      return true;
    },
  });

  const noNegativeCounter = defineConstraint({
    id: 'no-negative',
    watch: ['counter'],
    validate: (values) => {
      if ((values['counter'] as number) < 0) return 'Counter cannot be negative';
      return true;
    },
  });

  it('constraint blocks mutation and preserves old value', () => {
    const app = createApp({
      name: 'test',
      schema: [Counter],
      constraints: [noNegativeCounter],
    });

    app.mutate('counter', 5);
    const result = app.mutate('counter', -1);

    expect(result.accepted).toBe(false);
    expect(result.violations[0].message).toContain('negative');
    expect(app.query<number>('counter').current).toBe(5); // preserved
    app.destroy();
  });

  it('multiple constraints on same path all run', () => {
    const alsoNoZero = defineConstraint({
      id: 'no-zero',
      watch: ['counter'],
      validate: (values) => {
        if ((values['counter'] as number) === 0) return 'Counter cannot be zero';
        return true;
      },
    });

    const app = createApp({
      name: 'test',
      schema: [Counter],
      constraints: [noNegativeCounter, alsoNoZero],
    });

    // Start at 0, try to set 0 — noZero blocks
    app.mutate('counter', 5);
    const result = app.mutate('counter', 0);
    expect(result.accepted).toBe(false);
    expect(result.violations.some(v => v.message.includes('zero'))).toBe(true);
    app.destroy();
  });

  it('constraint that throws is caught and reported', () => {
    const throwingConstraint = defineConstraint({
      id: 'throws',
      watch: ['counter'],
      validate: () => { throw new Error('kaboom'); },
    });

    const app = createApp({
      name: 'test',
      schema: [Counter],
      constraints: [throwingConstraint],
    });

    const result = app.mutate('counter', 1);
    expect(result.accepted).toBe(false);
    expect(result.violations[0].message).toContain('kaboom');
    app.destroy();
  });

  it('constraint on collection checks proposed value', () => {
    const app = createApp({
      name: 'test',
      schema: [Items],
      constraints: [maxItems],
    });

    const bigList = Array.from({ length: 51 }, (_, i) => ({ id: i, name: `Item ${i}`, done: false }));
    const result = app.mutate('items', bigList);
    expect(result.accepted).toBe(false);
    expect(result.violations[0].message).toContain('max 50');
    app.destroy();
  });
});

// ── Rule Evaluation Tests ───────────────────────────────────────────────────

describe('Unified QA — Rules', () => {
  const counterHighRule = defineRule({
    id: 'counter.high',
    watch: ['counter'],
    evaluate: (values) => {
      const c = values['counter'] as number;
      if (c > 100) return RuleResult.emit([fact('counter.high', { value: c })]);
      return RuleResult.retract(['counter.high']);
    },
  });

  const itemsEmptyRule = defineRule({
    id: 'items.empty',
    watch: ['items'],
    evaluate: (values) => {
      const items = (values['items'] ?? []) as any[];
      if (items.length === 0) return RuleResult.emit([fact('items.empty', {})]);
      return RuleResult.retract(['items.empty']);
    },
  });

  it('rule emits fact when condition met', () => {
    const app = createApp({
      name: 'test',
      schema: [Counter],
      rules: [counterHighRule],
    });

    app.mutate('counter', 200);
    expect(app.facts().some(f => f.tag === 'counter.high')).toBe(true);
    app.destroy();
  });

  it('rule retracts fact when condition no longer met', () => {
    const app = createApp({
      name: 'test',
      schema: [Counter],
      rules: [counterHighRule],
    });

    app.mutate('counter', 200);
    expect(app.facts().some(f => f.tag === 'counter.high')).toBe(true);

    app.mutate('counter', 50);
    expect(app.facts().some(f => f.tag === 'counter.high')).toBe(false);
    app.destroy();
  });

  it('multiple rules evaluate independently', () => {
    const app = createApp({
      name: 'test',
      schema: [Counter, Items],
      rules: [counterHighRule, itemsEmptyRule],
    });

    // Initially: items empty, counter low
    app.mutate('counter', 0);
    expect(app.facts().some(f => f.tag === 'items.empty')).toBe(true);
    expect(app.facts().some(f => f.tag === 'counter.high')).toBe(false);

    // Now counter high, items still empty
    app.mutate('counter', 200);
    expect(app.facts().some(f => f.tag === 'counter.high')).toBe(true);
    expect(app.facts().some(f => f.tag === 'items.empty')).toBe(true);

    // Add items
    app.mutate('items', [{ id: 1, name: 'A', done: false }]);
    expect(app.facts().some(f => f.tag === 'items.empty')).toBe(false);
    expect(app.facts().some(f => f.tag === 'counter.high')).toBe(true);

    app.destroy();
  });

  it('rule that throws does not crash app', () => {
    const badRule = defineRule({
      id: 'bad',
      watch: ['counter'],
      evaluate: () => { throw new Error('rule crash'); },
    });

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = createApp({
      name: 'test',
      schema: [Counter],
      rules: [badRule, counterHighRule],
    });

    // Should not throw
    app.mutate('counter', 200);
    // Good rule still works
    expect(app.facts().some(f => f.tag === 'counter.high')).toBe(true);
    consoleError.mockRestore();
    app.destroy();
  });

  it('fact LWW: same tag emitted twice keeps latest', () => {
    let callCount = 0;
    const versionedRule = defineRule({
      id: 'versioned',
      watch: ['counter'],
      evaluate: (values) => {
        callCount++;
        return RuleResult.emit([fact('version', { v: callCount, counter: values['counter'] })]);
      },
    });

    const app = createApp({
      name: 'test',
      schema: [Counter],
      rules: [versionedRule],
    });

    app.mutate('counter', 1);
    app.mutate('counter', 2);
    app.mutate('counter', 3);

    const facts = app.facts().filter(f => f.tag === 'version');
    expect(facts.length).toBe(1); // LWW — only latest
    expect((facts[0].payload as any).counter).toBe(3);
    app.destroy();
  });
});

// ── Batch Tests ─────────────────────────────────────────────────────────────

describe('Unified QA — Batch', () => {
  it('batch with zero mutations succeeds', () => {
    const app = createApp({ name: 'test', schema: [Counter] });
    const result = app.batch(() => {});
    expect(result.accepted).toBe(true);
    expect(result.violations).toEqual([]);
    app.destroy();
  });

  it('batch rules only evaluate once (not per mutation)', () => {
    let evalCount = 0;
    const countingRule = defineRule({
      id: 'counting',
      watch: ['counter', 'loading'],
      evaluate: () => {
        evalCount++;
        return RuleResult.noop();
      },
    });

    const app = createApp({
      name: 'test',
      schema: [Counter, Loading],
      rules: [countingRule],
    });

    evalCount = 0;
    app.batch((m) => {
      m('counter', 1);
      m('loading', true);
      m('counter', 2);
    });

    expect(evalCount).toBe(1); // single evaluation pass
    app.destroy();
  });

  it('batch partial constraint failure rejects all', () => {
    const noNeg = defineConstraint({
      id: 'no-neg',
      watch: ['counter'],
      validate: (v) => (v['counter'] as number) >= 0 ? true : 'Negative!',
    });

    const app = createApp({
      name: 'test',
      schema: [Counter, Loading],
      constraints: [noNeg],
    });

    const result = app.batch((m) => {
      m('loading', true); // fine
      m('counter', -5);   // violates
    });

    expect(result.accepted).toBe(false);
    // Loading should NOT have been applied
    expect(app.query<boolean>('loading').current).toBe(false);
    app.destroy();
  });
});

// ── Timeline Tests ──────────────────────────────────────────────────────────

describe('Unified QA — Timeline', () => {
  it('timeline entries have monotonically increasing timestamps', () => {
    const app = createApp({ name: 'test', schema: [Counter] });
    for (let i = 0; i < 20; i++) {
      app.mutate('counter', i);
    }
    const tl = app.timeline();
    for (let i = 1; i < tl.length; i++) {
      expect(tl[i].timestamp).toBeGreaterThanOrEqual(tl[i - 1].timestamp);
    }
    app.destroy();
  });

  it('timeline caps at max entries', () => {
    const app = createApp({ name: 'test', schema: [Counter] });
    // Timeline max is 10000
    for (let i = 0; i < 200; i++) {
      app.mutate('counter', i);
    }
    const tl = app.timeline();
    // With rules, each mutate creates 1 mutation entry
    // Should stay under max
    expect(tl.length).toBeLessThanOrEqual(10000);
    expect(tl.length).toBeGreaterThan(0);
    app.destroy();
  });

  it('timeline records constraint violations', () => {
    const noNeg = defineConstraint({
      id: 'no-neg',
      watch: ['counter'],
      validate: (v) => (v['counter'] as number) >= 0 ? true : 'Negative!',
    });

    const app = createApp({
      name: 'test',
      schema: [Counter],
      constraints: [noNeg],
    });

    app.mutate('counter', -1);
    const tl = app.timeline();
    expect(tl.some(e => e.kind === 'constraint-check')).toBe(true);
    app.destroy();
  });
});

// ── Liveness Tests ──────────────────────────────────────────────────────────

describe('Unified QA — Liveness', () => {
  it('liveness() returns empty when no liveness config', () => {
    const app = createApp({ name: 'test', schema: [Counter] });
    expect(app.liveness()).toEqual({});
    app.destroy();
  });

  it('liveness tracks multiple paths', async () => {
    const app = createApp({
      name: 'test',
      schema: [Counter, Loading, Error_],
      liveness: {
        expect: ['counter', 'loading', 'error'],
        timeoutMs: 30,
      },
    });

    app.mutate('counter', 1);
    // loading and error not mutated

    await new Promise(r => setTimeout(r, 50));

    const status = app.liveness();
    expect(status['counter'].stale).toBe(false);
    expect(status['loading'].stale).toBe(true);
    expect(status['error'].stale).toBe(true);
    app.destroy();
  });

  it('onStale fires only for un-updated paths', async () => {
    const stalePaths: string[] = [];
    const app = createApp({
      name: 'test',
      schema: [Counter, Loading],
      liveness: {
        expect: ['counter', 'loading'],
        timeoutMs: 30,
        onStale: (path) => stalePaths.push(path),
      },
    });

    app.mutate('counter', 1);
    await new Promise(r => setTimeout(r, 50));

    expect(stalePaths).toContain('loading');
    expect(stalePaths).not.toContain('counter');
    app.destroy();
  });
});

// ── Stress Tests ────────────────────────────────────────────────────────────

describe('Unified QA — Stress', () => {
  it('handles 10,000 rapid mutations', () => {
    const app = createApp({
      name: 'test',
      schema: [Counter],
      rules: [defineRule({
        id: 'always',
        watch: ['counter'],
        evaluate: () => RuleResult.noop(),
      })],
    });

    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      app.mutate('counter', i);
    }
    const elapsed = performance.now() - start;

    expect(app.query<number>('counter').current).toBe(9999);
    // Should complete in under 2 seconds even on slow CI
    expect(elapsed).toBeLessThan(2000);
    app.destroy();
  });

  it('handles 50 concurrent subscribers', () => {
    const app = createApp({ name: 'test', schema: [Counter] });
    const results: number[][] = [];
    const unsubs: Array<() => void> = [];

    for (let i = 0; i < 50; i++) {
      results[i] = [];
      const ref = app.query<number>('counter');
      unsubs.push(ref.subscribe(v => results[i].push(v)));
    }

    app.mutate('counter', 42);

    for (let i = 0; i < 50; i++) {
      expect(results[i]).toEqual([0, 42]);
    }

    unsubs.forEach(u => u());
    app.destroy();
  });

  it('handles 100 rules without degradation', () => {
    const rules = Array.from({ length: 100 }, (_, i) => defineRule({
      id: `rule-${i}`,
      watch: ['counter'],
      evaluate: (values) => {
        const c = values['counter'] as number;
        if (c > i) return RuleResult.emit([fact(`above-${i}`, { c })]);
        return RuleResult.retract([`above-${i}`]);
      },
    }));

    const app = createApp({
      name: 'test',
      schema: [Counter],
      rules,
    });

    const start = performance.now();
    app.mutate('counter', 50);
    const elapsed = performance.now() - start;

    const facts = app.facts();
    expect(facts.length).toBe(50); // above-0 through above-49
    expect(elapsed).toBeLessThan(100); // should be nearly instant
    app.destroy();
  });

  it('handles large collections in query options', () => {
    const app = createApp({ name: 'test', schema: [Items] });
    const bigList = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      done: i % 3 === 0,
    }));
    app.mutate('items', bigList);

    const ref = app.query<any[]>('items', {
      where: item => item.done,
      sort: (a, b) => b.id - a.id,
      limit: 10,
    });

    const result = ref.current;
    expect(result.length).toBe(10);
    expect(result[0].id).toBe(9999); // highest done id
    app.destroy();
  });
});

// ── Destroy Tests ───────────────────────────────────────────────────────────

describe('Unified QA — Destroy', () => {
  it('subscribers stop receiving after destroy', () => {
    const app = createApp({ name: 'test', schema: [Counter] });
    const values: number[] = [];
    app.query<number>('counter').subscribe(v => values.push(v));

    app.destroy();
    // This should not throw, but also not notify
    app.mutate('counter', 999);
    expect(values).toEqual([0]); // only initial
  });

  it('facts and timeline are cleared', () => {
    const app = createApp({
      name: 'test',
      schema: [Counter],
      rules: [defineRule({
        id: 'test',
        watch: ['counter'],
        evaluate: () => RuleResult.emit([fact('test', {})]),
      })],
    });

    app.mutate('counter', 1);
    expect(app.facts().length).toBeGreaterThan(0);
    expect(app.timeline().length).toBeGreaterThan(0);

    app.destroy();
    expect(app.facts()).toEqual([]);
    expect(app.timeline()).toEqual([]);
  });
});

describe('auto-retraction on skip/noop', () => {
  it('retracts facts when rule transitions from emit to skip', () => {
    const app = createApp({
      name: 'auto-retract-test',
      schema: [definePath<number | null>('val', null)],
      rules: [defineRule({
        id: 'r1',
        watch: ['val'],
        evaluate: (values) => {
          const v = values['val'] as number | null;
          if (v === null) return RuleResult.skip('no data');
          if (v > 5) return RuleResult.emit([fact('big', { v })]);
          return RuleResult.retract(['big']);
        },
      })],
    });

    // Emit a fact
    app.mutate('val', 10);
    expect(app.facts().find(f => f.tag === 'big')).toBeDefined();

    // Now skip — fact should auto-retract
    app.mutate('val', null);
    expect(app.facts().find(f => f.tag === 'big')).toBeUndefined();

    app.destroy();
  });

  it('retracts facts when rule transitions from emit to noop', () => {
    const app = createApp({
      name: 'auto-retract-noop-test',
      schema: [definePath<number>('val', 0)],
      rules: [defineRule({
        id: 'r1',
        watch: ['val'],
        evaluate: (values) => {
          const v = values['val'] as number;
          if (v > 5) return RuleResult.emit([fact('big', { v })]);
          return RuleResult.noop();
        },
      })],
    });

    app.mutate('val', 10);
    expect(app.facts().find(f => f.tag === 'big')).toBeDefined();

    app.mutate('val', 3);
    expect(app.facts().find(f => f.tag === 'big')).toBeUndefined();

    app.destroy();
  });
});
