/**
 * Experiments module tests
 *
 * Covers:
 *  - ExperimentRegistry CRUD
 *  - Factory functions (createFactVerification, createRuleExperiment,
 *    createModelCalibration, createABComparison)
 *  - Sandbox runner: full end-to-end pipeline
 *  - Sandbox runner: timeout enforcement
 *  - Sandbox runner: rule modification isolation (sandbox ≠ production)
 *  - Sandbox runner: assert step evaluation
 */

import { describe, it, expect, vi } from 'vitest';

import {
  ExperimentRegistry,
  createSandboxRunner,
  createFactVerification,
  createRuleExperiment,
  createModelCalibration,
  createABComparison,
} from '../index.js';
import type {
  Experiment,
  ExperimentStep,
  ExperimentResults,
} from '../index.js';

import { PraxisRegistry } from '../../core/rules.js';
import { LogicEngine } from '../../core/engine.js';
import { defineRule, defineFact, defineEvent } from '../../dsl/index.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeDraftExperiment(overrides: Partial<Experiment> = {}): Experiment {
  return {
    id: `exp.test.${Date.now()}`,
    name: 'Test experiment',
    kind: 'fact-verification',
    status: 'draft',
    hypothesis: {
      claim: 'Something is true',
      confidence: 0.8,
      nullHypothesis: 'Something is not true',
    },
    design: {
      steps: [],
      metrics: [],
      maxDurationMs: 5_000,
      maxResourceBudget: 100,
      trials: 1,
    },
    sandbox: {
      isolation: 'none',
      networkAccess: false,
      fileSystemWrites: false,
      maxMemoryBytes: 0,
      maxExecutionMs: 5_000,
      snapshotProductionState: false,
    },
    author: 'test',
    requiresApproval: false,
    constraints: [],
    createdAt: new Date().toISOString(),
    tags: [],
    ...overrides,
  };
}

// ── ExperimentRegistry ────────────────────────────────────────────────────────

