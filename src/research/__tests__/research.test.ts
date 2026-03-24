/**
 * Research Module Tests
 *
 * Validates:
 * - generateResearchQuestions() produces questions from all recommendation categories
 * - generateResearchQuestions() produces questions from propagation anomalies
 * - generateResearchQuestions() produces calibration questions for miscalibrated predictions
 * - generateResearchQuestions() produces self-improvement questions for noop rules
 * - Priority scoring is deterministic (impact × feasibility)
 * - buildAgenda() groups questions by origin into the correct themes
 * - buildAgenda() computes overallImpact per theme
 */

import { describe, it, expect } from 'vitest';
import {
  generateResearchQuestions,
  buildAgenda,
  type ResearchQuestion,
} from '../index.js';
import type { AnalysisReport } from '../../analysis/index.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeEmptyReport(): AnalysisReport {
  return {
    timestamp: new Date().toISOString(),
    modules: [],
    factCoverage: {
      coveredDomains: [],
      gapDomains: [],
      staleFacts: [],
      totalFacts: 0,
      verifiedFacts: 0,
      coverageRatio: 0,
    },
    confidenceDistribution: {
      buckets: [],
      mean: 0,
      median: 0,
      stdDev: 0,
      propagationAnomalies: [],
    },
    ruleEffectiveness: {
      totalRules: 0,
      activeRules: 0,
      dormantRules: 0,
      byFrequency: [],
      noopRules: [],
      constraintViolations: [],
    },
    dependencyHealth: {
      totalEdges: 0,
      maxDepth: 0,
      cycles: [],
      criticalFacts: [],
      orphanedFacts: [],
    },
    predictionAccuracy: {
      totalPredictions: 0,
      verified: 0,
      correct: 0,
      incorrect: 0,
      pending: 0,
      accuracy: 0,
      byConfidence: [],
      calibration: [],
    },
    recommendations: [],
  };
}

// ── generateResearchQuestions ─────────────────────────────────────────────────

describe('generateResearchQuestions() — empty report', () => {
  it('should return an empty array when the report has no data', () => {
    const questions = generateResearchQuestions(makeEmptyReport());
    expect(questions).toEqual([]);
  });
});

describe('generateResearchQuestions() — coverage-gap recommendations', () => {
  it('should generate a question for each coverage-gap recommendation', () => {
    const report = makeEmptyReport();
    report.recommendations = [
      {
        priority: 'high',
        category: 'coverage-gap',
        message: 'No facts in domain "billing"',
        actionable: 'Create facts for billing domain',
        relatedIds: ['billing'],
      },
      {
        priority: 'high',
        category: 'coverage-gap',
        message: 'No facts in domain "auth"',
        actionable: 'Create facts for auth domain',
        relatedIds: ['auth'],
      },
    ];

    const questions = generateResearchQuestions(report);
    const ids = questions.map(q => q.id);
    expect(ids).toContain('research.gap.billing');
    expect(ids).toContain('research.gap.auth');
    expect(questions).toHaveLength(2);
  });

  it('should set origin to "analysis-gap" for coverage-gap questions', () => {
    const report = makeEmptyReport();
    report.recommendations = [
      {
        priority: 'high',
        category: 'coverage-gap',
        message: 'No facts in domain "billing"',
        actionable: 'Create facts',
        relatedIds: ['billing'],
      },
    ];
    const [q] = generateResearchQuestions(report);
    expect(q.origin).toBe('analysis-gap');
    expect(q.status).toBe('proposed');
  });

  it('should carry the recommendation message as motivation', () => {
    const report = makeEmptyReport();
    const message = 'No facts in domain "billing"';
    report.recommendations = [
      { priority: 'high', category: 'coverage-gap', message, actionable: '', relatedIds: ['billing'] },
    ];
    const [q] = generateResearchQuestions(report);
    expect(q.motivation).toBe(message);
  });

  it('should use "unknown" as the domain when relatedIds is empty', () => {
    const report = makeEmptyReport();
    report.recommendations = [
      { priority: 'high', category: 'coverage-gap', message: 'gap', actionable: '', relatedIds: [] },
    ];
    const [q] = generateResearchQuestions(report);
    expect(q.id).toBe('research.gap.unknown');
    expect(q.question).toContain('"unknown"');
  });
});

