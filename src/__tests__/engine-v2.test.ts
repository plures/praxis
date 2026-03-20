/**
 * Tests for Praxis v2 engine improvements:
 *   1. RuleResult typed returns (no empty arrays)
 *   2. state.events passthrough
 *   3. RuleResult.retract() for fact retraction
 *   4. UI rules module
 *   5. RuleResult.noop/skip tracing
 */
import { describe, it, expect } from 'vitest';
import {
  createPraxisEngine,
  PraxisRegistry,
  RuleResult,
  fact,
  uiModule,
  createUIModule,
  uiStateChanged,
} from '../index.js';
import type { RuleDescriptor } from '../core/rules.js';
import type { UIContext } from '../core/ui-rules.js';

interface TestContext {
  count: number;
  name: string;
  active: boolean;
}

// ─── 1. RuleResult typed returns ────────────────────────────────────────────

describe('RuleResult', () => {
  it('emit() requires at least one fact', () => {
    expect(() => RuleResult.emit([])).toThrow('RuleResult.emit() requires at least one fact');
  });

  it('emit() creates a result with facts', () => {
    const result = RuleResult.emit([fact('test.fact', { value: 42 })]);
    expect(result.kind).toBe('emit');
    expect(result.hasFacts).toBe(true);
    expect(result.facts).toHaveLength(1);
    expect(result.facts[0].tag).toBe('test.fact');
  });

  it('noop() creates a traceable no-op', () => {
    const result = RuleResult.noop('Nothing to report');
    expect(result.kind).toBe('noop');
    expect(result.hasFacts).toBe(false);
    expect(result.reason).toBe('Nothing to report');
  });

  it('skip() creates a traceable skip', () => {
    const result = RuleResult.skip('Precondition not met');
    expect(result.kind).toBe('skip');
    expect(result.hasFacts).toBe(false);
    expect(result.reason).toBe('Precondition not met');
  });

  it('retract() requires at least one tag', () => {
    expect(() => RuleResult.retract([])).toThrow('RuleResult.retract() requires at least one tag');
  });

  it('retract() creates a retraction result', () => {
    const result = RuleResult.retract(['sprint.behind'], 'Sprint caught up');
    expect(result.kind).toBe('retract');
    expect(result.hasRetractions).toBe(true);
    expect(result.retractTags).toEqual(['sprint.behind']);
  });
});

// ─── 2. state.events passthrough ────────────────────────────────────────────

describe('state.events passthrough', () => {
  it('rules can access events via state.events', () => {
    const registry = new PraxisRegistry<TestContext>();
    let capturedEvents: any[] = [];

    registry.registerRule({
      id: 'event-reader',
      description: 'Reads events from state',
      impl: (state, _events) => {
        capturedEvents = state.events ?? [];
        return RuleResult.emit([fact('events.read', { count: capturedEvents.length })]);
      },
    });

    const engine = createPraxisEngine<TestContext>({
      initialContext: { count: 0, name: '', active: false },
      registry,
    });

    const events = [
      { tag: 'test.event', payload: { value: 'hello' } },
      { tag: 'other.event', payload: { value: 42 } },
    ];

    engine.step(events);

    expect(capturedEvents).toHaveLength(2);
    expect(capturedEvents[0].tag).toBe('test.event');
    expect(capturedEvents[0].payload).toEqual({ value: 'hello' });
    expect(capturedEvents[1].tag).toBe('other.event');
    expect(capturedEvents[1].payload).toEqual({ value: 42 });
  });

  it('state.events matches the events parameter exactly', () => {
    const registry = new PraxisRegistry<TestContext>();
    let stateEventsRef: any;
    let paramEventsRef: any;

    registry.registerRule({
      id: 'compare-refs',
      description: 'Compares state.events to events param',
      impl: (state, events) => {
        stateEventsRef = state.events;
        paramEventsRef = events;
        return RuleResult.noop();
      },
    });

    const engine = createPraxisEngine<TestContext>({
      initialContext: { count: 0, name: '', active: false },
      registry,
    });

    engine.step([{ tag: 'sync.complete', payload: { updated: 3, errors: 0 } }]);

    // state.events and events param should be the same array
    expect(stateEventsRef).toBe(paramEventsRef);
  });

  it('event payload data is preserved through the pipeline', () => {
    const registry = new PraxisRegistry<TestContext>();

    registry.registerRule({
      id: 'sync-classifier',
      description: 'Classifies sync results from event data',
      eventTypes: 'sync.complete',
      impl: (state) => {
        const syncEvent = state.events?.find(e => e.tag === 'sync.complete');
        if (!syncEvent) return RuleResult.skip('No sync event');

        const payload = syncEvent.payload as { updated: number; errors: number };
        const severity = payload.errors > 0 ? 'error' : payload.updated > 0 ? 'success' : 'info';

        return RuleResult.emit([fact('sync.outcome', {
          severity,
          updated: payload.updated,
          errors: payload.errors,
        })]);
      },
    });

    const engine = createPraxisEngine<TestContext>({
      initialContext: { count: 0, name: '', active: false },
      registry,
    });

    engine.step([{ tag: 'sync.complete', payload: { updated: 3, errors: 1 } }]);

    const outcome = engine.getFacts().find(f => f.tag === 'sync.outcome');
    expect(outcome).toBeDefined();
    expect((outcome!.payload as any).severity).toBe('error');
    expect((outcome!.payload as any).updated).toBe(3);
  });
});

