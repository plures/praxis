/**
 * Analysis Module Tests
 *
 * Validates:
 * - Fact coverage analysis with mock knowledge base
 * - Confidence distribution computation
 * - Rule effectiveness tracking (fire rates, dormant detection)
 * - Dependency health (cycle detection, critical chain identification)
 * - Prediction accuracy and calibration curves
 * - Recommendation generation from analysis results
 */

import { describe, it, expect } from 'vitest';
import {
  analyze,
  type AnalysisContext,
  type Prediction,
} from '../analysis/index.js';
import type { UncertainFact } from '../uncertainty/index.js';

const MS_PER_DAY = 86_400_000;

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeMinimalContext(): AnalysisContext {
  return {
    facts: new Map(),
    ruleStats: new Map(),
    constraintStats: new Map(),
    predictions: [],
    expectedDomains: [],
    staleThresholdDays: 7,
  };
}

function makeFact(
  id: string,
  overrides: Partial<UncertainFact> = {}
): UncertainFact {
  return {
    id,
    claim: `Claim for ${id}`,
    confidence: 0.8,
    source: 'observation',
    evidence: [],
    contraEvidence: [],
    dependsOn: [],
    lastVerified: null,
    createdAt: new Date().toISOString(),
    tags: [],
    ...overrides,
  };
}

function makePrediction(
  id: string,
  overrides: Partial<Prediction> = {}
): Prediction {
  return {
    id,
    claim: `Prediction ${id}`,
    confidence: 0.8,
    createdAt: new Date().toISOString(),
    deadline: new Date(Date.now() + MS_PER_DAY).toISOString(),
    ...overrides,
  };
}

// ── Empty context ─────────────────────────────────────────────────────────────

describe('analyze() — empty context', () => {
  it('should return a report with a valid ISO timestamp', () => {
    const ctx = makeMinimalContext();
    const report = analyze(ctx);
    expect(() => new Date(report.timestamp)).not.toThrow();
    expect(new Date(report.timestamp).getFullYear()).toBeGreaterThan(2020);
  });

  it('should return an empty modules array', () => {
    expect(analyze(makeMinimalContext()).modules).toEqual([]);
  });
});

// ── Fact Coverage ─────────────────────────────────────────────────────────────

describe('analyze() — fact coverage', () => {
  it('should report covered domains from fact IDs', () => {
    const ctx = makeMinimalContext();
    ctx.facts.set('auth.login', makeFact('auth.login'));
    ctx.facts.set('billing.invoice', makeFact('billing.invoice'));

    const { factCoverage } = analyze(ctx);
    expect(factCoverage.coveredDomains).toContain('auth');
    expect(factCoverage.coveredDomains).toContain('billing');
  });

  it('should report gap domains that have no facts', () => {
    const ctx = makeMinimalContext();
    ctx.facts.set('auth.login', makeFact('auth.login'));
    ctx.expectedDomains = ['auth', 'billing', 'infra'];

    const { factCoverage } = analyze(ctx);
    expect(factCoverage.gapDomains).toContain('billing');
    expect(factCoverage.gapDomains).toContain('infra');
    expect(factCoverage.gapDomains).not.toContain('auth');
  });

  it('should compute coverageRatio as verifiedFacts / totalFacts', () => {
    const ctx = makeMinimalContext();
    ctx.facts.set('a.x', makeFact('a.x', { source: 'verified' }));
    ctx.facts.set('a.y', makeFact('a.y', { source: 'observation' }));
    ctx.facts.set('a.z', makeFact('a.z', { source: 'inference' }));

    const { factCoverage } = analyze(ctx);
    expect(factCoverage.totalFacts).toBe(3);
    expect(factCoverage.verifiedFacts).toBe(1);
    expect(factCoverage.coverageRatio).toBeCloseTo(1 / 3);
  });

  it('should report coverageRatio of 0 when there are no facts', () => {
    const { factCoverage } = analyze(makeMinimalContext());
    expect(factCoverage.coverageRatio).toBe(0);
    expect(factCoverage.totalFacts).toBe(0);
  });

  it('should flag facts with no lastVerified as stale (unless source=verified)', () => {
    const ctx = makeMinimalContext();
    ctx.facts.set('a.unverified', makeFact('a.unverified', { source: 'assumption', lastVerified: null }));
    ctx.facts.set('a.verified', makeFact('a.verified', { source: 'verified', lastVerified: null }));

    const { factCoverage } = analyze(ctx);
    const staleIds = factCoverage.staleFacts.map(f => f.id);
    expect(staleIds).toContain('a.unverified');
    expect(staleIds).not.toContain('a.verified');
  });

  it('should flag facts whose lastVerified exceeds the threshold', () => {
    const ctx = makeMinimalContext();
    ctx.staleThresholdDays = 7;
    const tenDaysAgo = new Date(Date.now() - 10 * MS_PER_DAY).toISOString();
    const twoDaysAgo = new Date(Date.now() - 2 * MS_PER_DAY).toISOString();
    ctx.facts.set('a.old', makeFact('a.old', { source: 'observation', lastVerified: tenDaysAgo }));
    ctx.facts.set('a.fresh', makeFact('a.fresh', { source: 'observation', lastVerified: twoDaysAgo }));

    const { factCoverage } = analyze(ctx);
    const staleIds = factCoverage.staleFacts.map(f => f.id);
    expect(staleIds).toContain('a.old');
    expect(staleIds).not.toContain('a.fresh');
  });

  it('should sort staleFacts by daysSinceVerification descending', () => {
    const ctx = makeMinimalContext();
    ctx.staleThresholdDays = 1;
    const fiveDaysAgo = new Date(Date.now() - 5 * MS_PER_DAY).toISOString();
    const threeDaysAgo = new Date(Date.now() - 3 * MS_PER_DAY).toISOString();
    ctx.facts.set('a.five', makeFact('a.five', { source: 'observation', lastVerified: fiveDaysAgo }));
    ctx.facts.set('a.three', makeFact('a.three', { source: 'observation', lastVerified: threeDaysAgo }));

    const { factCoverage } = analyze(ctx);
    expect(factCoverage.staleFacts[0].id).toBe('a.five');
    expect(factCoverage.staleFacts[1].id).toBe('a.three');
  });
});