describe('generateResearchQuestions() — weak-chain recommendations', () => {
  it('should generate a question for each weak-chain recommendation', () => {
    const report = makeEmptyReport();
    report.recommendations = [
      {
        priority: 'critical',
        category: 'weak-chain',
        message: 'Critical fact "auth.token" has low confidence',
        actionable: 'Verify auth.token',
        relatedIds: ['auth.token'],
      },
    ];
    const [q] = generateResearchQuestions(report);
    expect(q.id).toBe('research.weak-chain.auth.token');
    expect(q.origin).toBe('analysis-gap');
    expect(q.impact).toBe(0.95);
    expect(q.feasibility).toBe(0.6);
  });
});

describe('generateResearchQuestions() — stale-fact recommendations', () => {
  it('should generate a question for each stale-fact recommendation', () => {
    const report = makeEmptyReport();
    report.recommendations = [
      {
        priority: 'medium',
        category: 'stale-fact',
        message: 'Fact "billing.plan" not verified in 20 days',
        actionable: 'Reverify billing.plan',
        relatedIds: ['billing.plan'],
      },
    ];
    const [q] = generateResearchQuestions(report);
    expect(q.id).toBe('research.stale.billing.plan');
    expect(q.question).toBe('Is "billing.plan" still true?');
    expect(q.origin).toBe('analysis-gap');
    expect(q.impact).toBe(0.6);
    expect(q.feasibility).toBe(0.9);
  });
});

describe('generateResearchQuestions() — unrecognized recommendation categories', () => {
  it('should skip recommendations with unrecognized categories', () => {
    const report = makeEmptyReport();
    // dead-rule, calibration, cycle → all fall into the default null branch
    report.recommendations = [
      { priority: 'low', category: 'dead-rule', message: 'Rule X never fired', actionable: '', relatedIds: ['rule.x'] },
      { priority: 'high', category: 'calibration', message: 'Miscalibrated', actionable: '', relatedIds: [] },
      { priority: 'low', category: 'cycle', message: 'Cycle detected', actionable: '', relatedIds: ['a', 'b'] },
    ];
    const questions = generateResearchQuestions(report);
    expect(questions).toHaveLength(0);
  });
});

describe('generateResearchQuestions() — propagation anomalies', () => {
  it('should generate a question for each propagation anomaly', () => {
    const report = makeEmptyReport();
    report.confidenceDistribution.propagationAnomalies = [
      {
        factId: 'auth.session',
        declaredConfidence: 0.9,
        propagatedConfidence: 0.4,
        delta: 0.5,
        weakestDependency: 'auth.token',
      },
    ];
    const questions = generateResearchQuestions(report);
    expect(questions).toHaveLength(1);
    const [q] = questions;
    expect(q.id).toBe('research.propagation.auth.session');
    expect(q.origin).toBe('analysis-gap');
    expect(q.question).toContain('auth.session');
    expect(q.question).toContain('50%');
    expect(q.motivation).toContain('auth.token');
  });

  it('should include the weakest dependency in proposedExperiments', () => {
    const report = makeEmptyReport();
    report.confidenceDistribution.propagationAnomalies = [
      {
        factId: 'fact.a',
        declaredConfidence: 0.8,
        propagatedConfidence: 0.3,
        delta: 0.5,
        weakestDependency: 'fact.b',
      },
    ];
    const [q] = generateResearchQuestions(report);
    expect(q.proposedExperiments).toContain('verify-dependency-fact.b');
    expect(q.hypothesis?.claim).toContain('fact.b');
  });
});

describe('generateResearchQuestions() — calibration (prediction failures)', () => {
  it('should generate calibration questions for miscalibrated buckets', () => {
    const report = makeEmptyReport();
    report.predictionAccuracy = {
      ...makeEmptyReport().predictionAccuracy,
      accuracy: 0.5,
      verified: 5,
      calibration: [
        { bucket: '80-100%', predictedRate: 0.9, actualRate: 0.4, count: 3 },
        { bucket: '0-20%', predictedRate: 0.1, actualRate: 0.5, count: 1 }, // count < 2, should be ignored
      ],
    };
    const questions = generateResearchQuestions(report);
    expect(questions).toHaveLength(1);
    const [q] = questions;
    expect(q.id).toMatch(/^research\.calibration\./);
    expect(q.origin).toBe('prediction-failure');
    expect(q.impact).toBe(0.9);
    expect(q.feasibility).toBe(0.6);
  });

  it('should skip calibration when accuracy >= 0.8', () => {
    const report = makeEmptyReport();
    report.predictionAccuracy = {
      ...makeEmptyReport().predictionAccuracy,
      accuracy: 0.85,
      verified: 5,
      calibration: [
        { bucket: '80-100%', predictedRate: 0.9, actualRate: 0.4, count: 3 },
      ],
    };
    const questions = generateResearchQuestions(report);
    expect(questions).toHaveLength(0);
  });

  it('should skip calibration when verified < 3', () => {
    const report = makeEmptyReport();
    report.predictionAccuracy = {
      ...makeEmptyReport().predictionAccuracy,
      accuracy: 0.5,
      verified: 2,
      calibration: [
        { bucket: '80-100%', predictedRate: 0.9, actualRate: 0.4, count: 3 },
      ],
    };
    const questions = generateResearchQuestions(report);
    expect(questions).toHaveLength(0);
  });
});

