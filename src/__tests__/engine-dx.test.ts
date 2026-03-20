/**
 * Tests for engine DX improvements:
 *   1. eventTypes filter on RuleDescriptor
 *   2. Atomic stepWithContext()
 *   3. Fact deduplication + maxFacts
 *   4. checkConstraints() convenience method
 *   5. defineRule/defineModule type inference helpers
 */
import { describe, it, expect } from 'vitest';
import { createPraxisEngine, PraxisRegistry, type PraxisFact, type PraxisEvent } from '../index.js';
import type { RuleDescriptor, ConstraintDescriptor, PraxisModule } from '../core/rules.js';
import { defineRule, defineConstraint, defineModule } from '../dsl/index.js';

interface TestContext {
  count: number;
  name: string;
  items: string[];
}

// ─── 1. eventTypes filter ──────────────────────────────────────────────────

describe('eventTypes filter', () => {
  it('rule with eventTypes only fires on matching events', () => {
    const registry = new PraxisRegistry<TestContext>();
    registry.registerRule({
      id: 'count-rule',
      description: 'Only fires on count.increment',
      eventTypes: 'count.increment',
      impl: (state) => [{ tag: 'count.incremented', payload: { count: state.context.count } }],
    });
    registry.registerRule({
      id: 'catch-all',
      description: 'Fires on everything',
      impl: () => [{ tag: 'catch-all.fired', payload: {} }],
    });

    const engine = createPraxisEngine<TestContext>({
      initialContext: { count: 1, name: 'test', items: [] },
      registry,
    });

    // Fire unrelated event — only catch-all should fire
    const r1 = engine.step([{ tag: 'name.changed', payload: {} }]);
    const tags1 = r1.state.facts.map(f => f.tag);
    expect(tags1).toContain('catch-all.fired');
    expect(tags1).not.toContain('count.incremented');

    // Fire matching event — both should fire
    engine.clearFacts();
    const r2 = engine.step([{ tag: 'count.increment', payload: {} }]);
    const tags2 = r2.state.facts.map(f => f.tag);
    expect(tags2).toContain('catch-all.fired');
    expect(tags2).toContain('count.incremented');
  });

  it('rule with eventTypes array matches any of the listed tags', () => {
    const registry = new PraxisRegistry<TestContext>();
    registry.registerRule({
      id: 'multi-event',
      description: 'Fires on count.increment or count.decrement',
      eventTypes: ['count.increment', 'count.decrement'],
      impl: () => [{ tag: 'multi.fired', payload: {} }],
    });

    const engine = createPraxisEngine<TestContext>({
      initialContext: { count: 0, name: '', items: [] },
      registry,
    });

    // Match first
    let r = engine.step([{ tag: 'count.increment', payload: {} }]);
    expect(r.state.facts.some(f => f.tag === 'multi.fired')).toBe(true);

    engine.clearFacts();

    // Match second
    r = engine.step([{ tag: 'count.decrement', payload: {} }]);
    expect(r.state.facts.some(f => f.tag === 'multi.fired')).toBe(true);

    engine.clearFacts();

    // No match
    r = engine.step([{ tag: 'other.event', payload: {} }]);
    expect(r.state.facts.some(f => f.tag === 'multi.fired')).toBe(false);
  });

  it('empty events array skips rules with eventTypes', () => {
    const registry = new PraxisRegistry<TestContext>();
    registry.registerRule({
      id: 'filtered-rule',
      description: 'Needs specific event',
      eventTypes: 'specific.event',
      impl: () => [{ tag: 'filtered.fired', payload: {} }],
    });

    const engine = createPraxisEngine<TestContext>({
      initialContext: { count: 0, name: '', items: [] },
      registry,
    });

    const r = engine.step([]);
    expect(r.state.facts).toHaveLength(0);
  });
});

// ─── 2. Atomic stepWithContext ──────────────────────────────────────────────

