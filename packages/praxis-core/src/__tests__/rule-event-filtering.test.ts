/**
 * Tests for event-type based rule filtering in `LogicEngine.step()`.
 *
 * `step()` selects rules via the registry's event-type index, so these tests
 * register a mix of catch-all and event-filtered rules and assert that only
 * the matching rules execute for a given event batch.
 */

import { describe, it, expect } from 'vitest';
import { LogicEngine } from '../engine.js';
import { PraxisRegistry } from '../rules.js';
import type { RuleDescriptor } from '../rules.js';

/**
 * Build an engine over the given rules and a shared `executed` log that each
 * rule appends its id to when it runs.
 */
function engineWithRules(rules: RuleDescriptor[]) {
  // compliance off — these fixtures intentionally omit full contracts.
  const registry = new PraxisRegistry({ compliance: { enabled: false } });
  for (const r of rules) registry.registerRule(r);
  return new LogicEngine({ initialContext: {}, registry, factDedup: 'none' });
}

function makeRules(executed: string[]): RuleDescriptor[] {
  const record = (id: string): RuleDescriptor => ({
    id,
    description: id,
    impl: () => {
      executed.push(id);
      return [];
    },
  });

  return [
    record('catch-all-a'),
    { ...record('single-tag'), eventTypes: 'note.update' },
    { ...record('multi-tag'), eventTypes: ['sprint.update', 'note.update'] },
    { ...record('other-tag'), eventTypes: ['task.update'] },
    record('catch-all-b'),
  ];
}

describe('LogicEngine.step() rule event filtering', () => {
  it('runs catch-all rules plus only rules matching the batch tags', () => {
    const executed: string[] = [];
    const engine = engineWithRules(makeRules(executed));

    engine.step([{ tag: 'note.update', payload: {} }]);

    expect(executed).toEqual(['catch-all-a', 'catch-all-b', 'single-tag', 'multi-tag']);
  });

  it('runs a rule declaring multiple event types when any tag matches', () => {
    const executed: string[] = [];
    const engine = engineWithRules(makeRules(executed));

    engine.step([{ tag: 'sprint.update', payload: {} }]);

    expect(executed).toEqual(['catch-all-a', 'catch-all-b', 'multi-tag']);
  });

  it('runs matching rules exactly once for a batch with repeated/overlapping tags', () => {
    const executed: string[] = [];
    const engine = engineWithRules(makeRules(executed));

    engine.step([
      { tag: 'note.update', payload: {} },
      { tag: 'note.update', payload: {} },
      { tag: 'sprint.update', payload: {} },
    ]);

    expect(executed).toEqual(['catch-all-a', 'catch-all-b', 'single-tag', 'multi-tag']);
  });

  it('runs only catch-all rules when no filtered rule matches', () => {
    const executed: string[] = [];
    const engine = engineWithRules(makeRules(executed));

    engine.step([{ tag: 'unrelated.event', payload: {} }]);

    expect(executed).toEqual(['catch-all-a', 'catch-all-b']);
  });

  it('runs only catch-all rules for an empty event batch', () => {
    const executed: string[] = [];
    const engine = engineWithRules(makeRules(executed));

    engine.step([]);

    expect(executed).toEqual(['catch-all-a', 'catch-all-b']);
  });

  it('emits facts only from the rules that matched the batch', () => {
    const registry = new PraxisRegistry({ compliance: { enabled: false } });
    registry.registerRule({
      id: 'note-rule',
      description: 'emits on note.update',
      eventTypes: ['note.update'],
      impl: () => [{ tag: 'note.fact', payload: 1 }],
    });
    registry.registerRule({
      id: 'task-rule',
      description: 'emits on task.update',
      eventTypes: ['task.update'],
      impl: () => [{ tag: 'task.fact', payload: 1 }],
    });
    const engine = new LogicEngine({ initialContext: {}, registry, factDedup: 'none' });

    const result = engine.step([{ tag: 'note.update', payload: {} }]);

    expect(result.state.facts.map((f) => f.tag)).toEqual(['note.fact']);
  });

  it('still filters by eventTypes when rules are supplied via stepWithConfig()', () => {
    const executed: string[] = [];
    const rules = makeRules(executed);
    const registry = new PraxisRegistry({ compliance: { enabled: false } });
    for (const r of rules) registry.registerRule(r);
    const engine = new LogicEngine({ initialContext: {}, registry, factDedup: 'none' });

    engine.stepWithConfig([{ tag: 'note.update', payload: {} }], {
      ruleIds: registry.getRuleIds(),
      constraintIds: registry.getConstraintIds(),
    });

    expect(executed).toEqual(['catch-all-a', 'single-tag', 'multi-tag', 'catch-all-b']);
  });
});