// ─── 3. RuleResult retraction ───────────────────────────────────────────────

describe('fact retraction', () => {
  it('RuleResult.retract() removes existing facts by tag', () => {
    const registry = new PraxisRegistry<TestContext>();

    registry.registerRule({
      id: 'behind-checker',
      description: 'Checks if behind, retracts when caught up',
      impl: (state) => {
        if (state.context.count < 5) {
          return RuleResult.emit([fact('behind', { count: state.context.count })]);
        }
        return RuleResult.retract(['behind'], 'Caught up');
      },
    });

    const engine = createPraxisEngine<TestContext>({
      initialContext: { count: 2, name: '', active: false },
      registry,
    });

    // First step: behind
    engine.step([{ tag: 'tick', payload: {} }]);
    expect(engine.getFacts().some(f => f.tag === 'behind')).toBe(true);

    // Update: caught up
    engine.updateContext(ctx => ({ ...ctx, count: 10 }));
    engine.step([{ tag: 'tick', payload: {} }]);
    expect(engine.getFacts().some(f => f.tag === 'behind')).toBe(false);
  });

  it('retraction removes multiple tags at once', () => {
    const registry = new PraxisRegistry<TestContext>();

    registry.registerRule({
      id: 'multi-emitter',
      description: 'Emits multiple facts',
      eventTypes: 'init',
      impl: () => RuleResult.emit([
        fact('fact.a', {}),
        fact('fact.b', {}),
        fact('fact.c', {}),
      ]),
    });

    registry.registerRule({
      id: 'multi-retractor',
      description: 'Retracts a and c',
      eventTypes: 'retract',
      impl: () => RuleResult.retract(['fact.a', 'fact.c']),
    });

    const engine = createPraxisEngine<TestContext>({
      initialContext: { count: 0, name: '', active: false },
      registry,
    });

    engine.step([{ tag: 'init', payload: {} }]);
    expect(engine.getFacts().map(f => f.tag).sort()).toEqual(['fact.a', 'fact.b', 'fact.c']);

    engine.step([{ tag: 'retract', payload: {} }]);
    expect(engine.getFacts().map(f => f.tag)).toEqual(['fact.b']);
  });
});

// ─── 4. RuleResult backward compatibility ───────────────────────────────────

describe('backward compatibility', () => {
  it('legacy PraxisFact[] return still works', () => {
    const registry = new PraxisRegistry<TestContext>();

    registry.registerRule({
      id: 'legacy-rule',
      description: 'Returns plain array (legacy)',
      impl: (state) => [{ tag: 'legacy.fact', payload: { count: state.context.count } }],
    });

    const engine = createPraxisEngine<TestContext>({
      initialContext: { count: 42, name: '', active: false },
      registry,
    });

    engine.step([{ tag: 'test', payload: {} }]);
    const facts = engine.getFacts();
    expect(facts.some(f => f.tag === 'legacy.fact')).toBe(true);
    expect((facts.find(f => f.tag === 'legacy.fact')!.payload as any).count).toBe(42);
  });

  it('mixed RuleResult and legacy rules work together', () => {
    const registry = new PraxisRegistry<TestContext>();

    registry.registerRule({
      id: 'new-style',
      description: 'Uses RuleResult',
      impl: () => RuleResult.emit([fact('new.fact', {})]),
    });

    registry.registerRule({
      id: 'old-style',
      description: 'Returns array',
      impl: () => [{ tag: 'old.fact', payload: {} }],
    });

    const engine = createPraxisEngine<TestContext>({
      initialContext: { count: 0, name: '', active: false },
      registry,
    });

    engine.step([{ tag: 'test', payload: {} }]);
    const tags = engine.getFacts().map(f => f.tag).sort();
    expect(tags).toEqual(['new.fact', 'old.fact']);
  });
});

