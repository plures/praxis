/**
 * Praxis Unified Reactive Layer — Tests
 *
 * Tests that the unified API works end-to-end:
 * - Schema → query() → subscribe → reactive updates
 * - mutate() → constraint check → rule evaluation → fact emission
 * - Liveness detection
 * - Batch mutations
 * - Timeline logging
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createApp,
  definePath,
  defineRule,
  defineConstraint,
  RuleResult,
  fact,
} from '../index.js';

// ── Test Schema ─────────────────────────────────────────────────────────────

interface SprintInfo {
  name: string;
  currentDay: number;
  totalDays: number;
  completedHours: number;
  totalHours: number;
}

const Sprint = definePath<SprintInfo | null>('sprint/current', null);
const Loading = definePath<boolean>('sprint/loading', false);
const Items = definePath<Array<{ id: number; state: string; completedWork: number }>>('sprint/items', []);

// ── Test Rules ──────────────────────────────────────────────────────────────

const sprintBehindRule = defineRule({
  id: 'sprint.behind',
  watch: ['sprint/current'],
  evaluate: (values) => {
    const sprint = values['sprint/current'] as SprintInfo | null;
    if (!sprint) return RuleResult.skip('No sprint');
    const pace = sprint.currentDay / sprint.totalDays;
    const work = sprint.completedHours / sprint.totalHours;
    if (work >= pace) return RuleResult.retract(['sprint.behind']);
    return RuleResult.emit([fact('sprint.behind', { pace, work })]);
  },
});

const loadingRule = defineRule({
  id: 'sprint.loading-check',
  watch: ['sprint/loading', 'sprint/current'],
  evaluate: (values) => {
    const loading = values['sprint/loading'] as boolean;
    const sprint = values['sprint/current'];
    if (loading && !sprint) {
      return RuleResult.emit([fact('sprint.still-loading', { since: Date.now() })]);
    }
    return RuleResult.retract(['sprint.still-loading']);
  },
});

// ── Test Constraints ────────────────────────────────────────────────────────

const noCloseWithoutHours = defineConstraint({
  id: 'no-close-without-hours',
  description: 'Cannot have closed items with 0 completed hours',
  watch: ['sprint/items'],
  validate: (values) => {
    const items = (values['sprint/items'] ?? []) as Array<{ id: number; state: string; completedWork: number }>;
    const bad = items.find(i => i.state === 'Closed' && !i.completedWork);
    if (bad) return `Item #${bad.id} cannot be closed with 0 completed hours`;
    return true;
  },
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Unified Reactive Layer', () => {
  describe('createApp', () => {
    it('creates an app with schema', () => {
      const app = createApp({
        name: 'test',
        schema: [Sprint, Loading, Items],
      });
      expect(app).toBeDefined();
      expect(app.query).toBeTypeOf('function');
      expect(app.mutate).toBeTypeOf('function');
      app.destroy();
    });
  });

  describe('query()', () => {
    it('returns initial value from schema', () => {
      const app = createApp({ name: 'test', schema: [Sprint, Loading] });
      const sprint = app.query<SprintInfo | null>('sprint/current');
      expect(sprint.current).toBeNull();
      app.destroy();
    });

    it('is Svelte store compatible (subscribe with immediate callback)', () => {
      const app = createApp({ name: 'test', schema: [Loading] });
      const loading = app.query<boolean>('sprint/loading');
      const values: boolean[] = [];
      const unsub = loading.subscribe(v => values.push(v));
      // Immediate callback on subscribe
      expect(values).toEqual([false]);
      unsub();
      app.destroy();
    });

    it('updates reactively on mutate', () => {
      const app = createApp({ name: 'test', schema: [Sprint, Loading] });
      const sprint = app.query<SprintInfo | null>('sprint/current');
      const values: Array<SprintInfo | null> = [];
      const unsub = sprint.subscribe(v => values.push(v));

      // Initial
      expect(values.length).toBe(1);
      expect(values[0]).toBeNull();

      // Mutate
      const data: SprintInfo = { name: 'Sprint 1', currentDay: 3, totalDays: 10, completedHours: 5, totalHours: 20 };
      app.mutate('sprint/current', data);

      expect(values.length).toBe(2);
      expect(values[1]).toEqual(data);
      expect(sprint.current).toEqual(data);

      unsub();
      app.destroy();
    });

    it('supports query options (where, sort, limit)', () => {
      const app = createApp({ name: 'test', schema: [Items] });
      const activeItems = app.query<Array<{ id: number; state: string; completedWork: number }>>('sprint/items', {
        where: (item) => item.state === 'Active',
        sort: (a, b) => a.id - b.id,
        limit: 2,
      });

      app.mutate('sprint/items', [
        { id: 3, state: 'Active', completedWork: 1 },
        { id: 1, state: 'Active', completedWork: 0 },
        { id: 2, state: 'Closed', completedWork: 5 },
        { id: 4, state: 'Active', completedWork: 2 },
      ]);

      expect(activeItems.current).toEqual([
        { id: 1, state: 'Active', completedWork: 0 },
        { id: 3, state: 'Active', completedWork: 1 },
      ]);
      app.destroy();
    });
  });

  describe('mutate()', () => {
    it('returns accepted: true when no constraints violated', () => {
      const app = createApp({ name: 'test', schema: [Sprint] });
      const result = app.mutate('sprint/current', { name: 'Sprint 1', currentDay: 1, totalDays: 10, completedHours: 0, totalHours: 20 });
      expect(result.accepted).toBe(true);
      expect(result.violations).toEqual([]);
      app.destroy();
    });

    it('rejects mutation when constraint violated', () => {
      const app = createApp({
        name: 'test',
        schema: [Items],
        constraints: [noCloseWithoutHours],
      });

      const result = app.mutate('sprint/items', [
        { id: 1, state: 'Closed', completedWork: 0 },
      ]);

      expect(result.accepted).toBe(false);
      expect(result.violations.length).toBe(1);
      expect(result.violations[0].message).toContain('Item #1');

      // Value should NOT have been written
      const items = app.query('sprint/items');
      expect(items.current).toEqual([]);

      app.destroy();
    });

    it('triggers rule evaluation', () => {
      const app = createApp({
        name: 'test',
        schema: [Sprint],
        rules: [sprintBehindRule],
      });

      // Behind: day 5/10 but only 2/20 hours done
      app.mutate('sprint/current', {
        name: 'Sprint 1',
        currentDay: 5,
        totalDays: 10,
        completedHours: 2,
        totalHours: 20,
      });

      const facts = app.facts();
      expect(facts.some(f => f.tag === 'sprint.behind')).toBe(true);

      // On pace: day 5/10, 12/20 hours done
      app.mutate('sprint/current', {
        name: 'Sprint 1',
        currentDay: 5,
        totalDays: 10,
        completedHours: 12,
        totalHours: 20,
      });

      const factsAfter = app.facts();
      expect(factsAfter.some(f => f.tag === 'sprint.behind')).toBe(false);

      app.destroy();
    });
  });

  describe('batch()', () => {
    it('applies multiple mutations atomically', () => {
      const app = createApp({
        name: 'test',
        schema: [Sprint, Loading],
        rules: [loadingRule],
      });

      const values: Array<SprintInfo | null> = [];
      const sprintRef = app.query<SprintInfo | null>('sprint/current');
      sprintRef.subscribe(v => values.push(v));

      const result = app.batch((m) => {
        m('sprint/loading', true);
        m('sprint/current', { name: 'Sprint 1', currentDay: 1, totalDays: 10, completedHours: 0, totalHours: 20 });
      });

      expect(result.accepted).toBe(true);
      // Sprint was set
      expect(sprintRef.current).toEqual({ name: 'Sprint 1', currentDay: 1, totalDays: 10, completedHours: 0, totalHours: 20 });

      app.destroy();
    });

    it('rejects entire batch on constraint violation', () => {
      const app = createApp({
        name: 'test',
        schema: [Sprint, Items],
        constraints: [noCloseWithoutHours],
      });

      const result = app.batch((m) => {
        m('sprint/current', { name: 'Sprint 1', currentDay: 1, totalDays: 10, completedHours: 0, totalHours: 20 });
        m('sprint/items', [{ id: 1, state: 'Closed', completedWork: 0 }]);
      });

      expect(result.accepted).toBe(false);
      // Neither mutation should have been applied
      expect(app.query('sprint/current').current).toBeNull();

      app.destroy();
    });
  });

  describe('timeline', () => {
    it('records mutations', () => {
      const app = createApp({ name: 'test', schema: [Loading] });
      app.mutate('sprint/loading', true);
      app.mutate('sprint/loading', false);

      const tl = app.timeline();
      const mutations = tl.filter(e => e.kind === 'mutation');
      expect(mutations.length).toBe(2);
      expect(mutations[0].path).toBe('sprint/loading');
      expect(mutations[0].data.before).toBe(false);
      expect(mutations[0].data.after).toBe(true);

      app.destroy();
    });

    it('records rule evaluations', () => {
      const app = createApp({
        name: 'test',
        schema: [Sprint],
        rules: [sprintBehindRule],
      });

      app.mutate('sprint/current', { name: 'Sprint 1', currentDay: 5, totalDays: 10, completedHours: 2, totalHours: 20 });

      const tl = app.timeline();
      const ruleEvals = tl.filter(e => e.kind === 'rule-eval');
      expect(ruleEvals.some(e => e.data.ruleId === 'sprint.behind')).toBe(true);

      app.destroy();
    });
  });

  describe('liveness', () => {
    it('detects stale paths', async () => {
      const staleCb = vi.fn();

      const app = createApp({
        name: 'test',
        schema: [Sprint, Loading],
        liveness: {
          expect: ['sprint/current'],
          timeoutMs: 50,
          onStale: staleCb,
        },
      });

      // Don't mutate sprint/current — it should go stale
      await new Promise(r => setTimeout(r, 100));

      expect(staleCb).toHaveBeenCalledWith('sprint/current', expect.any(Number));

      const status = app.liveness();
      expect(status['sprint/current'].stale).toBe(true);

      app.destroy();
    });

    it('does NOT flag paths that were updated', async () => {
      const staleCb = vi.fn();

      const app = createApp({
        name: 'test',
        schema: [Sprint],
        liveness: {
          expect: ['sprint/current'],
          timeoutMs: 100,
          onStale: staleCb,
        },
      });

      // Update immediately
      app.mutate('sprint/current', { name: 'Sprint 1', currentDay: 1, totalDays: 10, completedHours: 0, totalHours: 20 });

      await new Promise(r => setTimeout(r, 150));

      // onStale should NOT have been called
      expect(staleCb).not.toHaveBeenCalled();

      app.destroy();
    });
  });

  describe('multiple subscribers', () => {
    it('notifies all subscribers independently', () => {
      const app = createApp({ name: 'test', schema: [Loading] });

      const values1: boolean[] = [];
      const values2: boolean[] = [];

      const ref1 = app.query<boolean>('sprint/loading');
      const ref2 = app.query<boolean>('sprint/loading');

      const unsub1 = ref1.subscribe(v => values1.push(v));
      const unsub2 = ref2.subscribe(v => values2.push(v));

      app.mutate('sprint/loading', true);

      expect(values1).toEqual([false, true]);
      expect(values2).toEqual([false, true]);

      unsub1();
      app.mutate('sprint/loading', false);

      // Only ref2 should get the update
      expect(values1).toEqual([false, true]);
      expect(values2).toEqual([false, true, false]);

      unsub2();
      app.destroy();
    });
  });

  describe('destroy', () => {
    it('cleans up all state', () => {
      const app = createApp({
        name: 'test',
        schema: [Sprint, Loading, Items],
        rules: [sprintBehindRule],
      });

      app.mutate('sprint/current', { name: 'Sprint 1', currentDay: 1, totalDays: 10, completedHours: 0, totalHours: 20 });
      app.destroy();

      expect(app.facts()).toEqual([]);
      expect(app.timeline()).toEqual([]);
    });
  });
});