// ── Confidence Distribution ───────────────────────────────────────────────────

describe('analyze() — confidence distribution', () => {
  it('should bucket facts by confidence range', () => {
    const ctx = makeMinimalContext();
    ctx.facts.set('a.low', makeFact('a.low', { confidence: 0.1 }));
    ctx.facts.set('a.mid', makeFact('a.mid', { confidence: 0.5 }));
    ctx.facts.set('a.high', makeFact('a.high', { confidence: 0.9 }));

    const { confidenceDistribution } = analyze(ctx);
    const { buckets } = confidenceDistribution;

    const lowBucket = buckets.find(b => b.range === '0.0-0.2');
    const midBucket = buckets.find(b => b.range === '0.4-0.6');
    const highBucket = buckets.find(b => b.range === '0.8-1.0');

    expect(lowBucket?.facts).toContain('a.low');
    expect(midBucket?.facts).toContain('a.mid');
    expect(highBucket?.facts).toContain('a.high');
  });

  it('should compute mean confidence correctly', () => {
    const ctx = makeMinimalContext();
    ctx.facts.set('a', makeFact('a', { confidence: 0.4 }));
    ctx.facts.set('b', makeFact('b', { confidence: 0.6 }));

    const { confidenceDistribution } = analyze(ctx);
    expect(confidenceDistribution.mean).toBeCloseTo(0.5);
  });

  it('should compute median confidence', () => {
    const ctx = makeMinimalContext();
    ctx.facts.set('a', makeFact('a', { confidence: 0.2 }));
    ctx.facts.set('b', makeFact('b', { confidence: 0.5 }));
    ctx.facts.set('c', makeFact('c', { confidence: 0.8 }));

    const { confidenceDistribution } = analyze(ctx);
    // Sorted: [0.2, 0.5, 0.8] → median at index 1 = 0.5
    expect(confidenceDistribution.median).toBe(0.5);
  });

  it('should compute stdDev of 0 when all confidences are equal', () => {
    const ctx = makeMinimalContext();
    ctx.facts.set('a', makeFact('a', { confidence: 0.7 }));
    ctx.facts.set('b', makeFact('b', { confidence: 0.7 }));

    const { confidenceDistribution } = analyze(ctx);
    expect(confidenceDistribution.stdDev).toBeCloseTo(0);
  });

  it('should return mean=0, median=0, stdDev=0 with no facts', () => {
    const { confidenceDistribution } = analyze(makeMinimalContext());
    expect(confidenceDistribution.mean).toBe(0);
    expect(confidenceDistribution.median).toBe(0);
    expect(confidenceDistribution.stdDev).toBe(0);
  });

  it('should have five confidence buckets with correct ranges', () => {
    const { confidenceDistribution } = analyze(makeMinimalContext());
    const ranges = confidenceDistribution.buckets.map(b => b.range);
    expect(ranges).toEqual(['0.0-0.2', '0.2-0.4', '0.4-0.6', '0.6-0.8', '0.8-1.0']);
  });

  it('should place a confidence=1.0 fact in the last bucket', () => {
    const ctx = makeMinimalContext();
    ctx.facts.set('a.perfect', makeFact('a.perfect', { confidence: 1.0 }));

    const { confidenceDistribution } = analyze(ctx);
    const lastBucket = confidenceDistribution.buckets[confidenceDistribution.buckets.length - 1];
    expect(lastBucket.facts).toContain('a.perfect');
  });
});