// ─── 5. Noop/skip diagnostics ───────────────────────────────────────────────

describe('noop/skip diagnostics', () => {
  it('noop with reason appears in diagnostics', () => {
    const registry = new PraxisRegistry<TestContext>();

    registry.registerRule({
      id: 'maybe-rule',
      description: 'Sometimes noops',
      impl: () => RuleResult.noop('Nothing interesting happening'),
    });

    const engine = createPraxisEngine<TestContext>({
      initialContext: { count: 0, name: '', active: false },
      registry,
    });

    const result = engine.step([{ tag: 'test', payload: {} }]);
    const trace = result.diagnostics.find(d =>
      d.message.includes('maybe-rule') && d.message.includes('noop')
    );
    expect(trace).toBeDefined();
    expect(trace!.message).toContain('Nothing interesting happening');
  });

  it('skip with reason appears in diagnostics', () => {
    const registry = new PraxisRegistry<TestContext>();

    registry.registerRule({
      id: 'guarded-rule',
      description: 'Skips when inactive',
      impl: (state) => {
        if (!state.context.active) return RuleResult.skip('Inactive');
        return RuleResult.emit([fact('active.signal', {})]);
      },
    });

    const engine = createPraxisEngine<TestContext>({
      initialContext: { count: 0, name: '', active: false },
      registry,
    });

    const result = engine.step([{ tag: 'test', payload: {} }]);
    const trace = result.diagnostics.find(d =>
      d.message.includes('guarded-rule') && d.message.includes('skip')
    );
    expect(trace).toBeDefined();
    expect(trace!.message).toContain('Inactive');
  });
});

// ─── 6. UI Rules Module ────────────────────────────────────────────────────

describe('UI Rules Module', () => {
  it('uiModule has all predefined rules and constraints', () => {
    expect(uiModule.rules).toHaveLength(6);
    expect(uiModule.constraints).toHaveLength(2);

    const ruleIds = uiModule.rules.map(r => r.id);
    expect(ruleIds).toContain('ui/loading-gate');
    expect(ruleIds).toContain('ui/error-display');
    expect(ruleIds).toContain('ui/offline-indicator');
    expect(ruleIds).toContain('ui/dirty-guard');
    expect(ruleIds).toContain('ui/init-gate');
    expect(ruleIds).toContain('ui/viewport-class');
  });

  it('loading gate emits and retracts', () => {
    const registry = new PraxisRegistry<UIContext>();
    registry.registerModule(uiModule as any);

    const engine = createPraxisEngine<UIContext>({
      initialContext: { loading: true, initialized: true },
      registry,
    });

    // Loading → gate active
    engine.step([uiStateChanged()]);
    expect(engine.getFacts().some(f => f.tag === 'ui.loading-gate')).toBe(true);

    // Not loading → gate retracted
    engine.updateContext(ctx => ({ ...ctx, loading: false }));
    engine.step([uiStateChanged()]);
    expect(engine.getFacts().some(f => f.tag === 'ui.loading-gate')).toBe(false);
  });

  it('error display emits and retracts', () => {
    const registry = new PraxisRegistry<UIContext>();
    registry.registerModule(uiModule as any);

    const engine = createPraxisEngine<UIContext>({
      initialContext: { error: 'Network error', initialized: true },
      registry,
    });

    engine.step([uiStateChanged()]);
    const errorFact = engine.getFacts().find(f => f.tag === 'ui.error-display');
    expect(errorFact).toBeDefined();
    expect((errorFact!.payload as any).message).toBe('Network error');

    // Clear error
    engine.updateContext(ctx => ({ ...ctx, error: null }));
    engine.step([uiStateChanged()]);
    expect(engine.getFacts().some(f => f.tag === 'ui.error-display')).toBe(false);
  });

  it('dirty guard signals unsaved changes', () => {
    const registry = new PraxisRegistry<UIContext>();
    registry.registerModule(uiModule as any);

    const engine = createPraxisEngine<UIContext>({
      initialContext: { dirty: true, initialized: true },
      registry,
    });

    engine.step([uiStateChanged()]);
    const unsaved = engine.getFacts().find(f => f.tag === 'ui.unsaved-warning');
    expect(unsaved).toBeDefined();
    expect((unsaved!.payload as any).blocking).toBe(true);
  });

  it('init gate blocks until initialized', () => {
    const registry = new PraxisRegistry<UIContext>();
    registry.registerModule(uiModule as any);

    const engine = createPraxisEngine<UIContext>({
      initialContext: { initialized: false },
      registry,
    });

    engine.step([uiStateChanged()]);
    expect(engine.getFacts().some(f => f.tag === 'ui.init-pending')).toBe(true);

    engine.updateContext(ctx => ({ ...ctx, initialized: true }));
    engine.step([uiStateChanged()]);
    expect(engine.getFacts().some(f => f.tag === 'ui.init-pending')).toBe(false);
  });

  it('createUIModule selects specific rules', () => {
    const custom = createUIModule({
      rules: ['ui/loading-gate', 'ui/dirty-guard'],
      constraints: ['ui/must-be-initialized'],
    });

    expect(custom.rules).toHaveLength(2);
    expect(custom.constraints).toHaveLength(1);
    expect(custom.rules.map(r => r.id)).toEqual(['ui/loading-gate', 'ui/dirty-guard']);
  });

  it('UI rules do not interfere with domain rules', () => {
    const registry = new PraxisRegistry<TestContext & UIContext>();

    // Domain rule
    registry.registerRule({
      id: 'domain/count-check',
      description: 'Business logic',
      impl: (state) => {
        if (state.context.count > 10) {
          return RuleResult.emit([fact('domain.high-count', { count: state.context.count })]);
        }
        return RuleResult.noop();
      },
    });

    // UI rules (separate namespace)
    registry.registerModule(uiModule as any);

    const engine = createPraxisEngine<TestContext & UIContext>({
      initialContext: { count: 20, name: '', active: true, loading: true, initialized: true },
      registry,
    });

    engine.step([uiStateChanged()]);
    const facts = engine.getFacts();

    // Both domain and UI facts coexist
    expect(facts.some(f => f.tag === 'domain.high-count')).toBe(true);
    expect(facts.some(f => f.tag === 'ui.loading-gate')).toBe(true);

    // Domain facts don't have ui. prefix
    const domainFacts = facts.filter(f => !f.tag.startsWith('ui.'));
    const uiFacts = facts.filter(f => f.tag.startsWith('ui.'));
    expect(domainFacts.length).toBeGreaterThan(0);
    expect(uiFacts.length).toBeGreaterThan(0);
  });
});

