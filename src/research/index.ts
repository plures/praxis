/**
 * Research Module for Praxis
 * 
 * Generates research questions from analysis gaps, uncertainty, and anomalies.
 * Research questions drive experiments. This is how Praxis learns what it
 * doesn't know and formulates plans to find out.
 * 
 * Research lifecycle:
 *   1. Analysis reveals gap/anomaly/weak chain
 *   2. Research module generates questions
 *   3. Questions get prioritized by impact × feasibility
 *   4. High-priority questions become experiments
 *   5. Experiment results update facts + confidence
 *   6. Analysis re-evaluates → new questions emerge
 * 
 * @module @plures/praxis/research
 */

// ── Types ──────────────────────────────────────────────────────────────────

/** Lifecycle status of a research question. */
export type ResearchStatus = 'proposed' | 'approved' | 'in-progress' | 'completed' | 'abandoned';
/** What triggered this research question to be generated. */
export type ResearchOrigin = 'analysis-gap' | 'anomaly' | 'prediction-failure' | 'user-question' | 'self-improvement';

/** A research question generated from analysis gaps, anomalies, or prediction failures. */
export interface ResearchQuestion {
  id: string;
  /** The question being investigated */
  question: string;
  /** Why this question matters */
  motivation: string;
  /** Where this question came from */
  origin: ResearchOrigin;
  /** Related fact/rule/anomaly IDs */
  relatedIds: string[];
  /** Current status */
  status: ResearchStatus;
  /** Impact if answered (0.0-1.0): how much would this improve our knowledge? */
  impact: number;
  /** Feasibility (0.0-1.0): how likely are we to answer this? */
  feasibility: number;
  /** Priority score = impact × feasibility */
  priority: number;
  /** What experiments could answer this? */
  proposedExperiments: string[];
  /** Hypothesis: what do we expect the answer to be? */
  hypothesis?: {
    claim: string;
    confidence: number;
    rationale: string;
  };
  /** Results once completed */
  findings?: {
    answer: string;
    evidence: Array<{ observation: string; source: string; weight: number }>;
    hypothesisConfirmed: boolean | null;
    newFactIds: string[];
    updatedFactIds: string[];
  };
  createdAt: string;
  updatedAt: string;
}

/** A prioritised collection of research questions grouped by theme. */
export interface ResearchAgenda {
  questions: ResearchQuestion[];
  /** Auto-generated from analysis */
  generatedAt: string;
  /** Questions grouped by theme */
  themes: Array<{
    name: string;
    questionIds: string[];
    overallImpact: number;
  }>;
}

// ── Research Generation ────────────────────────────────────────────────────

import type { AnalysisReport, Recommendation } from '../analysis/index.js';

/**
 * Generate research questions from an analysis report.
 * Each recommendation category maps to a different research strategy.
 */
