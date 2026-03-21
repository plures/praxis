/**
 * Chronos Project-Level Chronicle — Tests
 *
 * Comprehensive tests for:
 * - ProjectChronicle event recording
 * - Timeline queries (filter, range, history)
 * - Behavioral diff (add rule, remove rule, modify contract)
 * - Commit message generation from diffs
 * - Hooks auto-recording
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ProjectChronicle,
  createProjectChronicle,
} from '../chronos/project-chronicle.js';
import {
  Timeline,
  createTimeline,
} from '../chronos/timeline.js';
import {
  enableProjectChronicle,
  recordAudit,
} from '../chronos/hooks.js';
import {
  diffRegistries,
  diffContracts,
  diffExpectations,
  formatDelta,
  formatCommitMessage,
  formatReleaseNotes,
} from '../chronos/diff.js';
import type { RegistrySnapshot, RegistryDiff } from '../chronos/diff.js';
import { PraxisRegistry } from '../core/rules.js';
import { LogicEngine, createPraxisEngine } from '../core/engine.js';
import { RuleResult, fact } from '../core/rule-result.js';
import type { CompletenessReport } from '../core/completeness.js';

// ═══════════════════════════════════════════════════════════════════════════
// § 1 — ProjectChronicle: event recording
// ═══════════════════════════════════════════════════════════════════════════

describe('ProjectChronicle', () => {
  let chronicle: ProjectChronicle;
  let ts: number;

  beforeEach(() => {
    ts = 1000;
    chronicle = createProjectChronicle({ now: () => ts++ });
  });

  it('records rule registered events', () => {
    chronicle.recordRuleRegistered('auth/login', { description: 'Login rule' });
    expect(chronicle.size).toBe(1);
    const events = chronicle.getEvents();
    expect(events[0]).toMatchObject({
      kind: 'rule',
      action: 'registered',
      subject: 'auth/login',
      timestamp: 1000,
      metadata: { description: 'Login rule' },
    });
  });

  it('records rule modified with diff', () => {
    chronicle.recordRuleModified(
      'auth/login',
      { before: { description: 'old' }, after: { description: 'new' } },
    );
    const events = chronicle.getEvents();
    expect(events[0].diff).toEqual({
      before: { description: 'old' },
      after: { description: 'new' },
    });
  });

  it('records rule removed events', () => {
    chronicle.recordRuleRemoved('auth/login');
    expect(chronicle.getEvents()[0]).toMatchObject({
      kind: 'rule',
      action: 'removed',
      subject: 'auth/login',
    });
  });

  it('records contract events', () => {
    chronicle.recordContractAdded('auth/login', { behavior: 'Process login' });
    chronicle.recordContractModified(
      'auth/login',
      { before: 'old behavior', after: 'new behavior' },
    );
    expect(chronicle.size).toBe(2);
    expect(chronicle.getEvents()[0].kind).toBe('contract');
    expect(chronicle.getEvents()[0].action).toBe('added');
    expect(chronicle.getEvents()[1].action).toBe('modified');
  });

  it('records expectation events', () => {
    chronicle.recordExpectationSatisfied('all-tests-pass');
    chronicle.recordExpectationViolated('no-type-errors');
    expect(chronicle.size).toBe(2);
    expect(chronicle.getEvents()[0]).toMatchObject({
      kind: 'expectation',
      action: 'satisfied',
      subject: 'all-tests-pass',
    });
    expect(chronicle.getEvents()[1]).toMatchObject({
      kind: 'expectation',
      action: 'violated',
      subject: 'no-type-errors',
    });
  });

  it('records gate transitions with diff', () => {
    chronicle.recordGateTransition('deploy', 'blocked', 'open');
    const event = chronicle.getEvents()[0];
    expect(event).toMatchObject({
      kind: 'gate',
      action: 'open',
      subject: 'deploy',
    });
    expect(event.diff).toEqual({ before: 'blocked', after: 'open' });
    expect(event.metadata).toMatchObject({ from: 'blocked', to: 'open' });
  });

  it('records build audit events', () => {
    chronicle.recordBuildAudit(85, 5, { rating: 'good' });
    const event = chronicle.getEvents()[0];
    expect(event).toMatchObject({
      kind: 'build',
      action: 'audit-complete',
      subject: 'completeness',
    });
    expect(event.metadata).toMatchObject({ score: 85, delta: 5, rating: 'good' });
  });

  it('records fact lifecycle events', () => {
    chronicle.recordFactIntroduced('UserLoggedIn');
    chronicle.recordFactDeprecated('OldFact');
    expect(chronicle.size).toBe(2);
    expect(chronicle.getEvents()[0]).toMatchObject({
      kind: 'fact',
      action: 'introduced',
      subject: 'UserLoggedIn',
    });
    expect(chronicle.getEvents()[1]).toMatchObject({
      kind: 'fact',
      action: 'deprecated',
      subject: 'OldFact',
    });
  });

  it('enforces maxEvents cap', () => {
    const small = createProjectChronicle({ maxEvents: 3, now: () => ts++ });
    for (let i = 0; i < 5; i++) {
      small.recordRuleRegistered(`rule-${i}`);
    }
    expect(small.size).toBe(3);
    // Should have the last 3
    const subjects = small.getEvents().map(e => e.subject);
    expect(subjects).toEqual(['rule-2', 'rule-3', 'rule-4']);
  });

  it('clear() empties all events', () => {
    chronicle.recordRuleRegistered('a');
    chronicle.recordRuleRegistered('b');
    expect(chronicle.size).toBe(2);
    chronicle.clear();
    expect(chronicle.size).toBe(0);
  });

  it('getEvents() returns a shallow copy', () => {
    chronicle.recordRuleRegistered('a');
    const events1 = chronicle.getEvents();
    const events2 = chronicle.getEvents();
    expect(events1).not.toBe(events2);
    expect(events1).toEqual(events2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 2 — Timeline: queries, filtering, range, history
// ═══════════════════════════════════════════════════════════════════════════

describe('Timeline', () => {
  let chronicle: ProjectChronicle;
  let timeline: Timeline;
  let ts: number;

  beforeEach(() => {
    ts = 1000;
    chronicle = createProjectChronicle({ now: () => ts++ });
    timeline = createTimeline(chronicle);

    // Seed events
    chronicle.recordRuleRegistered('auth/login');           // ts=1000
    chronicle.recordContractAdded('auth/login');             // ts=1001
    chronicle.recordRuleRegistered('auth/logout');           // ts=1002
    chronicle.recordGateTransition('deploy', 'closed', 'open'); // ts=1003
    chronicle.recordExpectationSatisfied('tests-pass');      // ts=1004
    chronicle.recordBuildAudit(90, 10);                      // ts=1005
    chronicle.recordRuleRemoved('auth/logout');              // ts=1006
  });

  it('getTimeline() returns all events without filter', () => {
    expect(timeline.getTimeline()).toHaveLength(7);
  });

  it('filters by kind', () => {
    const rules = timeline.getTimeline({ kind: 'rule' });
    expect(rules).toHaveLength(3); // 2 registered + 1 removed
    expect(rules.every(e => e.kind === 'rule')).toBe(true);
  });

  it('filters by multiple kinds', () => {
    const events = timeline.getTimeline({ kind: ['rule', 'contract'] });
    expect(events).toHaveLength(4); // 3 rule + 1 contract
  });

  it('filters by action', () => {
    const registered = timeline.getTimeline({ action: 'registered' });
    expect(registered).toHaveLength(2);
  });

  it('filters by subject', () => {
    const history = timeline.getTimeline({ subject: 'auth/login' });
    expect(history).toHaveLength(2); // registered + contract added
  });

  it('filters by time range', () => {
    const events = timeline.getTimeline({ since: 1002, until: 1004 });
    expect(events).toHaveLength(3); // ts 1002, 1003, 1004
  });

  it('combines multiple filters (AND)', () => {
    const events = timeline.getTimeline({ kind: 'rule', action: 'registered' });
    expect(events).toHaveLength(2);
    expect(events.every(e => e.kind === 'rule' && e.action === 'registered')).toBe(true);
  });

  it('getEventsSince() returns events from timestamp', () => {
    const events = timeline.getEventsSince(1005);
    expect(events).toHaveLength(2); // ts 1005, 1006
  });

  it('getHistory() returns all events for a subject', () => {
    const history = timeline.getHistory('auth/login');
    expect(history).toHaveLength(2);
    expect(history[0].action).toBe('registered');
    expect(history[1].action).toBe('added');
  });

  describe('getDelta()', () => {
    it('computes behavioral delta for a time range', () => {
      const delta = timeline.getDelta(1000, 1006);
      expect(delta.from).toBe(1000);
      expect(delta.to).toBe(1006);
      expect(delta.events).toHaveLength(7);
    });

    it('identifies added subjects', () => {
      // auth/login registered, auth/logout registered then removed
      const delta = timeline.getDelta(1000, 1006);
      // auth/login is added (registered at 1000)
      expect(delta.added).toContain('auth/login');
    });

    it('identifies removed subjects', () => {
      const delta = timeline.getDelta(1000, 1006);
      // auth/logout was registered then removed — net effect is removed
      expect(delta.removed).toContain('auth/logout');
    });

    it('provides summary counts by kind', () => {
      const delta = timeline.getDelta(1000, 1006);
      expect(delta.summary.rule).toBe(3);
      expect(delta.summary.contract).toBe(1);
      expect(delta.summary.gate).toBe(1);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 3 — Behavioral Diff
// ═══════════════════════════════════════════════════════════════════════════

describe('Behavioral Diff', () => {
  describe('diffRegistries', () => {
    it('detects added rules', () => {
      const before: RegistrySnapshot = {
        rules: [{ id: 'a', description: 'Rule A', impl: () => RuleResult.noop() }],
        constraints: [],
      };
      const after: RegistrySnapshot = {
        rules: [
          { id: 'a', description: 'Rule A', impl: () => RuleResult.noop() },
          { id: 'b', description: 'Rule B', impl: () => RuleResult.noop() },
        ],
        constraints: [],
      };
      const diff = diffRegistries(before, after);
      expect(diff.rulesAdded).toEqual(['b']);
      expect(diff.rulesRemoved).toEqual([]);
    });

    it('detects removed rules', () => {
      const before: RegistrySnapshot = {
        rules: [
          { id: 'a', description: 'Rule A', impl: () => RuleResult.noop() },
          { id: 'b', description: 'Rule B', impl: () => RuleResult.noop() },
        ],
        constraints: [],
      };
      const after: RegistrySnapshot = {
        rules: [{ id: 'a', description: 'Rule A', impl: () => RuleResult.noop() }],
        constraints: [],
      };
      const diff = diffRegistries(before, after);
      expect(diff.rulesRemoved).toEqual(['b']);
      expect(diff.rulesAdded).toEqual([]);
    });

    it('detects modified rules (description changed)', () => {
      const before: RegistrySnapshot = {
        rules: [{ id: 'a', description: 'Rule A v1', impl: () => RuleResult.noop() }],
        constraints: [],
      };
      const after: RegistrySnapshot = {
        rules: [{ id: 'a', description: 'Rule A v2', impl: () => RuleResult.noop() }],
        constraints: [],
      };
      const diff = diffRegistries(before, after);
      expect(diff.rulesModified).toEqual(['a']);
    });

    it('handles Map inputs', () => {
      const before: RegistrySnapshot = {
        rules: new Map([['a', { id: 'a', description: 'A', impl: () => RuleResult.noop() }]]),
        constraints: new Map(),
      };
      const after: RegistrySnapshot = {
        rules: new Map([
          ['a', { id: 'a', description: 'A', impl: () => RuleResult.noop() }],
          ['b', { id: 'b', description: 'B', impl: () => RuleResult.noop() }],
        ]),
        constraints: new Map(),
      };
      const diff = diffRegistries(before, after);
      expect(diff.rulesAdded).toEqual(['b']);
    });

    it('detects constraint changes', () => {
      const before: RegistrySnapshot = {
        rules: [],
        constraints: [{ id: 'c1', description: 'Constraint 1', impl: () => true }],
      };
      const after: RegistrySnapshot = {
        rules: [],
        constraints: [{ id: 'c2', description: 'Constraint 2', impl: () => true }],
      };
      const diff = diffRegistries(before, after);
      expect(diff.constraintsAdded).toEqual(['c2']);
      expect(diff.constraintsRemoved).toEqual(['c1']);
    });
  });

  describe('diffContracts', () => {
    it('detects newly added contracts', () => {
      const before = { coverage: { 'auth/login': false, 'auth/logout': true } };
      const after = { coverage: { 'auth/login': true, 'auth/logout': true } };
      const diff = diffContracts(before, after);
      expect(diff.contractsAdded).toEqual(['auth/login']);
      expect(diff.contractsRemoved).toEqual([]);
    });

    it('detects removed contracts', () => {
      const before = { coverage: new Map([['a', true]]) };
      const after = { coverage: new Map([['a', false]]) };
      const diff = diffContracts(before, after);
      expect(diff.contractsRemoved).toEqual(['a']);
    });

    it('computes coverage ratios', () => {
      const before = { coverage: { a: true, b: false } };
      const after = { coverage: { a: true, b: true } };
      const diff = diffContracts(before, after);
      expect(diff.coverageBefore).toBe(0.5);
      expect(diff.coverageAfter).toBe(1);
    });
  });

  describe('diffExpectations', () => {
    it('detects newly satisfied expectations', () => {
      const before = { expectations: { 'tests-pass': false, 'lint-clean': true } };
      const after = { expectations: { 'tests-pass': true, 'lint-clean': true } };
      const diff = diffExpectations(before, after);
      expect(diff.newlySatisfied).toEqual(['tests-pass']);
      expect(diff.newlyViolated).toEqual([]);
      expect(diff.unchanged).toContain('lint-clean');
    });

    it('detects newly violated expectations', () => {
      const before = { expectations: new Map([['a', true]]) };
      const after = { expectations: new Map([['a', false]]) };
      const diff = diffExpectations(before, after);
      expect(diff.newlyViolated).toEqual(['a']);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 4 — Commit message generation
// ═══════════════════════════════════════════════════════════════════════════

describe('Commit Message Generation', () => {
  it('generates feat commit for added rules', () => {
    const diff: RegistryDiff = {
      rulesAdded: ['auth/login'],
      rulesRemoved: [],
      rulesModified: [],
      constraintsAdded: [],
      constraintsRemoved: [],
      constraintsModified: [],
    };
    const msg = formatCommitMessage(diff);
    expect(msg).toContain('feat(auth)');
    expect(msg).toContain('auth/login');
  });

  it('generates refactor commit for removed rules', () => {
    const diff: RegistryDiff = {
      rulesAdded: [],
      rulesRemoved: ['auth/legacy'],
      rulesModified: [],
      constraintsAdded: [],
      constraintsRemoved: [],
      constraintsModified: [],
    };
    const msg = formatCommitMessage(diff);
    expect(msg).toContain('refactor(auth)');
    expect(msg).toContain('remove');
  });

  it('generates refactor commit for modified rules', () => {
    const diff: RegistryDiff = {
      rulesAdded: [],
      rulesRemoved: [],
      rulesModified: ['auth/login'],
      constraintsAdded: [],
      constraintsRemoved: [],
      constraintsModified: [],
    };
    const msg = formatCommitMessage(diff);
    expect(msg).toContain('refactor(auth)');
    expect(msg).toContain('update');
  });

  it('generates chore commit for no changes', () => {
    const diff: RegistryDiff = {
      rulesAdded: [],
      rulesRemoved: [],
      rulesModified: [],
      constraintsAdded: [],
      constraintsRemoved: [],
      constraintsModified: [],
    };
    const msg = formatCommitMessage(diff);
    expect(msg).toContain('chore');
  });

  it('includes body with details', () => {
    const diff: RegistryDiff = {
      rulesAdded: ['auth/login', 'auth/logout'],
      rulesRemoved: [],
      rulesModified: [],
      constraintsAdded: [],
      constraintsRemoved: [],
      constraintsModified: [],
    };
    const msg = formatCommitMessage(diff);
    expect(msg).toContain('Rules added: auth/login, auth/logout');
  });
});

describe('formatDelta', () => {
  it('formats a human-readable delta', () => {
    const diff: RegistryDiff = {
      rulesAdded: ['auth/login'],
      rulesRemoved: ['auth/legacy'],
      rulesModified: [],
      constraintsAdded: ['max-retries'],
      constraintsRemoved: [],
      constraintsModified: [],
    };
    const text = formatDelta(diff);
    expect(text).toContain('+ Rules added: auth/login');
    expect(text).toContain('- Rules removed: auth/legacy');
    expect(text).toContain('+ Constraints added: max-retries');
  });

  it('returns "No behavioral changes." for empty diff', () => {
    const diff: RegistryDiff = {
      rulesAdded: [],
      rulesRemoved: [],
      rulesModified: [],
      constraintsAdded: [],
      constraintsRemoved: [],
      constraintsModified: [],
    };
    expect(formatDelta(diff)).toBe('No behavioral changes.');
  });
});

describe('formatReleaseNotes', () => {
  it('aggregates multiple diffs into release notes', () => {
    const diffs: RegistryDiff[] = [
      {
        rulesAdded: ['auth/login'],
        rulesRemoved: [],
        rulesModified: [],
        constraintsAdded: [],
        constraintsRemoved: [],
        constraintsModified: [],
      },
      {
        rulesAdded: ['data/sync'],
        rulesRemoved: ['auth/legacy'],
        rulesModified: ['auth/login'],
        constraintsAdded: [],
        constraintsRemoved: [],
        constraintsModified: [],
      },
    ];
    const notes = formatReleaseNotes(diffs);
    expect(notes).toContain('## Release Notes');
    expect(notes).toContain('### Added');
    expect(notes).toContain('- auth/login');
    expect(notes).toContain('- data/sync');
    expect(notes).toContain('### Changed');
    expect(notes).toContain('### Removed');
    expect(notes).toContain('- auth/legacy');
  });

  it('returns message for empty diffs', () => {
    const notes = formatReleaseNotes([]);
    expect(notes).toBe('No behavioral changes in this release.');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 5 — Hooks: auto-recording
// ═══════════════════════════════════════════════════════════════════════════

describe('Hooks (enableProjectChronicle)', () => {
  let registry: PraxisRegistry;
  let engine: LogicEngine;

  beforeEach(() => {
    registry = new PraxisRegistry({ compliance: { enabled: false } });
    engine = createPraxisEngine({ initialContext: {}, registry });
  });

  it('auto-records rule registration', () => {
    const { chronicle, disconnect } = enableProjectChronicle(registry, engine);

    registry.registerRule({
      id: 'test/rule',
      description: 'Test rule',
      impl: () => RuleResult.noop(),
    });

    expect(chronicle.size).toBeGreaterThan(0);
    const events = chronicle.getEvents();
    const ruleEvent = events.find(e => e.kind === 'rule' && e.action === 'registered');
    expect(ruleEvent).toBeDefined();
    expect(ruleEvent!.subject).toBe('test/rule');

    disconnect();
  });

  it('auto-records rule with contract', () => {
    const { chronicle, disconnect } = enableProjectChronicle(registry, engine);

    registry.registerRule({
      id: 'test/contracted',
      description: 'Contracted rule',
      contract: {
        ruleId: 'test/contracted',
        behavior: 'Does stuff',
        examples: [{ given: 'x', when: 'y', then: 'z' }],
        invariants: ['always works'],
      },
      impl: () => RuleResult.noop(),
    });

    const events = chronicle.getEvents();
    const contractEvent = events.find(e => e.kind === 'contract' && e.action === 'added');
    expect(contractEvent).toBeDefined();
    expect(contractEvent!.subject).toBe('test/contracted');
    expect(contractEvent!.metadata).toMatchObject({
      behavior: 'Does stuff',
      examplesCount: 1,
      invariantsCount: 1,
    });

    disconnect();
  });

  it('auto-records engine step results', () => {
    // Register a rule first (before hooking, to avoid double-recording confusion)
    registry.registerRule({
      id: 'test/emit',
      description: 'Emit a fact',
      impl: () => RuleResult.emit([fact('test.fact', { value: 42 })]),
    });

    const { chronicle, disconnect } = enableProjectChronicle(registry, engine);

    engine.step([{ tag: 'test.event', payload: {} }]);

    const events = chronicle.getEvents();
    const stepEvent = events.find(e => e.kind === 'build' && e.action === 'step-complete');
    expect(stepEvent).toBeDefined();
    expect(stepEvent!.metadata).toMatchObject({
      eventsProcessed: 1,
      eventTags: ['test.event'],
    });

    disconnect();
  });

  it('auto-records constraint violations from step', () => {
    registry.registerRule({
      id: 'test/rule',
      description: 'noop',
      impl: () => RuleResult.noop(),
    });
    registry.registerConstraint({
      id: 'test/constraint',
      description: 'Always fails',
      impl: () => 'This always fails',
    });

    const { chronicle, disconnect } = enableProjectChronicle(registry, engine);

    engine.step([{ tag: 'x', payload: {} }]);

    const events = chronicle.getEvents();
    const violationEvent = events.find(
      e => e.kind === 'expectation' && e.action === 'violated',
    );
    expect(violationEvent).toBeDefined();
    expect(violationEvent!.subject).toBe('test/constraint');

    disconnect();
  });

  it('auto-records checkConstraints results', () => {
    registry.registerConstraint({
      id: 'test/always-ok',
      description: 'Always passes',
      impl: () => true,
    });

    const { chronicle, disconnect } = enableProjectChronicle(registry, engine);

    engine.checkConstraints();

    const events = chronicle.getEvents();
    const checkEvent = events.find(e => e.action === 'constraints-checked');
    expect(checkEvent).toBeDefined();
    expect(checkEvent!.metadata).toMatchObject({ violations: 0 });

    disconnect();
  });

  it('disconnect() restores original methods', () => {
    const { chronicle, disconnect } = enableProjectChronicle(registry, engine);

    registry.registerRule({
      id: 'pre-disconnect',
      description: 'before disconnect',
      impl: () => RuleResult.noop(),
    });

    const countBefore = chronicle.size;
    expect(countBefore).toBeGreaterThan(0);

    disconnect();

    // After disconnect, new registrations should NOT be recorded
    registry.registerRule({
      id: 'post-disconnect',
      description: 'after disconnect',
      impl: () => RuleResult.noop(),
    });

    expect(chronicle.size).toBe(countBefore);
  });

  it('respects recordSteps: false', () => {
    const { chronicle, disconnect } = enableProjectChronicle(registry, engine, {
      recordSteps: false,
    });

    registry.registerRule({
      id: 'r1',
      description: 'r1',
      impl: () => RuleResult.noop(),
    });

    engine.step([{ tag: 'x', payload: {} }]);

    const stepEvents = chronicle.getEvents().filter(e => e.action === 'step-complete');
    expect(stepEvents).toHaveLength(0);

    // But rule registration should still be recorded
    const ruleEvents = chronicle.getEvents().filter(e => e.kind === 'rule');
    expect(ruleEvents.length).toBeGreaterThan(0);

    disconnect();
  });
});

describe('recordAudit', () => {
  it('records a completeness audit', () => {
    const chronicle = createProjectChronicle();
    const report: CompletenessReport = {
      score: 85,
      rating: 'good',
      rules: { total: 10, covered: 8, uncovered: [] },
      constraints: { total: 5, covered: 5, uncovered: [] },
      contracts: { total: 8, withContracts: 6, missing: ['a', 'b'] },
      context: { total: 4, covered: 4, missing: [] },
      events: { total: 6, covered: 5, missing: [] },
    };

    recordAudit(chronicle, report, 80);

    expect(chronicle.size).toBe(1);
    const event = chronicle.getEvents()[0];
    expect(event).toMatchObject({
      kind: 'build',
      action: 'audit-complete',
      subject: 'completeness',
    });
    expect(event.metadata).toMatchObject({
      score: 85,
      delta: 5,
      rating: 'good',
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 6 — Integration: end-to-end scenario
// ═══════════════════════════════════════════════════════════════════════════

describe('End-to-end: chronicle + timeline + diff', () => {
  it('chronicles rule lifecycle and queries it', () => {
    let ts = 1000;
    const chronicle = createProjectChronicle({ now: () => ts++ });
    const timeline = createTimeline(chronicle);

    // Simulate development lifecycle
    chronicle.recordRuleRegistered('auth/login');
    chronicle.recordContractAdded('auth/login');
    chronicle.recordRuleRegistered('auth/logout');
    chronicle.recordRuleModified('auth/login', {
      before: { description: 'v1' },
      after: { description: 'v2' },
    });
    chronicle.recordBuildAudit(75, 0);
    chronicle.recordGateTransition('release', 'closed', 'blocked');
    chronicle.recordExpectationSatisfied('tests-pass');
    chronicle.recordGateTransition('release', 'blocked', 'open');
    chronicle.recordBuildAudit(90, 15);

    // Query timeline
    const ruleHistory = timeline.getHistory('auth/login');
    expect(ruleHistory).toHaveLength(3); // registered, contract added, modified

    // Get delta
    const delta = timeline.getDelta(1000, 1010);
    expect(delta.added).toContain('auth/login');
    expect(delta.added).toContain('auth/logout');
    expect(delta.modified).toContain('auth/login');

    // Check build events
    const builds = timeline.getTimeline({ kind: 'build' });
    expect(builds).toHaveLength(2);

    // Check gate transitions
    const gates = timeline.getTimeline({ kind: 'gate' });
    expect(gates).toHaveLength(2);
    expect(gates[0].action).toBe('blocked');
    expect(gates[1].action).toBe('open');
  });
});
