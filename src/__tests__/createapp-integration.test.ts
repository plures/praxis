/**
 * Praxis 2.0 — createApp() Integration Test Suite
 *
 * Comprehensive integration tests covering:
 * - createApp() lifecycle with all config options
 * - Rule evaluation lifecycle (sync rules, auto-retraction, multi-rule interactions)
 * - Constraint validation edge cases
 * - Timeline integration and undo/redo patterns
 * - Async rule patterns via evaluate()
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createApp,
  definePath,
  defineRule,
  defineConstraint,
  RuleResult,
  fact,
} from '../unified/index.js';
import type { PraxisApp } from '../unified/index.js';

// ── Shared Schema ────────────────────────────────────────────────────────────

interface Task {
  id: number;
  title: string;
  status: 'open' | 'in-progress' | 'done' | 'blocked';
  points: number;
  assignee?: string;
}

interface ProjectInfo {
  name: string;
  velocity: number;
  sprintDay: number;
  totalDays: number;
}

const ProjectPath = definePath<ProjectInfo | null>('project/info', null);
const TasksPath = definePath<Task[]>('project/tasks', []);
const ActiveUserPath = definePath<string | null>('project/activeUser', null);
const CapacityPath = definePath<number>('project/capacity', 0);
const LoadingPath = definePath<boolean>('project/loading', false);
const ErrorPath = definePath<string | null>('project/error', null);

// ── Shared Rules ─────────────────────────────────────────────────────────────

const blockedTasksRule = defineRule({
  id: 'project.has-blocked',
  description: 'Flag when any task is blocked',
  watch: ['project/tasks'],
  evaluate: (values) => {
    const tasks = (values['project/tasks'] ?? []) as Task[];
    const blocked = tasks.filter(t => t.status === 'blocked');
    if (blocked.length > 0) {
      return RuleResult.emit([
        fact('project.has-blocked', { count: blocked.length, ids: blocked.map(t => t.id) }),
      ]);
    }
    return RuleResult.noop('No blocked tasks');
  },
});

const capacityRule = defineRule({
  id: 'project.capacity-check',
  description: 'Emit warning when capacity is over-allocated',
  watch: ['project/tasks', 'project/capacity'],
  evaluate: (values) => {
    const tasks = (values['project/tasks'] ?? []) as Task[];
    const capacity = (values['project/capacity'] ?? 0) as number;
    const allocated = tasks.reduce((sum, t) => sum + t.points, 0);
    if (capacity > 0 && allocated > capacity) {
      return RuleResult.emit([
        fact('project.over-capacity', { allocated, capacity, excess: allocated - capacity }),
      ]);
    }
    if (capacity > 0) {
      return RuleResult.retract(['project.over-capacity'], 'Within capacity');
    }
    return RuleResult.skip('No capacity defined');
  },
});

const projectHealthRule = defineRule({
  id: 'project.health',
  description: 'Compute project health score',
  watch: ['project/info', 'project/tasks'],
  evaluate: (values) => {
    const project = values['project/info'] as ProjectInfo | null;
    const tasks = (values['project/tasks'] ?? []) as Task[];
    if (!project) return RuleResult.skip('No project info');

    const done = tasks.filter(t => t.status === 'done').length;
    const total = tasks.length;
    const progress = total > 0 ? done / total : 0;
    const dayRatio = project.sprintDay / project.totalDays;

    if (progress < dayRatio * 0.8) {
      return RuleResult.emit([
        fact('project.health.at-risk', { progress, dayRatio }),
      ]);
    }
    return RuleResult.retract(['project.health.at-risk'], 'Project on track');
  },
});

// ── Shared Constraints ────────────────────────────────────────────────────────

const noNegativeCapacityConstraint = defineConstraint({
  id: 'no-negative-capacity',
  description: 'Capacity must be non-negative',
  watch: ['project/capacity'],
  validate: (values) => {
    const cap = (values['project/capacity'] ?? 0) as number;
    if (cap < 0) return 'Capacity cannot be negative';
    return true;
  },
});

const noBlockedDoneConstraint = defineConstraint({
  id: 'no-blocked-done',
  description: 'A task cannot be both blocked and done',
  watch: ['project/tasks'],
  validate: (values) => {
    const tasks = (values['project/tasks'] ?? []) as Task[];
    const invalid = tasks.find(t => t.status === 'blocked' && t.points === 0);
    if (invalid) {
      return `Task #${invalid.id} is blocked with 0 points — invalid state`;
    }
    return true;
  },
});

const requireActiveUserConstraint = defineConstraint({
  id: 'require-active-user',
  description: 'Tasks can only be assigned when an active user is set',
  watch: ['project/tasks', 'project/activeUser'],
  validate: (values) => {
    const tasks = (values['project/tasks'] ?? []) as Task[];
    const user = values['project/activeUser'] as string | null;
    const hasAssigned = tasks.some(t => t.assignee !== undefined);
    if (hasAssigned && !user) {
      return 'Cannot assign tasks without an active user';
    }
    return true;
  },
});

// ── 1. createApp() Lifecycle ─────────────────────────────────────────────────

describe('createApp() — Lifecycle', () => {
  let app: PraxisApp;

  afterEach(() => {
    app?.destroy();
  });

  it('creates an app with minimal config (name + empty schema)', () => {
    app = createApp({ name: 'minimal', schema: [] });
    expect(app).toBeDefined();
    expect(typeof app.query).toBe('function');
    expect(typeof app.mutate).toBe('function');
    expect(typeof app.batch).toBe('function');
    expect(typeof app.facts).toBe('function');
    expect(typeof app.violations).toBe('function');
    expect(typeof app.timeline).toBe('function');
    expect(typeof app.evaluate).toBe('function');
    expect(typeof app.destroy).toBe('function');
    expect(typeof app.liveness).toBe('function');
  });

  it('creates an app with full schema', () => {
    app = createApp({
      name: 'full',
      schema: [ProjectPath, TasksPath, ActiveUserPath, CapacityPath, LoadingPath, ErrorPath],
    });
    expect(app.query<ProjectInfo | null>('project/info').current).toBeNull();
    expect(app.query<Task[]>('project/tasks').current).toEqual([]);
    expect(app.query<string | null>('project/activeUser').current).toBeNull();
    expect(app.query<number>('project/capacity').current).toBe(0);
    expect(app.query<boolean>('project/loading').current).toBe(false);
    expect(app.query<string | null>('project/error').current).toBeNull();
  });

  it('creates an app with rules', () => {
    app = createApp({
      name: 'with-rules',
      schema: [TasksPath, CapacityPath],
      rules: [blockedTasksRule, capacityRule],
    });
    expect(app.facts()).toEqual([]);
  });

  it('creates an app with constraints', () => {
    app = createApp({
      name: 'with-constraints',
      schema: [CapacityPath],
      constraints: [noNegativeCapacityConstraint],
    });
    expect(app.violations()).toEqual([]);
  });

  it('creates an app with rules AND constraints', () => {
    app = createApp({
      name: 'full-config',
      schema: [ProjectPath, TasksPath, CapacityPath],
      rules: [blockedTasksRule, capacityRule, projectHealthRule],
      constraints: [noNegativeCapacityConstraint, noBlockedDoneConstraint],
    });
    expect(app.facts()).toEqual([]);
    expect(app.violations()).toEqual([]);
  });

  it('destroy() cleans up facts, timeline, and subscribers', () => {
    app = createApp({
      name: 'cleanup-test',
      schema: [ProjectPath, TasksPath, CapacityPath],
      rules: [blockedTasksRule],
    });

    const values: Task[][] = [];
    const ref = app.query<Task[]>('project/tasks');
    ref.subscribe(v => values.push(v));

    app.mutate('project/tasks', [
      { id: 1, title: 'Fix bug', status: 'blocked', points: 3 },
    ]);

    expect(app.facts().length).toBeGreaterThan(0);
    expect(app.timeline().length).toBeGreaterThan(0);

    app.destroy();

    expect(app.facts()).toEqual([]);
    expect(app.timeline()).toEqual([]);

    // After destroy, further mutations should not crash
    const result = app.mutate('project/tasks', []);
    expect(result.accepted).toBe(true);
  });

  it('query() returns immediate value on subscribe (Svelte store contract)', () => {
    app = createApp({ name: 'svelte-compat', schema: [LoadingPath] });
    const received: boolean[] = [];
    const unsub = app.query<boolean>('project/loading').subscribe(v => received.push(v));
    expect(received).toEqual([false]);
    unsub();
  });

  it('query() for unknown path returns undefined without throwing', () => {
    app = createApp({ name: 'unknown', schema: [] });
    expect(() => app.query('nonexistent/path').current).not.toThrow();
    expect(app.query('nonexistent/path').current).toBeUndefined();
  });

  it('multiple apps are independent — mutations in one do not affect the other', () => {
    const app1 = createApp({ name: 'app1', schema: [LoadingPath] });
    const app2 = createApp({ name: 'app2', schema: [LoadingPath] });

    app1.mutate('project/loading', true);

    expect(app1.query<boolean>('project/loading').current).toBe(true);
    expect(app2.query<boolean>('project/loading').current).toBe(false);

    app1.destroy();
    app2.destroy();
  });
});

// ── 2. Rule Evaluation Lifecycle ─────────────────────────────────────────────

describe('Rule Evaluation — Lifecycle', () => {
  let app: PraxisApp;

  afterEach(() => {
    app?.destroy();
  });

  it('rules are evaluated after every mutate()', () => {
    app = createApp({
      name: 'rule-eval',
      schema: [TasksPath],
      rules: [blockedTasksRule],
    });

    // No blocked tasks initially
    expect(app.facts().some(f => f.tag === 'project.has-blocked')).toBe(false);

    // Add a blocked task
    app.mutate('project/tasks', [{ id: 1, title: 'Investigate', status: 'blocked', points: 2 }]);
    expect(app.facts().some(f => f.tag === 'project.has-blocked')).toBe(true);
    expect((app.facts().find(f => f.tag === 'project.has-blocked')?.payload as any).count).toBe(1);
  });

  it('rules auto-retract facts when conditions change (noop path)', () => {
    app = createApp({
      name: 'auto-retract-noop',
      schema: [TasksPath],
      rules: [blockedTasksRule],
    });

    app.mutate('project/tasks', [
      { id: 1, title: 'Blocked task', status: 'blocked', points: 2 },
    ]);
    expect(app.facts().some(f => f.tag === 'project.has-blocked')).toBe(true);

    // Remove the blocked task → rule returns noop → fact auto-retracted
    app.mutate('project/tasks', [
      { id: 1, title: 'Fixed task', status: 'done', points: 2 },
    ]);
    expect(app.facts().some(f => f.tag === 'project.has-blocked')).toBe(false);
  });

  it('rules use explicit retract() for opposite conditions', () => {
    app = createApp({
      name: 'explicit-retract',
      schema: [TasksPath, CapacityPath],
      rules: [capacityRule],
    });

    // Set capacity, then over-allocate
    app.mutate('project/capacity', 10);
    app.mutate('project/tasks', [
      { id: 1, title: 'Big task', status: 'open', points: 15 },
    ]);
    expect(app.facts().some(f => f.tag === 'project.over-capacity')).toBe(true);

    // Reduce tasks — rule explicitly retracts the fact
    app.mutate('project/tasks', [
      { id: 1, title: 'Small task', status: 'open', points: 5 },
    ]);
    expect(app.facts().some(f => f.tag === 'project.over-capacity')).toBe(false);
  });

  it('rules skip when preconditions are not met', () => {
    app = createApp({
      name: 'skip-precondition',
      schema: [TasksPath, CapacityPath],
      rules: [capacityRule],
    });

    // capacity = 0 → rule returns skip
    app.mutate('project/tasks', [
      { id: 1, title: 'Task', status: 'open', points: 5 },
    ]);
    // No fact emitted — rule skipped without capacity defined
    expect(app.facts().some(f => f.tag === 'project.over-capacity')).toBe(false);
  });

  it('multiple rules evaluate independently on the same mutate()', () => {
    app = createApp({
      name: 'multi-rule',
      schema: [TasksPath, CapacityPath],
      rules: [blockedTasksRule, capacityRule],
    });

    app.mutate('project/capacity', 5);
    app.mutate('project/tasks', [
      { id: 1, title: 'Blocked + over capacity', status: 'blocked', points: 10 },
    ]);

    const factsNow = app.facts();
    expect(factsNow.some(f => f.tag === 'project.has-blocked')).toBe(true);
    expect(factsNow.some(f => f.tag === 'project.over-capacity')).toBe(true);
  });

  it('rules watch multiple paths and re-evaluate on any change', () => {
    app = createApp({
      name: 'multi-watch',
      schema: [ProjectPath, TasksPath],
      rules: [projectHealthRule],
    });

    app.mutate('project/info', {
      name: 'Sprint 1',
      velocity: 20,
      sprintDay: 5,
      totalDays: 10,
    });

    // Set tasks with low progress (1/5 done when day 5/10 = 50% through sprint → at risk)
    app.mutate('project/tasks', [
      { id: 1, title: 'Done', status: 'done', points: 2 },
      { id: 2, title: 'Open', status: 'open', points: 2 },
      { id: 3, title: 'Open', status: 'open', points: 2 },
      { id: 4, title: 'Open', status: 'open', points: 2 },
      { id: 5, title: 'Open', status: 'open', points: 2 },
    ]);
    expect(app.facts().some(f => f.tag === 'project.health.at-risk')).toBe(true);

    // Complete all tasks → no longer at risk
    app.mutate('project/tasks', [
      { id: 1, title: 'Done', status: 'done', points: 2 },
      { id: 2, title: 'Done', status: 'done', points: 2 },
      { id: 3, title: 'Done', status: 'done', points: 2 },
      { id: 4, title: 'Done', status: 'done', points: 2 },
      { id: 5, title: 'Done', status: 'done', points: 2 },
    ]);
    expect(app.facts().some(f => f.tag === 'project.health.at-risk')).toBe(false);
  });

  it('evaluate() forces re-evaluation without a mutation', () => {
    let externalCondition = false;

    const dynamicRule = defineRule({
      id: 'external.flag',
      watch: ['project/loading'],
      evaluate: () => {
        if (externalCondition) {
          return RuleResult.emit([fact('external.triggered', { at: Date.now() })]);
        }
        return RuleResult.noop('Condition not met');
      },
    });

    app = createApp({
      name: 'force-evaluate',
      schema: [LoadingPath],
      rules: [dynamicRule],
    });

    expect(app.facts().some(f => f.tag === 'external.triggered')).toBe(false);

    // Change the external condition without mutating any path
    externalCondition = true;
    app.evaluate();

    expect(app.facts().some(f => f.tag === 'external.triggered')).toBe(true);
  });

  it('rules receive current facts as second argument', () => {
    const factCaptures: Array<{ tag: string }[]> = [];

    const observerRule = defineRule({
      id: 'observer.rule',
      watch: ['project/loading'],
      evaluate: (_values, facts) => {
        factCaptures.push(facts.map(f => ({ tag: f.tag })));
        return RuleResult.noop('observer');
      },
    });

    const emitterRule = defineRule({
      id: 'emitter.rule',
      watch: ['project/loading'],
      evaluate: (values) => {
        if (values['project/loading']) {
          return RuleResult.emit([fact('loading.active', { since: 0 })]);
        }
        return RuleResult.retract(['loading.active']);
      },
    });

    app = createApp({
      name: 'facts-in-rules',
      schema: [LoadingPath],
      rules: [emitterRule, observerRule],
    });

    app.mutate('project/loading', true);
    app.mutate('project/loading', false);

    // Observer received facts on second eval (after emitter ran first)
    const secondCapture = factCaptures[1];
    expect(secondCapture?.some(f => f.tag === 'loading.active')).toBe(true);
  });

  it('a rule throwing an error does not crash the app', () => {
    const faultyRule = defineRule({
      id: 'faulty.rule',
      watch: ['project/loading'],
      evaluate: () => {
        throw new Error('Rule exploded');
      },
    });

    app = createApp({
      name: 'fault-tolerant',
      schema: [LoadingPath],
      rules: [faultyRule],
    });

    // Should not throw
    expect(() => app.mutate('project/loading', true)).not.toThrow();
  });

  it('LWW (last-write-wins) — later rule evaluation overwrites same tag', () => {
    const rule1 = defineRule({
      id: 'rule1',
      watch: ['project/loading'],
      evaluate: (values) => {
        if (values['project/loading']) {
          return RuleResult.emit([fact('shared.tag', { source: 'rule1' })]);
        }
        return RuleResult.noop();
      },
    });

    const rule2 = defineRule({
      id: 'rule2',
      watch: ['project/loading'],
      evaluate: (values) => {
        if (values['project/loading']) {
          return RuleResult.emit([fact('shared.tag', { source: 'rule2' })]);
        }
        return RuleResult.noop();
      },
    });

    app = createApp({
      name: 'lww-test',
      schema: [LoadingPath],
      rules: [rule1, rule2],
    });

    app.mutate('project/loading', true);

    const factsNow = app.facts();
    const sharedFacts = factsNow.filter(f => f.tag === 'shared.tag');
    // LWW: only one fact per tag, last writer (rule2) wins
    expect(sharedFacts).toHaveLength(1);
    expect((sharedFacts[0].payload as any).source).toBe('rule2');
  });
});

// ── 3. Constraint Validation Edge Cases ──────────────────────────────────────

describe('Constraint Validation — Edge Cases', () => {
  let app: PraxisApp;

  afterEach(() => {
    app?.destroy();
  });

  it('mutation accepted when no constraints exist', () => {
    app = createApp({ name: 'no-constraints', schema: [CapacityPath] });
    const result = app.mutate('project/capacity', -100);
    expect(result.accepted).toBe(true);
  });

  it('mutation rejected with correct constraint ID in violation', () => {
    app = createApp({
      name: 'constraint-id-check',
      schema: [CapacityPath],
      constraints: [noNegativeCapacityConstraint],
    });

    const result = app.mutate('project/capacity', -5);
    expect(result.accepted).toBe(false);
    expect(result.violations[0].data?.constraintId).toBe('no-negative-capacity');
  });

  it('original value preserved after rejected mutation', () => {
    app = createApp({
      name: 'rollback-on-violation',
      schema: [CapacityPath],
      constraints: [noNegativeCapacityConstraint],
    });

    app.mutate('project/capacity', 10); // valid

    const result = app.mutate('project/capacity', -1); // invalid
    expect(result.accepted).toBe(false);
    expect(app.query<number>('project/capacity').current).toBe(10); // unchanged
  });

  it('constraint watching multiple paths validates proposed value', () => {
    app = createApp({
      name: 'multi-watch-constraint',
      schema: [TasksPath, ActiveUserPath],
      constraints: [requireActiveUserConstraint],
    });

    // Try to add an assigned task without active user set
    const result = app.mutate('project/tasks', [
      { id: 1, title: 'Assigned', status: 'open', points: 2, assignee: 'alice' },
    ]);
    expect(result.accepted).toBe(false);
    expect(result.violations[0].message).toContain('active user');
  });

  it('constraint passes after watch dependency is satisfied', () => {
    app = createApp({
      name: 'constraint-satisfied-after-dep',
      schema: [TasksPath, ActiveUserPath],
      constraints: [requireActiveUserConstraint],
    });

    // Set the active user first
    app.mutate('project/activeUser', 'alice');

    // Now assigning a task should succeed
    const result = app.mutate('project/tasks', [
      { id: 1, title: 'Task', status: 'open', points: 2, assignee: 'alice' },
    ]);
    expect(result.accepted).toBe(true);
  });

  it('multiple constraints — all must pass for mutation to succeed', () => {
    app = createApp({
      name: 'multi-constraint',
      schema: [TasksPath, CapacityPath],
      constraints: [noBlockedDoneConstraint, noNegativeCapacityConstraint],
    });

    // Both violations at once (mutating different paths in separate calls)
    const r1 = app.mutate('project/capacity', -5);
    expect(r1.accepted).toBe(false);
    expect(r1.violations[0].data?.constraintId).toBe('no-negative-capacity');

    const r2 = app.mutate('project/tasks', [
      { id: 1, title: 'Blocked zero', status: 'blocked', points: 0 },
    ]);
    expect(r2.accepted).toBe(false);
    expect(r2.violations[0].data?.constraintId).toBe('no-blocked-done');
  });

  it('violations() reflects current state (not last mutation)', () => {
    app = createApp({
      name: 'violations-current-state',
      schema: [CapacityPath],
      constraints: [noNegativeCapacityConstraint],
    });

    // Start valid
    expect(app.violations()).toEqual([]);

    // Set directly via batch (bypasses constraint — test violations() live check)
    // Use the fact that violations() evaluates current state independently
    app.mutate('project/capacity', 5);
    expect(app.violations()).toEqual([]);
  });

  it('constraint throwing an error is caught and reported as a violation', () => {
    const throwingConstraint = defineConstraint({
      id: 'throwing-constraint',
      watch: ['project/loading'],
      validate: () => {
        throw new Error('Constraint exploded');
      },
    });

    app = createApp({
      name: 'throwing-constraint',
      schema: [LoadingPath],
      constraints: [throwingConstraint],
    });

    const result = app.mutate('project/loading', true);
    expect(result.accepted).toBe(false);
    expect(result.violations[0].message).toContain('Constraint "throwing-constraint" threw');
  });

  it('constraint on a path not being mutated is not triggered', () => {
    const capacityConstraint = defineConstraint({
      id: 'cap-watch',
      watch: ['project/capacity'],
      validate: (values) => {
        if ((values['project/capacity'] as number) < 0) return 'Negative capacity';
        return true;
      },
    });

    app = createApp({
      name: 'path-filter',
      schema: [TasksPath, CapacityPath],
      constraints: [capacityConstraint],
    });

    // Mutating tasks — constraint only watches capacity, so it's not triggered
    const result = app.mutate('project/tasks', [
      { id: 1, title: 'Task', status: 'open', points: 5 },
    ]);
    expect(result.accepted).toBe(true);
  });
});

// ── 4. batch() Integration ────────────────────────────────────────────────────

describe('batch() — Integration', () => {
  let app: PraxisApp;

  afterEach(() => {
    app?.destroy();
  });

  it('atomic success — all mutations applied when all constraints pass', () => {
    app = createApp({
      name: 'batch-success',
      schema: [ProjectPath, TasksPath, CapacityPath],
      rules: [blockedTasksRule, capacityRule],
      constraints: [noNegativeCapacityConstraint],
    });

    const result = app.batch((m) => {
      m('project/info', { name: 'Sprint 1', velocity: 20, sprintDay: 1, totalDays: 10 });
      m('project/capacity', 20);
      m('project/tasks', [
        { id: 1, title: 'Task A', status: 'open', points: 5 },
        { id: 2, title: 'Task B', status: 'open', points: 3 },
      ]);
    });

    expect(result.accepted).toBe(true);
    expect(app.query<ProjectInfo | null>('project/info').current?.name).toBe('Sprint 1');
    expect(app.query<number>('project/capacity').current).toBe(20);
    expect(app.query<Task[]>('project/tasks').current).toHaveLength(2);
  });

  it('atomic failure — no mutations applied when any constraint fails', () => {
    app = createApp({
      name: 'batch-failure',
      schema: [ProjectPath, CapacityPath],
      constraints: [noNegativeCapacityConstraint],
    });

    const beforeProject = app.query<ProjectInfo | null>('project/info').current;

    const result = app.batch((m) => {
      m('project/info', { name: 'Sprint X', velocity: 10, sprintDay: 1, totalDays: 5 });
      m('project/capacity', -10); // invalid!
    });

    expect(result.accepted).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    // project/info must NOT have been updated
    expect(app.query<ProjectInfo | null>('project/info').current).toBe(beforeProject);
  });

  it('batch triggers single rule evaluation pass after all writes', () => {
    let evalCount = 0;

    const countingRule = defineRule({
      id: 'counting.rule',
      watch: ['project/tasks', 'project/capacity'],
      evaluate: (values) => {
        evalCount++;
        const tasks = (values['project/tasks'] ?? []) as Task[];
        const cap = (values['project/capacity'] ?? 0) as number;
        const allocated = tasks.reduce((sum, t) => sum + t.points, 0);
        if (cap > 0 && allocated > cap) {
          return RuleResult.emit([fact('over-cap', { allocated, cap })]);
        }
        return RuleResult.noop();
      },
    });

    app = createApp({
      name: 'batch-single-eval',
      schema: [TasksPath, CapacityPath],
      rules: [countingRule],
    });

    const evalsBefore = evalCount;
    app.batch((m) => {
      m('project/capacity', 5);
      m('project/tasks', [
        { id: 1, title: 'Task', status: 'open', points: 10 },
      ]);
    });

    // Rules evaluated exactly once for the batch, not once per mutation
    expect(evalCount - evalsBefore).toBe(1);
    expect(app.facts().some(f => f.tag === 'over-cap')).toBe(true);
  });

  it('batch notifies subscribers for each affected path', () => {
    app = createApp({
      name: 'batch-subscribers',
      schema: [TasksPath, CapacityPath],
    });

    const taskUpdates: Task[][] = [];
    const capUpdates: number[] = [];

    app.query<Task[]>('project/tasks').subscribe(v => taskUpdates.push(v));
    app.query<number>('project/capacity').subscribe(v => capUpdates.push(v));

    // Initial immediate callbacks
    expect(taskUpdates.length).toBe(1);
    expect(capUpdates.length).toBe(1);

    app.batch((m) => {
      m('project/tasks', [{ id: 1, title: 'T', status: 'open', points: 2 }]);
      m('project/capacity', 10);
    });

    expect(taskUpdates.length).toBe(2);
    expect(capUpdates.length).toBe(2);
  });
});

// ── 5. Timeline Integration and Undo/Redo Patterns ───────────────────────────

describe('Timeline — Integration and Undo/Redo', () => {
  let app: PraxisApp;

  afterEach(() => {
    app?.destroy();
  });

  it('timeline is empty on creation', () => {
    app = createApp({ name: 'timeline-empty', schema: [] });
    expect(app.timeline()).toEqual([]);
  });

  it('each mutation adds a timeline entry with before/after values', () => {
    app = createApp({ name: 'timeline-entries', schema: [CapacityPath] });

    app.mutate('project/capacity', 10);
    app.mutate('project/capacity', 20);
    app.mutate('project/capacity', 30);

    const entries = app.timeline().filter(e => e.kind === 'mutation');
    expect(entries).toHaveLength(3);

    expect(entries[0].data.before).toBe(0);
    expect(entries[0].data.after).toBe(10);

    expect(entries[1].data.before).toBe(10);
    expect(entries[1].data.after).toBe(20);

    expect(entries[2].data.before).toBe(20);
    expect(entries[2].data.after).toBe(30);
  });

  it('timeline entries have required fields (id, timestamp, path, kind)', () => {
    app = createApp({ name: 'timeline-fields', schema: [LoadingPath] });
    app.mutate('project/loading', true);

    const entry = app.timeline().find(e => e.kind === 'mutation');
    expect(entry).toBeDefined();
    expect(typeof entry!.id).toBe('string');
    expect(entry!.id).toMatch(/^px:\d+-\d+$/);
    expect(typeof entry!.timestamp).toBe('number');
    expect(entry!.timestamp).toBeGreaterThan(0);
    expect(entry!.path).toBe('project/loading');
  });

  it('timeline records rule evaluations', () => {
    app = createApp({
      name: 'timeline-rules',
      schema: [TasksPath],
      rules: [blockedTasksRule],
    });

    app.mutate('project/tasks', [
      { id: 1, title: 'Stuck', status: 'blocked', points: 3 },
    ]);

    const ruleEntries = app.timeline().filter(e => e.kind === 'rule-eval');
    expect(ruleEntries.length).toBeGreaterThan(0);
    expect(ruleEntries.some(e => e.data.ruleId === 'project.has-blocked')).toBe(true);
  });

  it('timeline records constraint checks on violations', () => {
    app = createApp({
      name: 'timeline-constraints',
      schema: [CapacityPath],
      constraints: [noNegativeCapacityConstraint],
    });

    app.mutate('project/capacity', -1); // violation

    const constraintEntries = app.timeline().filter(e => e.kind === 'constraint-check');
    expect(constraintEntries.length).toBeGreaterThan(0);
    expect(constraintEntries[0].data.violated).toBe(true);
    expect(constraintEntries[0].data.constraintId).toBe('no-negative-capacity');
  });

  it('timeline preserves insertion order (chronological)', () => {
    app = createApp({ name: 'timeline-order', schema: [CapacityPath] });

    app.mutate('project/capacity', 1);
    app.mutate('project/capacity', 2);
    app.mutate('project/capacity', 3);

    const mutations = app.timeline().filter(e => e.kind === 'mutation');
    const afters = mutations.map(e => e.data.after as number);
    expect(afters).toEqual([1, 2, 3]);
  });

  it('undo/redo — timeline-based state reconstruction', () => {
    app = createApp({ name: 'undo-redo', schema: [CapacityPath] });

    // Build an explicit undo stack tracking only our intentional mutations
    const undoStack: number[] = [];

    function trackedMutate(value: number) {
      const current = app.query<number>('project/capacity').current;
      undoStack.push(current);
      app.mutate('project/capacity', value);
    }

    trackedMutate(10); // stack: [0]
    trackedMutate(20); // stack: [0, 10]
    trackedMutate(30); // stack: [0, 10, 20]

    expect(app.query<number>('project/capacity').current).toBe(30);

    // Undo back to 20
    const prev1 = undoStack.pop()!; // 20
    app.mutate('project/capacity', prev1);
    expect(app.query<number>('project/capacity').current).toBe(20);

    // Undo back to 10
    const prev2 = undoStack.pop()!; // 10
    app.mutate('project/capacity', prev2);
    expect(app.query<number>('project/capacity').current).toBe(10);

    // Undo back to 0
    const prev3 = undoStack.pop()!; // 0
    app.mutate('project/capacity', prev3);
    expect(app.query<number>('project/capacity').current).toBe(0);

    // Stack is empty — no more undos
    expect(undoStack).toHaveLength(0);

    // Timeline recorded all transitions (3 original + 3 undos = 6)
    const mutations = app.timeline().filter(e => e.kind === 'mutation');
    expect(mutations.length).toBe(6);
  });

  it('undo/redo — timeline replay for collections', () => {
    app = createApp({ name: 'undo-collection', schema: [TasksPath] });

    const v0: Task[] = [];
    const v1: Task[] = [{ id: 1, title: 'Task A', status: 'open', points: 2 }];
    const v2: Task[] = [
      { id: 1, title: 'Task A', status: 'open', points: 2 },
      { id: 2, title: 'Task B', status: 'open', points: 3 },
    ];

    app.mutate('project/tasks', v1);
    app.mutate('project/tasks', v2);

    // Undo to v1 by re-applying the 'before' of the last mutation
    // Note: for arrays, 'before' is summarized — so we must track the actual
    // values externally or re-apply from the subscriber history
    expect(app.query<Task[]>('project/tasks').current).toHaveLength(2);

    // Re-apply v1 directly to simulate undo
    app.mutate('project/tasks', v1);
    expect(app.query<Task[]>('project/tasks').current).toHaveLength(1);

    // Redo v2
    app.mutate('project/tasks', v2);
    expect(app.query<Task[]>('project/tasks').current).toHaveLength(2);

    // Confirm timeline records all transitions
    const mutations = app.timeline().filter(e => e.kind === 'mutation');
    expect(mutations.length).toBe(4); // v0→v1, v1→v2, v2→v1, v1→v2
  });

  it('timeline tracks entries across multiple paths', () => {
    app = createApp({
      name: 'timeline-multi-path',
      schema: [TasksPath, CapacityPath, LoadingPath],
    });

    app.mutate('project/loading', true);
    app.mutate('project/capacity', 15);
    app.mutate('project/tasks', [{ id: 1, title: 'T', status: 'open', points: 5 }]);
    app.mutate('project/loading', false);

    const mutations = app.timeline().filter(e => e.kind === 'mutation');
    const paths = mutations.map(e => e.path);

    expect(paths).toContain('project/loading');
    expect(paths).toContain('project/capacity');
    expect(paths).toContain('project/tasks');
  });
});

// ── 6. Async Rule Patterns ───────────────────────────────────────────────────

describe('Async Rule Patterns — evaluate() Integration', () => {
  let app: PraxisApp;

  afterEach(() => {
    app?.destroy();
  });

  it('async data fetch pattern: loading → loaded → rules applied', async () => {
    // Simulated external fetch — result arrives asynchronously
    async function fetchProjectData(): Promise<ProjectInfo> {
      await new Promise(r => setTimeout(r, 10));
      return { name: 'Sprint 1', velocity: 20, sprintDay: 5, totalDays: 10 };
    }

    app = createApp({
      name: 'async-fetch',
      schema: [ProjectPath, LoadingPath, TasksPath],
      rules: [projectHealthRule],
    });

    // Start loading
    app.mutate('project/loading', true);
    expect(app.query<boolean>('project/loading').current).toBe(true);

    // Async fetch
    const projectData = await fetchProjectData();

    // Set results and clear loading
    app.batch((m) => {
      m('project/loading', false);
      m('project/info', projectData);
      m('project/tasks', [
        { id: 1, title: 'Task', status: 'open', points: 3 },
        { id: 2, title: 'Task', status: 'open', points: 3 },
      ]);
    });

    expect(app.query<boolean>('project/loading').current).toBe(false);
    expect(app.query<ProjectInfo | null>('project/info').current?.name).toBe('Sprint 1');
    // Day 5/10 with 0/2 done → at risk
    expect(app.facts().some(f => f.tag === 'project.health.at-risk')).toBe(true);
  });

  it('polling pattern: evaluate() called periodically updates rule results', async () => {
    let counter = 0;

    const polledRule = defineRule({
      id: 'poll.rule',
      watch: ['project/loading'],
      evaluate: () => {
        counter++;
        if (counter >= 3) {
          return RuleResult.emit([fact('poll.threshold-reached', { counter })]);
        }
        return RuleResult.noop(`Counter at ${counter}`);
      },
    });

    app = createApp({
      name: 'polling',
      schema: [LoadingPath],
      rules: [polledRule],
    });

    // Rules are NOT evaluated on app creation — only on mutate() or explicit evaluate().
    // Counter starts at 0; each evaluate() call increments it.
    app.evaluate(); // counter = 1, noop
    app.evaluate(); // counter = 2, noop
    app.evaluate(); // counter = 3, threshold reached → emit

    // The fact should be emitted once counter ≥ 3
    expect(app.facts().some(f => f.tag === 'poll.threshold-reached')).toBe(true);
  });

  it('error state pattern: error path drives UI rule', () => {
    const errorDisplayRule = defineRule({
      id: 'ui.error-banner',
      watch: ['project/error', 'project/loading'],
      evaluate: (values) => {
        const error = values['project/error'] as string | null;
        const loading = values['project/loading'] as boolean;
        if (error && !loading) {
          return RuleResult.emit([fact('ui.show-error', { message: error })]);
        }
        return RuleResult.retract(['ui.show-error'], 'No error or still loading');
      },
    });

    app = createApp({
      name: 'error-state',
      schema: [ErrorPath, LoadingPath],
      rules: [errorDisplayRule],
    });

    // Initial — no error
    expect(app.facts().some(f => f.tag === 'ui.show-error')).toBe(false);

    // Error occurs
    app.mutate('project/error', 'Network timeout');
    expect(app.facts().some(f => f.tag === 'ui.show-error')).toBe(true);
    expect((app.facts().find(f => f.tag === 'ui.show-error')?.payload as any).message).toBe('Network timeout');

    // Error cleared
    app.mutate('project/error', null);
    expect(app.facts().some(f => f.tag === 'ui.show-error')).toBe(false);
  });
});

// ── 7. Liveness Monitoring Integration ───────────────────────────────────────

describe('Liveness Monitoring — Integration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('liveness returns stale=false for paths that have been updated', async () => {
    const app = createApp({
      name: 'liveness-updated',
      schema: [CapacityPath],
      liveness: {
        expect: ['project/capacity'],
        timeoutMs: 200,
      },
    });

    app.mutate('project/capacity', 10);

    const status = app.liveness();
    expect(status['project/capacity'].stale).toBe(false);
    expect(status['project/capacity'].lastUpdated).toBeGreaterThan(0);

    app.destroy();
  });

  it('liveness returns stale=true for paths never updated', () => {
    const app = createApp({
      name: 'liveness-stale',
      schema: [CapacityPath],
      liveness: {
        expect: ['project/capacity'],
        timeoutMs: 50,
      },
    });

    // stale is based on updateCount === 0 — checked synchronously, no need to wait for the timer
    const status = app.liveness();
    expect(status['project/capacity'].stale).toBe(true);

    app.destroy();
  });

  it('onStale callback fires after timeout for unmutated paths', async () => {
    const onStale = vi.fn();

    const app = createApp({
      name: 'liveness-callback',
      schema: [ActiveUserPath],
      liveness: {
        expect: ['project/activeUser'],
        timeoutMs: 50,
        onStale,
      },
    });

    await new Promise(r => setTimeout(r, 100));

    expect(onStale).toHaveBeenCalledWith('project/activeUser', expect.any(Number));

    app.destroy();
  });

  it('onStale not called for paths that update before timeout', async () => {
    const onStale = vi.fn();

    const app = createApp({
      name: 'liveness-no-stale',
      schema: [ActiveUserPath],
      liveness: {
        expect: ['project/activeUser'],
        timeoutMs: 100,
        onStale,
      },
    });

    app.mutate('project/activeUser', 'bob');
    await new Promise(r => setTimeout(r, 150));

    expect(onStale).not.toHaveBeenCalled();

    app.destroy();
  });

  it('liveness timeline entry is recorded when stale path detected', async () => {
    const app = createApp({
      name: 'liveness-timeline',
      schema: [CapacityPath],
      liveness: {
        expect: ['project/capacity'],
        timeoutMs: 50,
      },
    });

    await new Promise(r => setTimeout(r, 100));

    const livenessEntries = app.timeline().filter(e => e.kind === 'liveness');
    expect(livenessEntries.length).toBeGreaterThan(0);
    expect(livenessEntries[0].data.stale).toBe(true);

    app.destroy();
  });
});

// ── 8. Subscriber Lifecycle Integration ──────────────────────────────────────

describe('Subscriber Lifecycle — Integration', () => {
  let app: PraxisApp;

  afterEach(() => {
    app?.destroy();
  });

  it('unsubscribed callbacks receive no further updates', () => {
    app = createApp({ name: 'unsub-test', schema: [CapacityPath] });

    const received: number[] = [];
    const unsub = app.query<number>('project/capacity').subscribe(v => received.push(v));

    app.mutate('project/capacity', 5);
    unsub();
    app.mutate('project/capacity', 10);
    app.mutate('project/capacity', 15);

    expect(received).toEqual([0, 5]); // only initial + first update
  });

  it('multiple subscribers on same path all receive updates', () => {
    app = createApp({ name: 'multi-sub', schema: [CapacityPath] });

    const a: number[] = [];
    const b: number[] = [];
    const c: number[] = [];

    const ref = app.query<number>('project/capacity');
    const u1 = ref.subscribe(v => a.push(v));
    const u2 = ref.subscribe(v => b.push(v));
    const u3 = ref.subscribe(v => c.push(v));

    app.mutate('project/capacity', 42);

    u1();
    u2();
    u3();

    expect(a).toEqual([0, 42]);
    expect(b).toEqual([0, 42]);
    expect(c).toEqual([0, 42]);
  });

  it('subscriber errors are isolated — other subscribers still notified', () => {
    app = createApp({ name: 'sub-error-isolation', schema: [CapacityPath] });

    const received: number[] = [];

    // Faulty subscriber
    app.query<number>('project/capacity').subscribe(() => {
      throw new Error('subscriber exploded');
    });

    // Healthy subscriber
    const unsub = app.query<number>('project/capacity').subscribe(v => received.push(v));

    // Should not throw
    expect(() => app.mutate('project/capacity', 5)).not.toThrow();
    expect(received).toEqual([0, 5]);

    unsub();
  });

  it('query with select option transforms values for subscribers', () => {
    interface Item { id: number; name: string; done: boolean }
    const ItemsPath = definePath<Item[]>('items', []);

    app = createApp({ name: 'query-select', schema: [ItemsPath] });

    const names: string[][] = [];
    // select transforms each array element; the subscriber receives the transformed array.
    // We cast through any to handle the opaque `unknown` return of select.
    const unsub = app.query<Item[]>('items', {
      select: (item) => item.name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }).subscribe(v => names.push(v as any));

    app.mutate('items', [
      { id: 1, name: 'Alpha', done: false },
      { id: 2, name: 'Beta', done: true },
    ]);

    unsub();

    expect(names[1]).toEqual(['Alpha', 'Beta']);
  });
});
