/**
 * Integration Hub — End-to-End Tests
 *
 * Tests for:
 * - Full cycle: seed facts → run cycle → verify analysis → check research → verify experiments
 * - Prediction lifecycle: predict → resolve → check calibration
 * - Health score computation (deterministic for given inputs)
 * - Chronos event recording verification
 * - getExperimentTimeline()
 * - getCausalChain(factId)
 *
 * Per ADR-0008 (Self-Improving Loop)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createHub } from '../hub.js';
import type { PraxisHub, HubConfig, CausalChainLink } from '../hub.js';
import { ExperimentRegistry } from '../../experiments/index.js';
import type { UncertainFact, Evidence } from '../../uncertainty/index.js';
import { createProjectChronicle } from '../../chronos/project-chronicle.js';
import type { ProjectChronicle } from '../../chronos/project-chronicle.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeFact(
  id: string,
  claim: string,
  confidence: number,
  opts: Partial<UncertainFact> = {},
): UncertainFact {
  return {
    id,
    claim,
    confidence,
    source: 'observation',
    evidence: [],
    contraEvidence: [],
    dependsOn: [],
    lastVerified: null,
    createdAt: new Date().toISOString(),
    tags: [],
    ...opts,
  };
}

function makeHub(
  facts: Map<string, UncertainFact>,
  chronicle?: ProjectChronicle,
  overrides: Partial<HubConfig> = {},
): PraxisHub {
  return createHub({
    facts,
    experiments: new ExperimentRegistry(),
    expectedDomains: ['auth', 'data'],
    staleThresholdDays: 30,
    autoApproveThreshold: 100,
    chronicle,
    ...overrides,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// § 1 — Full cycle
// ═══════════════════════════════════════════════════════════════════════════

describe('Full cycle', () => {
  let facts: Map<string, UncertainFact>;
  let hub: PraxisHub;

  beforeEach(() => {
    facts = new Map([
      ['fact.auth.login', makeFact('fact.auth.login', 'Login succeeds with valid credentials', 0.9, { source: 'verified', tags: ['auth'] })],
      ['fact.data.persist', makeFact('fact.data.persist', 'Data persists across restarts', 0.5, { tags: ['data'] })],
    ]);
    hub = makeHub(facts);
  });

  it('runs without errors and returns a CycleResult', async () => {
    const result = await hub.runCycle();
    expect(result).toBeDefined();
    expect(result.analysis).toBeDefined();
    expect(result.agenda).toBeDefined();
    expect(typeof result.appliedUpdates).toBe('number');
    expect(typeof result.timestamp).toBe('string');
  });

  it('analysis report reflects seeded facts', async () => {
    const result = await hub.runCycle();
    expect(result.analysis.factCoverage.totalFacts).toBe(2);
    expect(result.analysis.factCoverage.verifiedFacts).toBeGreaterThanOrEqual(1);
  });

  it('latestAnalysis() returns the report from the most recent cycle', async () => {
    expect(hub.latestAnalysis()).toBeNull();
    await hub.runCycle();
    const report = hub.latestAnalysis();
    expect(report).not.toBeNull();
    expect(report!.factCoverage.totalFacts).toBe(2);
  });

  it('research questions are generated from coverage gaps', async () => {
    const result = await hub.runCycle();
    // The agenda should be populated
    expect(result.agenda).toBeDefined();
    expect(Array.isArray(result.agenda.questions)).toBe(true);
  });

  it('activeResearch() returns only non-completed questions', async () => {
    await hub.runCycle();
    const active = hub.activeResearch();
    for (const q of active) {
      expect(q.status).not.toBe('completed');
      expect(q.status).not.toBe('abandoned');
    }
  });

  it('experiment proposals split by auto-approve threshold', async () => {
    const result = await hub.runCycle();
    // autoApproveThreshold is 100, createFactVerification uses maxResourceBudget 100
    // so all auto-generated experiments should be approved
    for (const exp of result.autoApprovedExperiments) {
      expect(exp.status).toBe('approved');
    }
  });

  it('applies completed experiment results on next cycle', async () => {
    const registry = new ExperimentRegistry();
    const facts2 = new Map([
      ['fact.data.persist', makeFact('fact.data.persist', 'Data persists', 0.4, { tags: ['data'] })],
    ]);
    const hub2 = createHub({
      facts: facts2,
      experiments: registry,
      // Use empty expectedDomains so runCycle() doesn't auto-generate competing experiments
      expectedDomains: [],
      staleThresholdDays: 30,
      autoApproveThreshold: 100,
    });

    // Register a completed experiment with fact updates (using a distinct prefix)
    const expId = `exp.manual.verify.fact.data.persist.${Date.now()}`;
    registry.register({
      id: expId,
      name: 'Verify: Data persists',
      kind: 'fact-verification',
      status: 'completed',
      hypothesis: { claim: 'Data persists', confidence: 0.4, nullHypothesis: '' },
      design: { steps: [], metrics: [], maxDurationMs: 1000, maxResourceBudget: 10, trials: 1 },
      sandbox: { isolation: 'none', networkAccess: false, fileSystemWrites: false, maxMemoryBytes: 1024, maxExecutionMs: 1000, snapshotProductionState: false },
      results: {
        hypothesisSupported: true,
        confidence: 0.9,
        observations: [{ metric: 'verification-result', value: true, timestamp: new Date().toISOString() }],
        conclusions: ['Data persists as expected'],
        factUpdates: [{ factId: 'fact.data.persist', action: 'update-confidence', details: { confidence: 0.9 } }],
        newQuestions: [],
        resourceUsage: { durationMs: 100, memoryPeakBytes: 1024, apiCalls: 0, tokensUsed: 0 },
      },
      author: 'test',
      requiresApproval: false,
      constraints: [],
      createdAt: new Date().toISOString(),
      tags: [],
    });

    const result = await hub2.runCycle();
    expect(result.appliedUpdates).toBeGreaterThanOrEqual(1);
    expect(facts2.get('fact.data.persist')!.confidence).toBeCloseTo(0.9);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 2 — Prediction lifecycle
// ═══════════════════════════════════════════════════════════════════════════

describe('Prediction lifecycle', () => {
  let hub: PraxisHub;

  beforeEach(() => {
    hub = makeHub(new Map());
  });

  it('predict() returns a Prediction with the given fields', () => {
    const pred = hub.predict('Auth will be stable', 0.8, '2025-12-31', 'Historical trend');
    expect(pred.id).toMatch(/^pred\./);
    expect(pred.claim).toBe('Auth will be stable');
    expect(pred.confidence).toBe(0.8);
    expect(pred.deadline).toBe('2025-12-31');
    expect(pred.outcome).toBeUndefined();
  });

  it('resolvePrediction() marks the prediction outcome', () => {
    const pred = hub.predict('Auth will be stable', 0.8, '2025-12-31', 'Historical trend');
    hub.resolvePrediction(pred.id, 'correct', 'Auth stayed stable all quarter');
    const health = hub.health();
    expect(health.metrics.predictionAccuracy).toBe(1);
  });

  it('predictionAccuracy drops when prediction is incorrect', () => {
    const p = hub.predict('Auth will fail', 0.3, '2025-12-31', '');
    hub.resolvePrediction(p.id, 'incorrect', 'Auth stayed stable');
    const h = hub.health();
    expect(h.metrics.predictionAccuracy).toBe(0);
  });

  it('resolvePrediction() throws for unknown prediction id', () => {
    expect(() => hub.resolvePrediction('pred.does-not-exist', 'correct', '')).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 3 — Health score computation
// ═══════════════════════════════════════════════════════════════════════════

describe('Health score computation', () => {
  it('is deterministic for identical inputs', () => {
    const facts = new Map([
      ['f1', makeFact('f1', 'Claim A', 0.8, { source: 'verified' })],
      ['f2', makeFact('f2', 'Claim B', 0.9, { source: 'verified' })],
    ]);
    const hub1 = makeHub(new Map(facts));
    const hub2 = makeHub(new Map(facts));
    expect(hub1.health().score).toBe(hub2.health().score);
  });

  it('returns green when mean confidence is high and no stale facts', () => {
    const facts = new Map([
      ['f1', makeFact('f1', 'High confidence fact', 0.95, { source: 'verified', lastVerified: new Date().toISOString() })],
      ['f2', makeFact('f2', 'Also high', 0.9, { source: 'verified', lastVerified: new Date().toISOString() })],
    ]);
    const hub = makeHub(facts);
    const h = hub.health();
    expect(h.score).toBeGreaterThanOrEqual(0.7);
    expect(h.status).toBe('green');
  });

  it('returns red when mean confidence is very low', () => {
    const facts = new Map([
      ['f1', makeFact('f1', 'Uncertain fact A', 0.1)],
      ['f2', makeFact('f2', 'Uncertain fact B', 0.1)],
    ]);
    const hub = makeHub(facts);
    const h = hub.health();
    expect(h.score).toBeLessThan(0.5);
    expect(h.status).toBe('red');
  });

  it('metrics object contains all expected keys', () => {
    const hub = makeHub(new Map());
    const h = hub.health();
    const keys: Array<keyof typeof h.metrics> = [
      'factCount', 'meanConfidence', 'coverageRatio', 'predictionAccuracy',
      'activeExperiments', 'pendingResearch', 'staleFactCount', 'criticalChainCount',
    ];
    for (const key of keys) {
      expect(h.metrics).toHaveProperty(key);
    }
  });

  it('staleFactCount increments for facts past stale threshold', () => {
    const oldDate = new Date(Date.now() - 60 * 86_400_000).toISOString(); // 60 days ago
    const facts = new Map([
      ['f1', makeFact('f1', 'Old fact', 0.7, { source: 'verified', lastVerified: oldDate })],
      ['f2', makeFact('f2', 'Fresh fact', 0.7, { source: 'verified', lastVerified: new Date().toISOString() })],
    ]);
    const hub = makeHub(facts);
    expect(hub.health().metrics.staleFactCount).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 4 — Chronos event recording
// ═══════════════════════════════════════════════════════════════════════════

describe('Chronos event recording', () => {
  let chronicle: ProjectChronicle;
  let hub: PraxisHub;

  beforeEach(() => {
    let ts = 1_000_000;
    chronicle = createProjectChronicle({ now: () => ts++ });
    const facts = new Map([
      ['fact.auth', makeFact('fact.auth', 'Auth works', 0.8, { source: 'verified', tags: ['auth'] })],
    ]);
    hub = makeHub(facts, chronicle);
  });

  it('runCycle() records cycle-started and cycle-completed events', async () => {
    await hub.runCycle();
    const events = chronicle.getEvents();
    const actions = events.map(e => e.action);
    expect(actions).toContain('cycle-started');
    expect(actions).toContain('cycle-completed');
  });

  it('cycle events have kind "cycle"', async () => {
    await hub.runCycle();
    const cycleEvents = chronicle.getEvents().filter(e => e.kind === 'cycle');
    expect(cycleEvents.length).toBeGreaterThanOrEqual(2);
  });

  it('predict() records a prediction-made event', () => {
    hub.predict('Stability will hold', 0.8, '2025-12-31', '');
    const events = chronicle.getEvents();
    const pred = events.find(e => e.action === 'prediction-made');
    expect(pred).toBeDefined();
    expect(pred!.kind).toBe('prediction');
  });

  it('resolvePrediction() records a prediction-resolved event', () => {
    const p = hub.predict('Stability will hold', 0.8, '2025-12-31', '');
    hub.resolvePrediction(p.id, 'correct', 'It held');
    const events = chronicle.getEvents();
    const resolved = events.find(e => e.action === 'prediction-resolved');
    expect(resolved).toBeDefined();
    expect(resolved!.kind).toBe('prediction');
    expect(resolved!.subject).toBe(p.id);
  });

  it('applyResults() records an experiment-results event', () => {
    const registry = new ExperimentRegistry();
    const expId = `exp.test.${Date.now()}`;
    registry.register({
      id: expId,
      name: 'Test exp',
      kind: 'fact-verification',
      status: 'draft',
      hypothesis: { claim: 'works', confidence: 0.5, nullHypothesis: '' },
      design: { steps: [], metrics: [], maxDurationMs: 1000, maxResourceBudget: 10, trials: 1 },
      sandbox: { isolation: 'none', networkAccess: false, fileSystemWrites: false, maxMemoryBytes: 1024, maxExecutionMs: 1000, snapshotProductionState: false },
      author: 'test',
      requiresApproval: false,
      constraints: [],
      createdAt: new Date().toISOString(),
      tags: [],
    });
    const hub2 = createHub({
      facts: new Map(),
      experiments: registry,
      expectedDomains: [],
      staleThresholdDays: 30,
      autoApproveThreshold: 100,
      chronicle,
    });
    hub2.applyResults(expId, {
      hypothesisSupported: true,
      confidence: 0.9,
      observations: [],
      conclusions: [],
      factUpdates: [],
      newQuestions: [],
      resourceUsage: { durationMs: 10, memoryPeakBytes: 0, apiCalls: 0, tokensUsed: 0 },
    });
    const expEvent = chronicle.getEvents().find(e => e.action === 'experiment-results');
    expect(expEvent).toBeDefined();
    expect(expEvent!.kind).toBe('experiment');
    expect(expEvent!.subject).toBe(expId);
  });

  it('fact updates inside runCycle() record fact events to chronicle', async () => {
    const registry = new ExperimentRegistry();
    const facts = new Map([
      ['fact.data', makeFact('fact.data', 'Data persists', 0.4, { tags: ['data'] })],
    ]);
    // Use a unique ID prefix that cannot collide with createFactVerification output
    const expId = `exp.manual.fact.data.${Date.now()}`;
    registry.register({
      id: expId,
      name: 'Verify: Data persists',
      kind: 'fact-verification',
      status: 'completed',
      hypothesis: { claim: 'Data persists', confidence: 0.4, nullHypothesis: '' },
      design: { steps: [], metrics: [], maxDurationMs: 1000, maxResourceBudget: 10, trials: 1 },
      sandbox: { isolation: 'none', networkAccess: false, fileSystemWrites: false, maxMemoryBytes: 1024, maxExecutionMs: 1000, snapshotProductionState: false },
      results: {
        hypothesisSupported: true,
        confidence: 0.85,
        observations: [],
        conclusions: [],
        factUpdates: [{ factId: 'fact.data', action: 'update-confidence', details: { confidence: 0.85 } }],
        newQuestions: [],
        resourceUsage: { durationMs: 10, memoryPeakBytes: 0, apiCalls: 0, tokensUsed: 0 },
      },
      author: 'test',
      requiresApproval: false,
      constraints: [],
      createdAt: new Date().toISOString(),
      tags: [],
    });
    let ts2 = 2_000_000;
    const chronicle2 = createProjectChronicle({ now: () => ts2++ });
    // Use expectedDomains: [] so runCycle() doesn't try to auto-generate competing fact-verification experiments
    const hub3 = createHub({ facts, experiments: registry, expectedDomains: [], staleThresholdDays: 30, autoApproveThreshold: 100, chronicle: chronicle2 });
    await hub3.runCycle();
    const factEvents = chronicle2.getEvents().filter(e => e.kind === 'fact' && e.action === 'fact-updated');
    expect(factEvents.length).toBeGreaterThanOrEqual(1);
    expect(factEvents[0].subject).toBe('fact.data');
  });

  it('chronicle has no events before any hub operations', () => {
    expect(chronicle.size).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 5 — getExperimentTimeline()
// ═══════════════════════════════════════════════════════════════════════════

describe('getExperimentTimeline()', () => {
  it('returns empty array when no chronicle is configured', async () => {
    const hub = makeHub(new Map());
    const timeline = hub.getExperimentTimeline();
    expect(timeline).toEqual([]);
  });

  it('returns experiment events in chronological order', async () => {
    const registry = new ExperimentRegistry();
    const chronicle = createProjectChronicle();
    // Pre-register experiments so applyResults() can find them
    const makeExp = (id: string) => ({
      id,
      name: `Exp ${id}`,
      kind: 'fact-verification' as const,
      status: 'draft' as const,
      hypothesis: { claim: 'works', confidence: 0.5, nullHypothesis: '' },
      design: { steps: [], metrics: [], maxDurationMs: 1000, maxResourceBudget: 10, trials: 1 },
      sandbox: { isolation: 'none' as const, networkAccess: false, fileSystemWrites: false, maxMemoryBytes: 1024, maxExecutionMs: 1000, snapshotProductionState: false },
      author: 'test',
      requiresApproval: false,
      constraints: [],
      createdAt: new Date().toISOString(),
      tags: [],
    });
    registry.register(makeExp('exp.a'));
    registry.register(makeExp('exp.b'));

    const hub = createHub({ facts: new Map(), experiments: registry, expectedDomains: [], staleThresholdDays: 30, autoApproveThreshold: 100, chronicle });
    const results = {
      hypothesisSupported: true,
      confidence: 0.9,
      observations: [],
      conclusions: [],
      factUpdates: [],
      newQuestions: [],
      resourceUsage: { durationMs: 10, memoryPeakBytes: 0, apiCalls: 0, tokensUsed: 0 },
    };
    hub.applyResults('exp.a', results);
    hub.applyResults('exp.b', { ...results, hypothesisSupported: false, confidence: 0.4 });

    const timeline = hub.getExperimentTimeline();
    expect(timeline.length).toBe(2);
    expect(timeline.every(e => e.kind === 'experiment')).toBe(true);
    // Chronological order: first event timestamp <= last event timestamp
    if (timeline.length >= 2) {
      expect(timeline[0].timestamp).toBeLessThanOrEqual(timeline[1].timestamp);
    }
  });

  it('does not include cycle or prediction events in experiment timeline', async () => {
    const chronicle = createProjectChronicle();
    const facts = new Map([['f1', makeFact('f1', 'Claim', 0.8)]]);
    const hub = makeHub(facts, chronicle);

    await hub.runCycle();
    hub.predict('some claim', 0.7, '2025-12-31', '');

    const timeline = hub.getExperimentTimeline();
    expect(timeline.every(e => e.kind === 'experiment')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 6 — getCausalChain()
// ═══════════════════════════════════════════════════════════════════════════

describe('getCausalChain()', () => {
  it('returns empty array for unknown factId', () => {
    const hub = makeHub(new Map());
    expect(hub.getCausalChain('fact.does-not-exist')).toEqual([]);
  });

  it('returns a single fact link when no experiments reference it', () => {
    const facts = new Map([
      ['fact.auth', makeFact('fact.auth', 'Auth works', 0.8)],
    ]);
    const hub = makeHub(facts);
    const chain = hub.getCausalChain('fact.auth');
    expect(chain).toHaveLength(1);
    expect(chain[0].kind).toBe('fact');
    expect(chain[0].id).toBe('fact.auth');
    expect(chain[0].confidence).toBe(0.8);
  });

  it('traces fact → experiment → observation', async () => {
    const registry = new ExperimentRegistry();
    const facts = new Map([
      ['fact.perf', makeFact('fact.perf', 'Perf is acceptable', 0.5)],
    ]);
    const expId = `exp.verify.fact.perf.${Date.now()}`;
    const obsTimestamp = new Date().toISOString();
    registry.register({
      id: expId,
      name: 'Verify: Perf is acceptable',
      kind: 'fact-verification',
      status: 'completed',
      hypothesis: { claim: 'Perf is acceptable', confidence: 0.5, nullHypothesis: '' },
      design: { steps: [], metrics: [], maxDurationMs: 1000, maxResourceBudget: 10, trials: 1 },
      sandbox: { isolation: 'none', networkAccess: false, fileSystemWrites: false, maxMemoryBytes: 1024, maxExecutionMs: 1000, snapshotProductionState: false },
      results: {
        hypothesisSupported: true,
        confidence: 0.85,
        observations: [{ metric: 'p99-latency-ms', value: 42, timestamp: obsTimestamp }],
        conclusions: ['Performance is within SLA'],
        factUpdates: [{ factId: 'fact.perf', action: 'update-confidence', details: { confidence: 0.85 } }],
        newQuestions: [],
        resourceUsage: { durationMs: 100, memoryPeakBytes: 1024, apiCalls: 1, tokensUsed: 0 },
      },
      author: 'test',
      requiresApproval: false,
      constraints: [],
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      tags: [],
    });

    const hub = createHub({ facts, experiments: registry, expectedDomains: [], staleThresholdDays: 30, autoApproveThreshold: 100 });
    const chain = hub.getCausalChain('fact.perf');

    // Should contain: fact + experiment + observation
    expect(chain.length).toBeGreaterThanOrEqual(3);

    const factLinks = chain.filter((l: CausalChainLink) => l.kind === 'fact');
    const expLinks = chain.filter((l: CausalChainLink) => l.kind === 'experiment');
    const obsLinks = chain.filter((l: CausalChainLink) => l.kind === 'observation');

    expect(factLinks).toHaveLength(1);
    expect(factLinks[0].id).toBe('fact.perf');

    expect(expLinks).toHaveLength(1);
    expect(expLinks[0].id).toBe(expId);

    expect(obsLinks).toHaveLength(1);
    expect(obsLinks[0].description).toContain('p99-latency-ms');
  });

  it('chain is sorted chronologically', () => {
    const registry = new ExperimentRegistry();
    const factCreated = new Date(Date.now() - 10_000).toISOString();
    const expCompleted = new Date(Date.now() - 5_000).toISOString();
    const obsTimestamp = new Date(Date.now() - 3_000).toISOString();

    const facts = new Map([
      ['fact.x', makeFact('fact.x', 'X is true', 0.6, { createdAt: factCreated })],
    ]);
    const expId = `exp.verify.fact.x.${Date.now()}`;
    registry.register({
      id: expId,
      name: 'Verify X',
      kind: 'fact-verification',
      status: 'completed',
      hypothesis: { claim: 'X is true', confidence: 0.6, nullHypothesis: '' },
      design: { steps: [], metrics: [], maxDurationMs: 1000, maxResourceBudget: 10, trials: 1 },
      sandbox: { isolation: 'none', networkAccess: false, fileSystemWrites: false, maxMemoryBytes: 1024, maxExecutionMs: 1000, snapshotProductionState: false },
      results: {
        hypothesisSupported: true,
        confidence: 0.8,
        observations: [{ metric: 'check', value: true, timestamp: obsTimestamp }],
        conclusions: [],
        factUpdates: [{ factId: 'fact.x', action: 'update-confidence', details: { confidence: 0.8 } }],
        newQuestions: [],
        resourceUsage: { durationMs: 10, memoryPeakBytes: 0, apiCalls: 0, tokensUsed: 0 },
      },
      author: 'test',
      requiresApproval: false,
      constraints: [],
      createdAt: factCreated,
      completedAt: expCompleted,
      tags: [],
    });

    const hub = createHub({ facts, experiments: registry, expectedDomains: [], staleThresholdDays: 30, autoApproveThreshold: 100 });
    const chain = hub.getCausalChain('fact.x');

    for (let i = 1; i < chain.length; i++) {
      expect(chain[i].timestamp >= chain[i - 1].timestamp).toBe(true);
    }
  });
});