describe('generateResearchQuestions() — noop rules (self-improvement)', () => {
  it('should generate self-improvement questions for noop rules (max 3)', () => {
    const report = makeEmptyReport();
    report.ruleEffectiveness.noopRules = ['rule.a', 'rule.b', 'rule.c', 'rule.d'];

    const questions = generateResearchQuestions(report);
    // Only first 3 are taken
    expect(questions).toHaveLength(3);
    expect(questions.map(q => q.origin).every(o => o === 'self-improvement')).toBe(true);
    expect(questions.map(q => q.id)).toContain('research.noop-rule.rule.a');
    expect(questions.map(q => q.id)).not.toContain('research.noop-rule.rule.d');
  });

  it('should set impact = 0.4 and feasibility = 0.9 for noop-rule questions', () => {
    const report = makeEmptyReport();
    report.ruleEffectiveness.noopRules = ['rule.x'];
    const [q] = generateResearchQuestions(report);
    expect(q.impact).toBe(0.4);
    expect(q.feasibility).toBe(0.9);
  });
});

// ── Priority scoring ──────────────────────────────────────────────────────────

describe('priority scoring', () => {
  it('should be deterministic: priority === impact × feasibility', () => {
    const report = makeEmptyReport();
    report.recommendations = [
      { priority: 'high', category: 'coverage-gap', message: 'msg', actionable: '', relatedIds: ['d'] },
      { priority: 'critical', category: 'weak-chain', message: 'msg2', actionable: '', relatedIds: ['f'] },
      { priority: 'medium', category: 'stale-fact', message: 'msg3', actionable: '', relatedIds: ['g'] },
    ];
    const questions = generateResearchQuestions(report);
    for (const q of questions) {
      expect(q.priority).toBeCloseTo(q.impact * q.feasibility, 10);
    }
  });

  it('should return questions sorted by priority descending', () => {
    const report = makeEmptyReport();
    report.recommendations = [
      { priority: 'critical', category: 'weak-chain', message: 'msg', actionable: '', relatedIds: ['f1'] },
      { priority: 'high', category: 'coverage-gap', message: 'msg', actionable: '', relatedIds: ['d1'] },
      { priority: 'medium', category: 'stale-fact', message: 'msg', actionable: '', relatedIds: ['s1'] },
    ];
    report.ruleEffectiveness.noopRules = ['rule.low'];

    const questions = generateResearchQuestions(report);
    const priorities = questions.map(q => q.priority);
    for (let i = 1; i < priorities.length; i++) {
      expect(priorities[i - 1]).toBeGreaterThanOrEqual(priorities[i]);
    }
  });
});

// ── buildAgenda ───────────────────────────────────────────────────────────────