describe('stepWithContext', () => {
  it('updates context before rules evaluate', () => {
    const registry = new PraxisRegistry<TestContext>();
    registry.registerRule({
      id: 'check-context',
      description: 'Reads context.count',
      impl: (state) => {
        // This should see the UPDATED count, not the old one
        return [{ tag: 'seen-count', payload: { count: state.context.count } }];
      },
    });

    const engine = createPraxisEngine<TestContext>({
      initialContext: { count: 0, name: '', items: [] },
      registry,
    });

    const result = engine.stepWithContext(
      (ctx) => ({ ...ctx, count: 42 }),
      [{ tag: 'test', payload: {} }]
    );

    const seenFact = result.state.facts.find(f => f.tag === 'seen-count');
    expect(seenFact).toBeDefined();
    expect((seenFact!.payload as any).count).toBe(42);
  });

  it('returns proper diagnostics from constraints', () => {
    const registry = new PraxisRegistry<TestContext>();
    registry.registerConstraint({
      id: 'max-count',
      description: 'Count must be <= 100',
      impl: (state) => state.context.count <= 100 ? true : `Count too high: ${state.context.count}`,
    });

    const engine = createPraxisEngine<TestContext>({
      initialContext: { count: 0, name: '', items: [] },
      registry,
    });

    const result = engine.stepWithContext(
      (ctx) => ({ ...ctx, count: 200 }),
      [{ tag: 'test', payload: {} }]
    );

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].message).toContain('200');
  });
});

// ─── 3. Fact deduplication ─────────────────────────────────────────────────

describe('fact deduplication', () => {
  it('last-write-wins deduplicates by tag (default)', () => {
    const registry = new PraxisRegistry<TestContext>();
    registry.registerRule({
      id: 'counter',
      description: 'Emits count fact',
      impl: (state) => [{ tag: 'current-count', payload: { value: state.context.count } }],
    });

    const engine = createPraxisEngine<TestContext>({
      initialContext: { count: 1, name: '', items: [] },
      registry,
      // default factDedup is 'last-write-wins'
    });

    engine.step([{ tag: 'tick', payload: {} }]);
    engine.updateContext(ctx => ({ ...ctx, count: 2 }));
    engine.step([{ tag: 'tick', payload: {} }]);
    engine.updateContext(ctx => ({ ...ctx, count: 3 }));
    engine.step([{ tag: 'tick', payload: {} }]);

    const facts = engine.getFacts();
    const countFacts = facts.filter(f => f.tag === 'current-count');
    // Should only have ONE current-count fact (the latest)
    expect(countFacts).toHaveLength(1);
    expect((countFacts[0].payload as any).value).toBe(3);
  });

  it('none mode accumulates all facts', () => {
    const registry = new PraxisRegistry<TestContext>();
    registry.registerRule({
      id: 'counter',
      description: 'Emits count fact',
      impl: (state) => [{ tag: 'current-count', payload: { value: state.context.count } }],
    });

    const engine = createPraxisEngine<TestContext>({
      initialContext: { count: 1, name: '', items: [] },
      registry,
      factDedup: 'none',
    });

    engine.step([{ tag: 'tick', payload: {} }]);
    engine.updateContext(ctx => ({ ...ctx, count: 2 }));
    engine.step([{ tag: 'tick', payload: {} }]);

    const countFacts = engine.getFacts().filter(f => f.tag === 'current-count');
    expect(countFacts).toHaveLength(2);
  });

  it('maxFacts limits fact accumulation', () => {
    const registry = new PraxisRegistry<TestContext>();
    registry.registerRule({
      id: 'emitter',
      description: 'Emits unique fact each step',
      impl: (state) => [{ tag: `fact-${state.context.count}`, payload: {} }],
    });

    const engine = createPraxisEngine<TestContext>({
      initialContext: { count: 0, name: '', items: [] },
      registry,
      factDedup: 'none',
      maxFacts: 5,
    });

    for (let i = 0; i < 10; i++) {
      engine.updateContext(ctx => ({ ...ctx, count: i }));
      engine.step([{ tag: 'tick', payload: {} }]);
    }

    expect(engine.getFacts().length).toBeLessThanOrEqual(5);
  });
});