// ─── 7. Completeness audit in package ───────────────────────────────────────

describe('completeness audit', () => {
  it('auditCompleteness is exported from package', async () => {
    const { auditCompleteness, formatReport } = await import('../index.js');
    expect(typeof auditCompleteness).toBe('function');
    expect(typeof formatReport).toBe('function');
  });

  it('produces correct report', async () => {
    const { auditCompleteness, formatReport } = await import('../index.js');

    const report = auditCompleteness(
      {
        branches: [
          { location: 'app.ts:10', condition: 'if behind', kind: 'domain', coveredBy: 'sprint-behind' },
          { location: 'app.ts:20', condition: 'if blocked', kind: 'domain', coveredBy: null },
          { location: 'app.ts:30', condition: 'if too many', kind: 'invariant', coveredBy: 'max-hours' },
        ],
        stateFields: [
          { source: 'store', field: 'hours', inContext: true, usedByRule: true },
          { source: 'store', field: 'connection', inContext: false, usedByRule: true },
        ],
        transitions: [
          { description: 'Sprint updated', eventTag: 'sprint.update', location: 'store.ts' },
          { description: 'User saved', eventTag: null, location: 'editor.ts' },
        ],
        rulesNeedingContracts: ['sprint-behind', 'blocked-check'],
      },
      ['sprint-behind'],
      ['max-hours'],
      ['sprint-behind'],
    );

    expect(report.score).toBeLessThan(90); // Not complete — missing coverage
    expect(report.rules.covered).toBe(1);
    expect(report.rules.uncovered).toHaveLength(1);
    expect(report.constraints.covered).toBe(1);
    expect(report.context.missing).toHaveLength(1);
    expect(report.events.missing).toHaveLength(1);

    const text = formatReport(report);
    expect(text).toContain('Praxis Completeness');
    expect(text).toContain('domain branches');
  });

  it('strict mode throws on low score', async () => {
    const { auditCompleteness } = await import('../index.js');

    expect(() => auditCompleteness(
      {
        branches: [
          { location: 'a', condition: 'b', kind: 'domain', coveredBy: null },
        ],
        stateFields: [],
        transitions: [],
        rulesNeedingContracts: [],
      },
      [],
      [],
      [],
      { strict: true, threshold: 90 },
    )).toThrow('below threshold');
  });
});