describe('buildAgenda() — theme grouping', () => {
  function makeQuestion(overrides: Partial<ResearchQuestion>): ResearchQuestion {
    const now = new Date().toISOString();
    return {
      id: 'q1',
      question: 'test?',
      motivation: 'because',
      origin: 'analysis-gap',
      relatedIds: [],
      status: 'proposed',
      impact: 0.5,
      feasibility: 0.5,
      priority: 0.25,
      proposedExperiments: [],
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  it('should group "analysis-gap" and "anomaly" questions into "Knowledge Gaps" and "Anomaly Investigation"', () => {
    const questions: ResearchQuestion[] = [
      makeQuestion({ id: 'q1', origin: 'analysis-gap' }),
      makeQuestion({ id: 'q2', origin: 'anomaly' }),
      makeQuestion({ id: 'q3', origin: 'analysis-gap' }),
    ];
    const agenda = buildAgenda(questions);
    const themeNames = agenda.themes.map(t => t.name);
    expect(themeNames).toContain('Knowledge Gaps');
    expect(themeNames).toContain('Anomaly Investigation');
  });

  it('should group "prediction-failure" questions into "Calibration"', () => {
    const questions = [makeQuestion({ id: 'p1', origin: 'prediction-failure' })];
    const agenda = buildAgenda(questions);
    expect(agenda.themes[0].name).toBe('Calibration');
  });

  it('should group "self-improvement" questions into "Self-Improvement"', () => {
    const questions = [makeQuestion({ id: 's1', origin: 'self-improvement' })];
    const agenda = buildAgenda(questions);
    expect(agenda.themes[0].name).toBe('Self-Improvement');
  });

  it('should include all question IDs in the matching theme', () => {
    const questions: ResearchQuestion[] = [
      makeQuestion({ id: 'gap1', origin: 'analysis-gap' }),
      makeQuestion({ id: 'gap2', origin: 'analysis-gap' }),
      makeQuestion({ id: 'si1', origin: 'self-improvement' }),
    ];
    const agenda = buildAgenda(questions);
    const knowledgeGaps = agenda.themes.find(t => t.name === 'Knowledge Gaps')!;
    expect(knowledgeGaps.questionIds).toContain('gap1');
    expect(knowledgeGaps.questionIds).toContain('gap2');
    expect(knowledgeGaps.questionIds).not.toContain('si1');
  });

  it('should compute overallImpact as the average impact for each theme', () => {
    const questions: ResearchQuestion[] = [
      makeQuestion({ id: 'q1', origin: 'analysis-gap', impact: 0.8 }),
      makeQuestion({ id: 'q2', origin: 'analysis-gap', impact: 0.4 }),
    ];
    const agenda = buildAgenda(questions);
    const theme = agenda.themes.find(t => t.name === 'Knowledge Gaps')!;
    expect(theme.overallImpact).toBeCloseTo(0.6, 10);
  });

  it('should sort themes by overallImpact descending', () => {
    const questions: ResearchQuestion[] = [
      makeQuestion({ id: 'si1', origin: 'self-improvement', impact: 0.4 }),
      makeQuestion({ id: 'pf1', origin: 'prediction-failure', impact: 0.9 }),
    ];
    const agenda = buildAgenda(questions);
    const impacts = agenda.themes.map(t => t.overallImpact);
    expect(impacts[0]).toBeGreaterThanOrEqual(impacts[1]);
  });

  it('should pass through all questions unchanged in agenda.questions', () => {
    const questions = [makeQuestion({ id: 'q1' })];
    const agenda = buildAgenda(questions);
    expect(agenda.questions).toBe(questions);
  });

  it('should include a valid ISO timestamp in generatedAt', () => {
    const agenda = buildAgenda([]);
    expect(() => new Date(agenda.generatedAt)).not.toThrow();
    expect(new Date(agenda.generatedAt).getFullYear()).toBeGreaterThan(2020);
  });

  it('should return an empty themes array when no questions are provided', () => {
    const agenda = buildAgenda([]);
    expect(agenda.themes).toEqual([]);
  });
});

// ── Integration: full pipeline ────────────────────────────────────────────────

describe('generateResearchQuestions() + buildAgenda() — integration', () => {
  it('should correctly feed generateResearchQuestions output into buildAgenda', () => {
    const report = makeEmptyReport();
    report.recommendations = [
      { priority: 'high', category: 'coverage-gap', message: 'No billing facts', actionable: '', relatedIds: ['billing'] },
      { priority: 'critical', category: 'weak-chain', message: 'Weak auth.token', actionable: '', relatedIds: ['auth.token'] },
    ];
    report.ruleEffectiveness.noopRules = ['rule.noop'];

    const questions = generateResearchQuestions(report);
    const agenda = buildAgenda(questions);

    expect(agenda.questions).toHaveLength(questions.length);
    expect(agenda.themes.length).toBeGreaterThan(0);

    // All IDs in themes should exist in questions
    const allQuestionIds = new Set(questions.map(q => q.id));
    for (const theme of agenda.themes) {
      for (const id of theme.questionIds) {
        expect(allQuestionIds.has(id)).toBe(true);
      }
    }
  });
});