describe('ExperimentRegistry', () => {
  it('registers and retrieves an experiment', () => {
    const registry = new ExperimentRegistry();
    const exp = makeDraftExperiment({ id: 'exp.reg.1', name: 'Reg test' });
    registry.register(exp);

    const found = registry.get('exp.reg.1');
    expect(found).toBeDefined();
    expect(found?.name).toBe('Reg test');
  });

  it('throws when registering a duplicate id', () => {
    const registry = new ExperimentRegistry();
    const exp = makeDraftExperiment({ id: 'exp.dup' });
    registry.register(exp);
    expect(() => registry.register(exp)).toThrow(/already registered/);
  });

  it('returns undefined for unknown id', () => {
    const registry = new ExperimentRegistry();
    expect(registry.get('exp.nonexistent')).toBeUndefined();
  });

  it('lists all experiments sorted by createdAt', () => {
    const registry = new ExperimentRegistry();
    const a = makeDraftExperiment({ id: 'exp.a', createdAt: '2024-01-01T00:00:00Z' });
    const b = makeDraftExperiment({ id: 'exp.b', createdAt: '2024-02-01T00:00:00Z' });
    registry.register(b); // register out of order
    registry.register(a);

    const list = registry.list();
    expect(list.map(e => e.id)).toEqual(['exp.a', 'exp.b']);
  });

  it('filters list by status', () => {
    const registry = new ExperimentRegistry();
    registry.register(makeDraftExperiment({ id: 'exp.draft', status: 'draft' }));
    registry.register(makeDraftExperiment({ id: 'exp.approved', status: 'approved' }));

    const drafts = registry.list({ status: 'draft' });
    expect(drafts).toHaveLength(1);
    expect(drafts[0]?.id).toBe('exp.draft');
  });

  it('filters list by kind', () => {
    const registry = new ExperimentRegistry();
    registry.register(makeDraftExperiment({ id: 'exp.fv', kind: 'fact-verification' }));
    registry.register(makeDraftExperiment({ id: 'exp.ab', kind: 'ab-comparison' }));

    expect(registry.list({ kind: 'ab-comparison' })).toHaveLength(1);
    expect(registry.list({ kind: 'ab-comparison' })[0]?.id).toBe('exp.ab');
  });

  it('filters list by tag', () => {
    const registry = new ExperimentRegistry();
    registry.register(
      makeDraftExperiment({ id: 'exp.tagged', tags: ['important', 'perf'] }),
    );
    registry.register(makeDraftExperiment({ id: 'exp.plain', tags: [] }));

    expect(registry.list({ tag: 'perf' })).toHaveLength(1);
    expect(registry.list({ tag: 'perf' })[0]?.id).toBe('exp.tagged');
  });

  it('updateStatus transitions the experiment status', () => {
    const registry = new ExperimentRegistry();
    const exp = makeDraftExperiment({ id: 'exp.upd' });
    registry.register(exp);

    registry.updateStatus('exp.upd', 'approved');
    expect(registry.get('exp.upd')?.status).toBe('approved');

    registry.updateStatus('exp.upd', 'running');
    expect(registry.get('exp.upd')?.status).toBe('running');
    expect(registry.get('exp.upd')?.startedAt).toBeDefined();

    registry.updateStatus('exp.upd', 'completed');
    expect(registry.get('exp.upd')?.completedAt).toBeDefined();
  });

  it('updateStatus throws for unknown id', () => {
    const registry = new ExperimentRegistry();
    expect(() => registry.updateStatus('exp.ghost', 'running')).toThrow(/not found/);
  });

  it('setResults persists results and marks completed', () => {
    const registry = new ExperimentRegistry();
    const exp = makeDraftExperiment({ id: 'exp.res' });
    registry.register(exp);

    const results: ExperimentResults = {
      hypothesisSupported: true,
      confidence: 1,
      observations: [],
      conclusions: ['passed'],
      factUpdates: [],
      newQuestions: [],
      resourceUsage: { durationMs: 10, memoryPeakBytes: 0, apiCalls: 0, tokensUsed: 0 },
    };
    registry.setResults('exp.res', results);

    const found = registry.get('exp.res');
    expect(found?.status).toBe('completed');
    expect(found?.results?.hypothesisSupported).toBe(true);
    expect(found?.completedAt).toBeDefined();
  });

  it('setResults marks failed when results contain error', () => {
    const registry = new ExperimentRegistry();
    registry.register(makeDraftExperiment({ id: 'exp.fail' }));

    const results: ExperimentResults = {
      hypothesisSupported: null,
      confidence: 0,
      observations: [],
      conclusions: [],
      factUpdates: [],
      newQuestions: [],
      error: 'Something went wrong',
      resourceUsage: { durationMs: 5, memoryPeakBytes: 0, apiCalls: 0, tokensUsed: 0 },
    };
    registry.setResults('exp.fail', results);
    expect(registry.get('exp.fail')?.status).toBe('failed');
  });

  it('setResults throws for unknown id', () => {
    const registry = new ExperimentRegistry();
    expect(() =>
      registry.setResults('exp.ghost', {
        hypothesisSupported: null,
        confidence: 0,
        observations: [],
        conclusions: [],
        factUpdates: [],
        newQuestions: [],
        resourceUsage: { durationMs: 0, memoryPeakBytes: 0, apiCalls: 0, tokensUsed: 0 },
      }),
    ).toThrow(/not found/);
  });
});

// ── Factory: createFactVerification ──────────────────────────────────────────

describe('createFactVerification', () => {
  it('creates a fact-verification experiment', () => {
    const exp = createFactVerification({
      factId: 'user.online',
      claim: 'User is online',
      currentConfidence: 0.9,
      verificationSteps: [],
    });

    expect(exp.kind).toBe('fact-verification');
    expect(exp.status).toBe('draft');
    expect(exp.hypothesis.claim).toBe('User is online');
    expect(exp.hypothesis.confidence).toBe(0.9);
    expect(exp.sandbox.isolation).toBe('shared-read');
    expect(exp.requiresApproval).toBe(false);
    expect(exp.tags).toContain('fact-verification');
  });

  it('includes the provided verificationSteps', () => {
    const steps: ExperimentStep[] = [
      { kind: 'observe', metric: 'ping', description: 'Check ping' },
    ];
    const exp = createFactVerification({
      factId: 'net.reachable',
      claim: 'Network reachable',
      currentConfidence: 0.5,
      verificationSteps: steps,
    });
    expect(exp.design.steps).toHaveLength(1);
    expect(exp.design.steps[0]?.kind).toBe('observe');
  });

  it('sets researchQuestionId when provided', () => {
    const exp = createFactVerification({
      factId: 'x',
      claim: 'X is true',
      currentConfidence: 0.5,
      verificationSteps: [],
      researchQuestionId: 'rq.123',
    });
    expect(exp.researchQuestionId).toBe('rq.123');
  });
});