export function generateResearchQuestions(analysis: AnalysisReport): ResearchQuestion[] {
  const questions: ResearchQuestion[] = [];
  const now = new Date().toISOString();

  for (const rec of analysis.recommendations) {
    const q = recommendationToQuestion(rec, now);
    if (q) questions.push(q);
  }

  // Generate questions from confidence distribution anomalies
  for (const anomaly of analysis.confidenceDistribution.propagationAnomalies) {
    questions.push({
      id: `research.propagation.${anomaly.factId}`,
      question: `Why does fact "${anomaly.factId}" have ${(anomaly.delta * 100).toFixed(0)}% confidence gap between declared and propagated values?`,
      motivation: `Declared confidence: ${(anomaly.declaredConfidence * 100).toFixed(0)}%, effective: ${(anomaly.propagatedConfidence * 100).toFixed(0)}%. The weakest dependency is "${anomaly.weakestDependency}".`,
      origin: 'analysis-gap',
      relatedIds: [anomaly.factId, anomaly.weakestDependency],
      status: 'proposed',
      impact: 0.7,
      feasibility: 0.8,
      priority: 0.56,
      proposedExperiments: [`verify-dependency-${anomaly.weakestDependency}`],
      hypothesis: {
        claim: `Strengthening "${anomaly.weakestDependency}" will restore confidence in "${anomaly.factId}"`,
        confidence: 0.6,
        rationale: 'Weakest-link propagation means fixing the weakest dependency has the most impact',
      },
      createdAt: now,
      updatedAt: now,
    });
  }

  // Generate calibration research if predictions are off
  if (analysis.predictionAccuracy.accuracy < 0.8 && analysis.predictionAccuracy.verified >= 3) {
    const miscalibratedBuckets = analysis.predictionAccuracy.calibration
      .filter(b => b.count >= 2 && Math.abs(b.predictedRate - b.actualRate) > 0.2);

    for (const bucket of miscalibratedBuckets) {
      questions.push({
        id: `research.calibration.${bucket.bucket.replace(/[^a-z0-9]/g, '')}`,
        question: `Why are predictions in the ${bucket.bucket} confidence range ${bucket.actualRate > bucket.predictedRate ? 'under' : 'over'}-confident?`,
        motivation: `Expected ${(bucket.predictedRate * 100).toFixed(0)}% accuracy, got ${(bucket.actualRate * 100).toFixed(0)}% across ${bucket.count} predictions.`,
        origin: 'prediction-failure',
        relatedIds: [],
        status: 'proposed',
        impact: 0.9,
        feasibility: 0.6,
        priority: 0.54,
        proposedExperiments: ['calibration-experiment'],
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // Self-improvement: which rules could be better?
  for (const rule of analysis.ruleEffectiveness.noopRules.slice(0, 3)) {
    questions.push({
      id: `research.noop-rule.${rule}`,
      question: `Rule "${rule}" fires but never produces effects. Should it be rewritten or removed?`,
      motivation: 'A rule that fires but does nothing wastes computation and may indicate a design flaw.',
      origin: 'self-improvement',
      relatedIds: [rule],
      status: 'proposed',
      impact: 0.4,
      feasibility: 0.9,
      priority: 0.36,
      proposedExperiments: [`rule-audit-${rule}`],
      createdAt: now,
      updatedAt: now,
    });
  }

  return questions.sort((a, b) => b.priority - a.priority);
}

function recommendationToQuestion(rec: Recommendation, now: string): ResearchQuestion | null {
  switch (rec.category) {
    case 'coverage-gap':
      return {
        id: `research.gap.${rec.relatedIds[0] || 'unknown'}`,
        question: `What facts should exist in the "${rec.relatedIds[0] || 'unknown'}" domain?`,
        motivation: rec.message,
        origin: 'analysis-gap',
        relatedIds: rec.relatedIds,
        status: 'proposed',
        impact: 0.8,
        feasibility: 0.7,
        priority: 0.56,
        proposedExperiments: [`domain-survey-${rec.relatedIds[0]}`],
        createdAt: now,
        updatedAt: now,
      };
    case 'weak-chain':
      return {
        id: `research.weak-chain.${rec.relatedIds[0]}`,
        question: `Can fact "${rec.relatedIds[0]}" be verified or should dependent facts be re-evaluated?`,
        motivation: rec.message,
        origin: 'analysis-gap',
        relatedIds: rec.relatedIds,
        status: 'proposed',
        impact: 0.95,
        feasibility: 0.6,
        priority: 0.57,
        proposedExperiments: [`verify-${rec.relatedIds[0]}`],
        createdAt: now,
        updatedAt: now,
      };
    case 'stale-fact':
      return {
        id: `research.stale.${rec.relatedIds[0]}`,
        question: `Is "${rec.relatedIds[0]}" still true?`,
        motivation: rec.message,
        origin: 'analysis-gap',
        relatedIds: rec.relatedIds,
        status: 'proposed',
        impact: 0.6,
        feasibility: 0.9,
        priority: 0.54,
        proposedExperiments: [`reverify-${rec.relatedIds[0]}`],
        createdAt: now,
        updatedAt: now,
      };
    default:
      return null;
  }
}

/**
 * Build a research agenda by grouping questions into themes.
 */
export function buildAgenda(questions: ResearchQuestion[]): ResearchAgenda {
  const themes = new Map<string, string[]>();

  for (const q of questions) {
    const theme = q.origin === 'self-improvement' ? 'Self-Improvement'
      : q.origin === 'prediction-failure' ? 'Calibration'
      : q.origin === 'anomaly' ? 'Anomaly Investigation'
      : 'Knowledge Gaps';

    const existing = themes.get(theme) ?? [];
    existing.push(q.id);
    themes.set(theme, existing);
  }

  return {
    questions,
    generatedAt: new Date().toISOString(),
    themes: [...themes.entries()].map(([name, ids]) => ({
      name,
      questionIds: ids,
      overallImpact: ids.reduce((s, id) => {
        const q = questions.find(q => q.id === id);
        return s + (q?.impact ?? 0);
      }, 0) / ids.length,
    })).sort((a, b) => b.overallImpact - a.overallImpact),
  };
}