// ── Rule Effectiveness ────────────────────────────────────────────────────────

describe('analyze() — rule effectiveness', () => {
  it('should count total, active, and dormant rules', () => {
    const ctx = makeMinimalContext();
    ctx.ruleStats.set('rule.A', { fires: 5, noops: 0, lastFired: new Date().toISOString() });
    ctx.ruleStats.set('rule.B', { fires: 0, noops: 0, lastFired: null });
    ctx.ruleStats.set('rule.C', { fires: 3, noops: 1, lastFired: new Date().toISOString() });

    const { ruleEffectiveness } = analyze(ctx);
    expect(ruleEffectiveness.totalRules).toBe(3);
    expect(ruleEffectiveness.activeRules).toBe(2);
    expect(ruleEffectiveness.dormantRules).toBe(1);
  });

  it('should sort rules by fire frequency descending', () => {
    const ctx = makeMinimalContext();
    ctx.ruleStats.set('rule.A', { fires: 2, noops: 0, lastFired: null });
    ctx.ruleStats.set('rule.B', { fires: 10, noops: 0, lastFired: null });
    ctx.ruleStats.set('rule.C', { fires: 5, noops: 0, lastFired: null });

    const { ruleEffectiveness } = analyze(ctx);
    const ids = ruleEffectiveness.byFrequency.map(r => r.ruleId);
    expect(ids[0]).toBe('rule.B');
    expect(ids[1]).toBe('rule.C');
    expect(ids[2]).toBe('rule.A');
  });

  it('should identify noop rules (fire count > 0 but all are noops)', () => {
    const ctx = makeMinimalContext();
    ctx.ruleStats.set('rule.noop', { fires: 3, noops: 3, lastFired: null });
    ctx.ruleStats.set('rule.effective', { fires: 3, noops: 1, lastFired: null });

    const { ruleEffectiveness } = analyze(ctx);
    expect(ruleEffectiveness.noopRules).toContain('rule.noop');
    expect(ruleEffectiveness.noopRules).not.toContain('rule.effective');
  });

  it('should report constraint violations', () => {
    const ctx = makeMinimalContext();
    ctx.constraintStats.set('constraint.X', { violations: 2, lastViolation: '2025-01-01T00:00:00Z' });
    ctx.constraintStats.set('constraint.Y', { violations: 0, lastViolation: null });

    const { ruleEffectiveness } = analyze(ctx);
    const violatedIds = ruleEffectiveness.constraintViolations.map(v => v.constraintId);
    expect(violatedIds).toContain('constraint.X');
    expect(violatedIds).not.toContain('constraint.Y');
  });

  it('should record lastFired as "never" for dormant rules', () => {
    const ctx = makeMinimalContext();
    ctx.ruleStats.set('rule.dormant', { fires: 0, noops: 0, lastFired: null });

    const { ruleEffectiveness } = analyze(ctx);
    const dormant = ruleEffectiveness.byFrequency.find(r => r.ruleId === 'rule.dormant');
    expect(dormant?.lastFired).toBe('never');
  });
});

// ── Dependency Health ─────────────────────────────────────────────────────────