// ── Factory: createRuleExperiment ─────────────────────────────────────────────

describe('createRuleExperiment', () => {
  it('creates a rule-modification experiment', () => {
    const exp = createRuleExperiment({
      ruleId: 'auth.login',
      modification: 'Add rate limiting',
      testCases: [
        {
          input: [{ kind: 'inject-facts', facts: [{ claim: 'User.active', confidence: 1 }] }],
          expectedOutcome: 'Login allowed',
        },
      ],
    });

    expect(exp.kind).toBe('rule-modification');
    expect(exp.requiresApproval).toBe(true);
    expect(exp.sandbox.isolation).toBe('full');
    expect(exp.tags).toContain('self-improvement');
    // steps should include inject-facts + run-engine + observe
    expect(exp.design.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('includes all test case steps', () => {
    const exp = createRuleExperiment({
      ruleId: 'rule.x',
      modification: 'Tweak logic',
      testCases: [
        {
          input: [{ kind: 'inject-facts', facts: [] }],
          expectedOutcome: 'Output A',
        },
        {
          input: [{ kind: 'inject-facts', facts: [] }],
          expectedOutcome: 'Output B',
        },
      ],
    });
    // 2 test cases × 3 steps each = 6
    expect(exp.design.steps).toHaveLength(6);
    expect(exp.design.trials).toBe(2);
  });
});

// ── Factory: createModelCalibration ──────────────────────────────────────────

describe('createModelCalibration', () => {
  it('creates a model-calibration experiment', () => {
    const exp = createModelCalibration({
      modelId: 'gpt-4o',
      testPrompts: [
        { prompt: 'Summarize this text', expectedPattern: '.*', category: 'summarization' },
        { prompt: 'Translate to French', expectedPattern: '.*', category: 'translation' },
      ],
      temperature: 0.5,
    });

    expect(exp.kind).toBe('model-calibration');
    expect(exp.design.steps).toHaveLength(2);
    expect(exp.design.trials).toBe(2);
    expect(exp.sandbox.networkAccess).toBe(true);
    expect(exp.requiresApproval).toBe(true);
    expect(exp.tags).toContain('model-calibration');
  });

  it('uses temperature 0 by default', () => {
    const exp = createModelCalibration({
      modelId: 'llm',
      testPrompts: [{ prompt: 'P', expectedPattern: 'P', category: 'c' }],
    });
    const step = exp.design.steps[0];
    expect(step?.kind).toBe('model-prompt');
    if (step?.kind === 'model-prompt') {
      expect(step.temperature).toBe(0);
    }
  });
});

// ── Factory: createABComparison ───────────────────────────────────────────────

describe('createABComparison', () => {
  it('creates an ab-comparison experiment', () => {
    const exp = createABComparison({
      name: 'Load vs Lazy',
      strategyA: { label: 'Eager load', steps: [] },
      strategyB: { label: 'Lazy load', steps: [] },
      comparisonMetrics: ['latency', 'memory'],
      inputSteps: [{ kind: 'inject-facts', facts: [] }],
    });

    expect(exp.kind).toBe('ab-comparison');
    expect(exp.requiresApproval).toBe(true);
    expect(exp.design.trials).toBe(2);
    expect(exp.design.control).toBeDefined();
    expect(exp.design.control?.description).toBe('Lazy load');
    expect(exp.design.metrics).toEqual(['latency', 'memory']);
    expect(exp.tags).toContain('ab-comparison');
  });

  it('concatenates inputSteps with strategyA steps in main design', () => {
    const inputStep: ExperimentStep = { kind: 'inject-facts', facts: [] };
    const stratAStep: ExperimentStep = { kind: 'run-engine', maxSteps: 5 };
    const exp = createABComparison({
      name: 'Strat compare',
      strategyA: { label: 'A', steps: [stratAStep] },
      strategyB: { label: 'B', steps: [] },
      comparisonMetrics: ['quality'],
      inputSteps: [inputStep],
    });

    expect(exp.design.steps).toHaveLength(2); // inputStep + stratAStep
    expect(exp.design.steps[0]?.kind).toBe('inject-facts');
    expect(exp.design.steps[1]?.kind).toBe('run-engine');
  });
});

// ── Sandbox Runner ────────────────────────────────────────────────────────────

describe('createSandboxRunner', () => {
  it('runs a simple inject-facts → observe pipeline', async () => {
    const runner = createSandboxRunner({});
    const exp = makeDraftExperiment({
      design: {
        steps: [
          {
            kind: 'inject-facts',
            facts: [{ claim: 'User.online', confidence: 1.0 }],
          },
          {
            kind: 'observe',
            metric: 'fact-count',
            description: 'How many facts are present?',
          },
        ],
        metrics: ['fact-count'],
        maxDurationMs: 5_000,
        maxResourceBudget: 100,
        trials: 1,
      },
    });

    const results = await runner.run(exp);
    expect(results.error).toBeUndefined();
    const factInjected = results.observations.find(o => o.metric === 'fact-injected');
    expect(factInjected?.value).toBe('User.online');
  });

  it('runs inject-events → run-engine pipeline using a real PraxisRegistry', async () => {
    interface Ctx { fired: boolean }
    const EventFired = defineFact<'EventFired', { tag: string }>('EventFired');
    const TestEvent = defineEvent<'TEST_EVENT', {}>('TEST_EVENT');

    const rule = defineRule<Ctx>({
      id: 'test.fire',
      description: 'Fire on TEST_EVENT',
      impl: (_state, events) => {
        if (events.some(TestEvent.is)) {
          return [EventFired.create({ tag: 'TEST_EVENT' })];
        }
        return [];
      },
    });

    const prodRegistry = new PraxisRegistry<Ctx>({ compliance: { enabled: false } });
    prodRegistry.registerRule(rule);

    const prodEngine = new LogicEngine<Ctx>({
      initialContext: { fired: false },
      registry: prodRegistry,
    });

    const runner = createSandboxRunner({
      productionRegistry: prodRegistry as PraxisRegistry,
      productionEngine: prodEngine as LogicEngine,
    });

    const exp = makeDraftExperiment({
      design: {
        steps: [
          {
            kind: 'inject-events',
            events: [{ tag: 'TEST_EVENT', payload: {} }],
          },
          { kind: 'run-engine', maxSteps: 1 },
          { kind: 'observe', metric: 'post-run', description: 'After engine run' },
        ],
        metrics: ['post-run'],
        maxDurationMs: 5_000,
        maxResourceBudget: 100,
        trials: 1,
      },
    });

    const results = await runner.run(exp);
    expect(results.error).toBeUndefined();

    const engineRan = results.observations.find(o => o.metric === 'engine-ran');
    expect(engineRan).toBeDefined();
    const engineValue = engineRan?.value as { factCount: number } | undefined;
    // EventFired fact should have been generated
    expect(engineValue?.factCount).toBeGreaterThanOrEqual(1);

    // Production engine must NOT have been affected
    expect(prodEngine.getFacts()).toHaveLength(0);
  });

  it('enforces timeout and returns error result', async () => {
    const onResourceExceeded = vi.fn();
    const runner = createSandboxRunner({ onResourceExceeded });

    const exp = makeDraftExperiment({
      sandbox: {
        isolation: 'none',
        networkAccess: false,
        fileSystemWrites: false,
        maxMemoryBytes: 0,
        maxExecutionMs: 1, // 1ms — will time out immediately
        snapshotProductionState: false,
      },
      design: {
        steps: [
          { kind: 'wait', durationMs: 500 }, // longer than timeout
        ],
        metrics: [],
        maxDurationMs: 1,
        maxResourceBudget: 100,
        trials: 1,
      },
    });

    const results = await runner.run(exp);
    expect(results.error).toBeDefined();
    expect(results.error).toMatch(/timed out/i);
    expect(onResourceExceeded).toHaveBeenCalledWith('timeout', expect.any(Number), 1);
  });

  it('modifies rule in sandbox without affecting production registry', async () => {
    interface Ctx { value: number }
    const OriginalFired = defineFact<'OriginalFired', {}>('OriginalFired');
    const PatchedFired = defineFact<'PatchedFired', {}>('PatchedFired');
    const RunEvent = defineEvent<'RUN', {}>('RUN');

    const originalRule = defineRule<Ctx>({
      id: 'mutable.rule',
      description: 'Original rule',
      impl: (_state, events) =>
        events.some(RunEvent.is) ? [OriginalFired.create({})] : [],
    });

    const patchedRule = defineRule<Ctx>({
      id: 'mutable.rule',
      description: 'Patched rule',
      impl: (_state, events) =>
        events.some(RunEvent.is) ? [PatchedFired.create({})] : [],
    });

    const prodRegistry = new PraxisRegistry<Ctx>({ compliance: { enabled: false } });
    prodRegistry.registerRule(originalRule);

    const prodEngine = new LogicEngine<Ctx>({
      initialContext: { value: 0 },
      registry: prodRegistry,
    });

    const rulePatches = new Map<string, ReturnType<typeof defineRule>>([
      ['mutable.rule', patchedRule],
    ]);

    const runner = createSandboxRunner({
      productionRegistry: prodRegistry as PraxisRegistry,
      productionEngine: prodEngine as LogicEngine,
      rulePatches: rulePatches as Map<string, import('../../core/rules.js').RuleDescriptor<unknown>>,
    });

    const exp = makeDraftExperiment({
      design: {
        steps: [
          { kind: 'modify-rule', ruleId: 'mutable.rule', modification: 'Use PatchedFired' },
          { kind: 'inject-events', events: [{ tag: 'RUN', payload: {} }] },
          { kind: 'run-engine', maxSteps: 1 },
          { kind: 'observe', metric: 'sandbox-facts', description: 'Sandbox state' },
        ],
        metrics: ['sandbox-facts'],
        maxDurationMs: 5_000,
        maxResourceBudget: 100,
        trials: 1,
      },
    });

    const results = await runner.run(exp);
    expect(results.error).toBeUndefined();

    // Sandbox should have produced PatchedFired
    const engineRan = results.observations.find(o => o.metric === 'engine-ran');
    const engineValue = engineRan?.value as { factCount: number } | undefined;
    expect(engineValue?.factCount).toBeGreaterThanOrEqual(1);

    const modObs = results.observations.find(o => o.metric === 'rule-modified');
    expect(modObs).toBeDefined();
    const modValue = modObs?.value as { applied: boolean } | undefined;
    expect(modValue?.applied).toBe(true);

    // Production registry still has the original rule
    const prodRule = prodRegistry.getRule('mutable.rule');
    expect(prodRule?.description).toBe('Original rule');

    // Production engine untouched
    expect(prodEngine.getFacts()).toHaveLength(0);
  });

  it('evaluates assert step against fact presence (boolean expected)', async () => {
    interface Ctx { x: number }
    const MyFact = defineFact<'MyFact', {}>('MyFact');
    const TriggerEvent = defineEvent<'TRIGGER', {}>('TRIGGER');

    const rule = defineRule<Ctx>({
      id: 'assert.rule',
      description: 'Produce MyFact on TRIGGER',
      impl: (_state, events) =>
        events.some(TriggerEvent.is) ? [MyFact.create({})] : [],
    });

    const registry = new PraxisRegistry<Ctx>({ compliance: { enabled: false } });
    registry.registerRule(rule);

    const engine = new LogicEngine<Ctx>({
      initialContext: { x: 0 },
      registry,
    });

    const runner = createSandboxRunner({
      productionRegistry: registry as PraxisRegistry,
      productionEngine: engine as LogicEngine,
    });

    const exp = makeDraftExperiment({
      design: {
        steps: [
          { kind: 'inject-events', events: [{ tag: 'TRIGGER', payload: {} }] },
          { kind: 'run-engine', maxSteps: 1 },
          // Assert that 'MyFact' is present (true)
          { kind: 'assert', condition: 'MyFact', expected: true },
          // Assert that 'NonExistentFact' is absent (false)
          { kind: 'assert', condition: 'NonExistentFact', expected: false },
        ],
        metrics: [],
        maxDurationMs: 5_000,
        maxResourceBudget: 100,
        trials: 1,
      },
    });

    const results = await runner.run(exp);
    expect(results.error).toBeUndefined();

    const passed = results.observations.filter(o => o.metric === 'assertion-passed');
    const failed = results.observations.filter(o => o.metric === 'assertion-failed');
    expect(passed).toHaveLength(2);
    expect(failed).toHaveLength(0);

    expect(results.hypothesisSupported).toBe(true);
    expect(results.confidence).toBe(1);
  });

  it('marks hypothesis not supported when assertions fail', async () => {
    interface Ctx { x: number }
    const MyFact = defineFact<'MyFact', {}>('MyFact');

    const registry = new PraxisRegistry<Ctx>({ compliance: { enabled: false } });
    const engine = new LogicEngine<Ctx>({
      initialContext: { x: 0 },
      registry,
    });

    const runner = createSandboxRunner({
      productionRegistry: registry as PraxisRegistry,
      productionEngine: engine as LogicEngine,
    });

    const exp = makeDraftExperiment({
      design: {
        steps: [
          { kind: 'run-engine', maxSteps: 1 },
          // Expect MyFact to be present — it won't be (no rule produces it)
          { kind: 'assert', condition: MyFact.tag, expected: true },
        ],
        metrics: [],
        maxDurationMs: 5_000,
        maxResourceBudget: 100,
        trials: 1,
      },
    });

    const results = await runner.run(exp);
    expect(results.error).toBeUndefined();
    expect(results.hypothesisSupported).toBe(false);
    expect(results.confidence).toBe(0);

    const failed = results.observations.filter(o => o.metric === 'assertion-failed');
    expect(failed).toHaveLength(1);
  });

  it('returns null hypothesis when no assertions are made', async () => {
    const runner = createSandboxRunner({});
    const exp = makeDraftExperiment({
      design: {
        steps: [
          { kind: 'observe', metric: 'state', description: 'Just observe' },
        ],
        metrics: ['state'],
        maxDurationMs: 5_000,
        maxResourceBudget: 100,
        trials: 1,
      },
    });

    const results = await runner.run(exp);
    expect(results.hypothesisSupported).toBeNull();
    expect(results.confidence).toBe(0);
  });

  it('records resource usage', async () => {
    const runner = createSandboxRunner({});
    const exp = makeDraftExperiment({
      design: {
        steps: [
          { kind: 'model-prompt', prompt: 'Hello', expectedPattern: '.*', temperature: 0 },
          { kind: 'external-query', source: 'db', query: 'SELECT 1', timeout: 500 },
        ],
        metrics: [],
        maxDurationMs: 5_000,
        maxResourceBudget: 100,
        trials: 1,
      },
    });

    const results = await runner.run(exp);
    expect(results.resourceUsage.apiCalls).toBe(2);
    expect(results.resourceUsage.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('seeds sandbox with productionFacts map when no engine provided', async () => {
    const prodFacts = new Map<string, unknown>([
      ['fact.a', { claim: 'A', confidence: 1 }],
    ]);

    const runner = createSandboxRunner({ productionFacts: prodFacts });

    const exp = makeDraftExperiment({
      design: {
        steps: [
          { kind: 'run-engine', maxSteps: 1 },
          { kind: 'observe', metric: 'seed-check', description: 'Check seeded facts' },
        ],
        metrics: ['seed-check'],
        maxDurationMs: 5_000,
        maxResourceBudget: 100,
        trials: 1,
      },
    });

    const results = await runner.run(exp);
    expect(results.error).toBeUndefined();

    // Production map must remain unchanged
    expect(prodFacts.size).toBe(1);
    expect(prodFacts.get('fact.a')).toBeDefined();
  });
});