// ─── 4. checkConstraints convenience ───────────────────────────────────────

describe('checkConstraints', () => {
  it('returns empty array when all constraints pass', () => {
    const registry = new PraxisRegistry<TestContext>();
    registry.registerConstraint({
      id: 'positive-count',
      description: 'Count must be positive',
      impl: (state) => state.context.count >= 0,
    });

    const engine = createPraxisEngine<TestContext>({
      initialContext: { count: 5, name: '', items: [] },
      registry,
    });

    expect(engine.checkConstraints()).toHaveLength(0);
  });

  it('returns violations without running rules', () => {
    const registry = new PraxisRegistry<TestContext>();
    let ruleRan = false;
    registry.registerRule({
      id: 'side-effect-detector',
      description: 'Should NOT run during checkConstraints',
      impl: () => {
        ruleRan = true;
        return [{ tag: 'should-not-appear', payload: {} }];
      },
    });
    registry.registerConstraint({
      id: 'has-name',
      description: 'Name must not be empty',
      impl: (state) => state.context.name.length > 0 ? true : 'Name is empty',
    });

    const engine = createPraxisEngine<TestContext>({
      initialContext: { count: 0, name: '', items: [] },
      registry,
    });

    const violations = engine.checkConstraints();
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toBe('Name is empty');
    expect(ruleRan).toBe(false);
    expect(engine.getFacts().some(f => f.tag === 'should-not-appear')).toBe(false);
  });
});

// ─── 5. Type inference helpers ─────────────────────────────────────────────

describe('type inference helpers', () => {
  it('defineRule preserves eventTypes', () => {
    const rule = defineRule<TestContext>({
      id: 'typed-rule',
      description: 'A typed rule with event filter',
      eventTypes: ['sprint.update'],
      impl: (state, _events) => {
        // TypeScript should infer state.context as TestContext here
        const _count: number = state.context.count;
        return [];
      },
    });

    expect(rule.id).toBe('typed-rule');
    expect(rule.eventTypes).toEqual(['sprint.update']);
  });

  it('defineModule bundles rules and constraints with proper types', () => {
    const mod = defineModule<TestContext>({
      rules: [
        {
          id: 'mod-rule',
          description: 'Module rule',
          eventTypes: 'test.event',
          impl: (state) => [{ tag: 'mod-fact', payload: { count: state.context.count } }],
        },
      ],
      constraints: [
        {
          id: 'mod-constraint',
          description: 'Module constraint',
          impl: (state) => state.context.count >= 0,
        },
      ],
    });

    expect(mod.rules).toHaveLength(1);
    expect(mod.constraints).toHaveLength(1);
    expect(mod.rules[0].eventTypes).toBe('test.event');
  });

  it('defineRule + PraxisRegistry.registerModule round-trips correctly', () => {
    const mod = defineModule<TestContext>({
      rules: [
        {
          id: 'round-trip',
          description: 'Test',
          eventTypes: ['a', 'b'],
          impl: () => [{ tag: 'ok', payload: {} }],
        },
      ],
      constraints: [],
    });

    const registry = new PraxisRegistry<TestContext>();
    registry.registerModule(mod);

    const engine = createPraxisEngine<TestContext>({
      initialContext: { count: 0, name: '', items: [] },
      registry,
    });

    // Should NOT fire on unmatched event
    let r = engine.step([{ tag: 'c', payload: {} }]);
    expect(r.state.facts.some(f => f.tag === 'ok')).toBe(false);

    // Should fire on matched event
    r = engine.step([{ tag: 'a', payload: {} }]);
    expect(r.state.facts.some(f => f.tag === 'ok')).toBe(true);
  });
});