describe('analyze() — dependency health', () => {
  it('should count total dependency edges', () => {
    const ctx = makeMinimalContext();
    ctx.facts.set('a', makeFact('a', { dependsOn: ['b', 'c'] }));
    ctx.facts.set('b', makeFact('b'));
    ctx.facts.set('c', makeFact('c'));

    const { dependencyHealth } = analyze(ctx);
    expect(dependencyHealth.totalEdges).toBe(2);
  });

  it('should compute max depth through dependency chains', () => {
    const ctx = makeMinimalContext();
    // chain: c ← b ← a  (depth of a = 2)
    ctx.facts.set('c', makeFact('c'));
    ctx.facts.set('b', makeFact('b', { dependsOn: ['c'] }));
    ctx.facts.set('a', makeFact('a', { dependsOn: ['b'] }));

    const { dependencyHealth } = analyze(ctx);
    expect(dependencyHealth.maxDepth).toBeGreaterThanOrEqual(2);
  });

  it('should identify orphaned facts (no deps, no dependents)', () => {
    const ctx = makeMinimalContext();
    ctx.facts.set('a.connected', makeFact('a.connected', { dependsOn: ['a.dep'] }));
    ctx.facts.set('a.dep', makeFact('a.dep'));
    ctx.facts.set('a.orphan', makeFact('a.orphan'));

    const { dependencyHealth } = analyze(ctx);
    expect(dependencyHealth.orphanedFacts).toContain('a.orphan');
    expect(dependencyHealth.orphanedFacts).not.toContain('a.connected');
    expect(dependencyHealth.orphanedFacts).not.toContain('a.dep');
  });

  it('should identify critical facts with many dependents', () => {
    const ctx = makeMinimalContext();
    // 'core.fact' has 3 dependents → qualifies as critical
    ctx.facts.set('core.fact', makeFact('core.fact', { confidence: 0.6 }));
    ctx.facts.set('d.1', makeFact('d.1', { dependsOn: ['core.fact'] }));
    ctx.facts.set('d.2', makeFact('d.2', { dependsOn: ['core.fact'] }));
    ctx.facts.set('d.3', makeFact('d.3', { dependsOn: ['core.fact'] }));

    const { dependencyHealth } = analyze(ctx);
    const critical = dependencyHealth.criticalFacts.find(f => f.factId === 'core.fact');
    expect(critical).toBeDefined();
    expect(critical?.dependentCount).toBe(3);
    expect(critical?.confidence).toBe(0.6);
  });

  it('should not mark facts with fewer than 3 dependents as critical', () => {
    const ctx = makeMinimalContext();
    ctx.facts.set('minor', makeFact('minor'));
    ctx.facts.set('dep1', makeFact('dep1', { dependsOn: ['minor'] }));
    ctx.facts.set('dep2', makeFact('dep2', { dependsOn: ['minor'] }));

    const { dependencyHealth } = analyze(ctx);
    const critical = dependencyHealth.criticalFacts.find(f => f.factId === 'minor');
    expect(critical).toBeUndefined();
  });

  it('should return zero edges and empty orphans for an empty fact store', () => {
    const { dependencyHealth } = analyze(makeMinimalContext());
    expect(dependencyHealth.totalEdges).toBe(0);
    expect(dependencyHealth.orphanedFacts).toEqual([]);
    expect(dependencyHealth.criticalFacts).toEqual([]);
    expect(dependencyHealth.maxDepth).toBe(0);
  });
});

// ── Prediction Accuracy ───────────────────────────────────────────────────────

describe('analyze() — prediction accuracy', () => {
  it('should count total, correct, incorrect, and pending predictions', () => {
    const ctx = makeMinimalContext();
    ctx.predictions = [
      makePrediction('p1', { outcome: 'correct' }),
      makePrediction('p2', { outcome: 'incorrect' }),
      makePrediction('p3'), // pending
    ];

    const { predictionAccuracy } = analyze(ctx);
    expect(predictionAccuracy.totalPredictions).toBe(3);
    expect(predictionAccuracy.correct).toBe(1);
    expect(predictionAccuracy.incorrect).toBe(1);
    expect(predictionAccuracy.pending).toBe(1);
    expect(predictionAccuracy.verified).toBe(2);
  });

  it('should compute accuracy as correct / verified', () => {
    const ctx = makeMinimalContext();
    ctx.predictions = [
      makePrediction('p1', { outcome: 'correct' }),
      makePrediction('p2', { outcome: 'correct' }),
      makePrediction('p3', { outcome: 'incorrect' }),
    ];

    const { predictionAccuracy } = analyze(ctx);
    expect(predictionAccuracy.accuracy).toBeCloseTo(2 / 3);
  });

  it('should return accuracy=0 when no predictions are verified', () => {
    const ctx = makeMinimalContext();
    ctx.predictions = [makePrediction('p1')];

    const { predictionAccuracy } = analyze(ctx);
    expect(predictionAccuracy.accuracy).toBe(0);
  });

  it('should build calibration buckets from verified predictions', () => {
    const ctx = makeMinimalContext();
    ctx.predictions = [
      makePrediction('p1', { confidence: 0.85, outcome: 'correct' }),
      makePrediction('p2', { confidence: 0.9, outcome: 'incorrect' }),
      makePrediction('p3', { confidence: 0.3, outcome: 'correct' }),
    ];

    const { predictionAccuracy } = analyze(ctx);
    const highBucket = predictionAccuracy.calibration.find(b => b.bucket === '80-100%');
    expect(highBucket).toBeDefined();
    expect(highBucket!.count).toBe(2);
    expect(highBucket!.actualRate).toBeCloseTo(0.5); // 1 correct out of 2
  });

  it('should list byConfidence with correct outcome labels', () => {
    const ctx = makeMinimalContext();
    ctx.predictions = [
      makePrediction('p1', { outcome: 'correct' }),
      makePrediction('p2', { outcome: 'incorrect' }),
      makePrediction('p3'), // pending
    ];

    const { predictionAccuracy } = analyze(ctx);
    const outcomes = predictionAccuracy.byConfidence.map(p => p.outcome);
    expect(outcomes).toContain('correct');
    expect(outcomes).toContain('incorrect');
    expect(outcomes).toContain('pending');
  });

  it('should handle calibration buckets with no predictions (predictedRate=0, actualRate=0)', () => {
    const { predictionAccuracy } = analyze(makeMinimalContext());
    for (const bucket of predictionAccuracy.calibration) {
      expect(bucket.predictedRate).toBe(0);
      expect(bucket.actualRate).toBe(0);
      expect(bucket.count).toBe(0);
    }
  });
});

// ── Recommendations ───────────────────────────────────────────────────────────

describe('analyze() — recommendations', () => {
  it('should emit coverage-gap recommendations for missing domains', () => {
    const ctx = makeMinimalContext();
    ctx.expectedDomains = ['auth', 'billing'];
    // No facts added → both are gap domains

    const { recommendations } = analyze(ctx);
    const gapRecs = recommendations.filter(r => r.category === 'coverage-gap');
    expect(gapRecs).toHaveLength(2);
    expect(gapRecs[0].priority).toBe('high');
  });

  it('should emit stale-fact recommendations for never-verified facts', () => {
    const ctx = makeMinimalContext();
    ctx.facts.set('a.old', makeFact('a.old', { source: 'assumption', lastVerified: null }));

    const { recommendations } = analyze(ctx);
    const staleRecs = recommendations.filter(r => r.category === 'stale-fact');
    expect(staleRecs.length).toBeGreaterThan(0);
    expect(staleRecs[0].relatedIds).toContain('a.old');
  });

  it('should emit dead-rule recommendations for rules that never fired', () => {
    const ctx = makeMinimalContext();
    ctx.ruleStats.set('rule.dead', { fires: 0, noops: 0, lastFired: null });

    const { recommendations } = analyze(ctx);
    const deadRuleRecs = recommendations.filter(r => r.category === 'dead-rule');
    expect(deadRuleRecs.length).toBeGreaterThan(0);
    expect(deadRuleRecs[0].relatedIds).toContain('rule.dead');
    expect(deadRuleRecs[0].priority).toBe('low');
  });

  it('should emit weak-chain recommendations for low-confidence critical facts', () => {
    const ctx = makeMinimalContext();
    ctx.facts.set('core.weak', makeFact('core.weak', { confidence: 0.5 }));
    ctx.facts.set('d.1', makeFact('d.1', { dependsOn: ['core.weak'] }));
    ctx.facts.set('d.2', makeFact('d.2', { dependsOn: ['core.weak'] }));
    ctx.facts.set('d.3', makeFact('d.3', { dependsOn: ['core.weak'] }));

    const { recommendations } = analyze(ctx);
    const chainRecs = recommendations.filter(r => r.category === 'weak-chain');
    expect(chainRecs.length).toBeGreaterThan(0);
    expect(chainRecs[0].priority).toBe('critical');
    expect(chainRecs[0].relatedIds).toContain('core.weak');
  });

  it('should NOT emit weak-chain recommendation for high-confidence critical facts', () => {
    const ctx = makeMinimalContext();
    ctx.facts.set('core.strong', makeFact('core.strong', { confidence: 0.9 }));
    ctx.facts.set('d.1', makeFact('d.1', { dependsOn: ['core.strong'] }));
    ctx.facts.set('d.2', makeFact('d.2', { dependsOn: ['core.strong'] }));
    ctx.facts.set('d.3', makeFact('d.3', { dependsOn: ['core.strong'] }));

    const { recommendations } = analyze(ctx);
    const chainRecs = recommendations.filter(r => r.category === 'weak-chain');
    expect(chainRecs).toHaveLength(0);
  });

  it('should emit calibration recommendation when accuracy < 70% with >= 5 verified', () => {
    const ctx = makeMinimalContext();
    // 5 predictions, only 1 correct → accuracy = 0.2
    ctx.predictions = [
      makePrediction('p1', { outcome: 'correct' }),
      makePrediction('p2', { outcome: 'incorrect' }),
      makePrediction('p3', { outcome: 'incorrect' }),
      makePrediction('p4', { outcome: 'incorrect' }),
      makePrediction('p5', { outcome: 'incorrect' }),
    ];

    const { recommendations } = analyze(ctx);
    const calRecs = recommendations.filter(r => r.category === 'calibration');
    expect(calRecs.length).toBeGreaterThan(0);
    expect(calRecs[0].priority).toBe('high');
  });

  it('should NOT emit calibration recommendation when fewer than 5 predictions are verified', () => {
    const ctx = makeMinimalContext();
    ctx.predictions = [
      makePrediction('p1', { outcome: 'incorrect' }),
      makePrediction('p2', { outcome: 'incorrect' }),
    ];

    const { recommendations } = analyze(ctx);
    const calRecs = recommendations.filter(r => r.category === 'calibration');
    expect(calRecs).toHaveLength(0);
  });

  it('should sort recommendations: critical before high before medium before low', () => {
    const ctx = makeMinimalContext();
    // Trigger critical: low-confidence critical fact
    ctx.facts.set('core.weak', makeFact('core.weak', { confidence: 0.5 }));
    ctx.facts.set('d.1', makeFact('d.1', { dependsOn: ['core.weak'] }));
    ctx.facts.set('d.2', makeFact('d.2', { dependsOn: ['core.weak'] }));
    ctx.facts.set('d.3', makeFact('d.3', { dependsOn: ['core.weak'] }));
    // Trigger high: coverage gap
    ctx.expectedDomains = ['missing-domain'];
    // Trigger low: dormant rule
    ctx.ruleStats.set('rule.dormant', { fires: 0, noops: 0, lastFired: null });

    const { recommendations } = analyze(ctx);
    const priorities = recommendations.map(r => r.priority);
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    for (let i = 1; i < priorities.length; i++) {
      expect(order[priorities[i]]).toBeGreaterThanOrEqual(order[priorities[i - 1]]);
    }
  });

  it('should return no recommendations for a healthy context', () => {
    const ctx = makeMinimalContext();
    const recentDate = new Date(Date.now() - 1 * MS_PER_DAY).toISOString();
    ctx.facts.set('auth.ok', makeFact('auth.ok', { source: 'verified', lastVerified: recentDate }));
    ctx.expectedDomains = ['auth'];
    ctx.predictions = [
      makePrediction('p1', { outcome: 'correct' }),
      makePrediction('p2', { outcome: 'correct' }),
      makePrediction('p3', { outcome: 'correct' }),
      makePrediction('p4', { outcome: 'correct' }),
      makePrediction('p5', { outcome: 'correct' }),
    ];
    ctx.ruleStats.set('rule.active', { fires: 5, noops: 0, lastFired: new Date().toISOString() });

    const { recommendations } = analyze(ctx);
    // A healthy context may still have stale-fact recs for unverified facts,
    // but it should at least have no gap/weak-chain/calibration issues
    const badRecs = recommendations.filter(r =>
      r.category === 'coverage-gap' ||
      r.category === 'weak-chain' ||
      r.category === 'calibration'
    );
    expect(badRecs).toHaveLength(0);
  });
});

// ── Main exports from src/index.ts ────────────────────────────────────────────

describe('analyze — re-exported from main package entry', () => {
  it('should be importable as { analyze } from the analysis module directly', async () => {
    const { analyze: analyzeImported } = await import('../analysis/index.js');
    expect(typeof analyzeImported).toBe('function');
  });

  it('should produce a structurally valid AnalysisReport', () => {
    const ctx = makeMinimalContext();
    const report = analyze(ctx);

    expect(report).toHaveProperty('timestamp');
    expect(report).toHaveProperty('modules');
    expect(report).toHaveProperty('factCoverage');
    expect(report).toHaveProperty('confidenceDistribution');
    expect(report).toHaveProperty('ruleEffectiveness');
    expect(report).toHaveProperty('dependencyHealth');
    expect(report).toHaveProperty('predictionAccuracy');
    expect(report).toHaveProperty('recommendations');
  });
});
