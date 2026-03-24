/**
 * Praxis Integration Hub
 * 
 * Connects all modules into a self-improving feedback loop:
 * 
 *   Analysis → Research → Experiments → Evidence → Uncertainty → Analysis
 *        ↑                                                          |
 *        └──────────────────────────────────────────────────────────┘
 * 
 * Plus Chronos integration for temporal tracking:
 *   - Every fact change is recorded in the chronicle
 *   - Every experiment run is timestamped and linked
 *   - Causal chains connect observations to conclusions
 * 
 * And self-improvement capabilities:
 *   - Rule modifications tested in sandbox before production
 *   - Model calibration experiments evaluate LLM accuracy
 *   - Prediction tracking enables calibration of confidence scores
 * 
 * @module @plures/praxis/integration
 */

import type { AnalysisReport, AnalysisContext, Prediction } from '../analysis/index.js';
import type { ResearchQuestion, ResearchAgenda } from '../research/index.js';
import type { Experiment, ExperimentResults, ExperimentRegistry } from '../experiments/index.js';
import type { UncertainFact, Evidence } from '../uncertainty/index.js';

// ── Types ──────────────────────────────────────────────────────────────────

export interface PraxisHub {
  /** Run a full analysis → research → experiment planning cycle */
  runCycle(): Promise<CycleResult>;
  
  /** Apply experiment results back to the fact store */
  applyResults(experimentId: string, results: ExperimentResults): void;
  
  /** Make a testable prediction */
  predict(claim: string, confidence: number, deadline: string, rationale: string): Prediction;
  
  /** Resolve a prediction (was it right?) */
  resolvePrediction(predictionId: string, outcome: 'correct' | 'incorrect', observation: string): void;
  
  /** Get current system health summary */
  health(): SystemHealth;
  
  /** Get the latest analysis report */
  latestAnalysis(): AnalysisReport | null;
  
  /** Get all active research questions */
  activeResearch(): ResearchQuestion[];
}

export interface CycleResult {
  analysis: AnalysisReport;
  agenda: ResearchAgenda;
  autoApprovedExperiments: Experiment[];
  needsApproval: Experiment[];
  appliedUpdates: number;
  timestamp: string;
}

export interface SystemHealth {
  /** Overall health score [0.0-1.0] */
  score: number;
  /** Color-coded status */
  status: 'green' | 'yellow' | 'red';
  /** Key metrics */
  metrics: {
    factCount: number;
    meanConfidence: number;
    coverageRatio: number;
    predictionAccuracy: number;
    activeExperiments: number;
    pendingResearch: number;
    staleFactCount: number;
    criticalChainCount: number;
  };
  /** Top issues */
  topIssues: string[];
}

// ── Hub Implementation ─────────────────────────────────────────────────────

export interface HubConfig {
  /** Fact store (shared with uncertainty module) */
  facts: Map<string, UncertainFact>;
  /** Experiment registry */
  experiments: ExperimentRegistry;
  /** Expected domains for coverage analysis */
  expectedDomains: string[];
  /** How old before a fact is "stale" */
  staleThresholdDays: number;
  /** Auto-approve experiments below this resource budget? */
  autoApproveThreshold: number;
  /** Chronos chronicle integration */
  chronicle?: {
    record(event: { kind: string; data: Record<string, unknown> }): void;
  };
  /** Model prompt function for model-calibration experiments */
  modelPrompt?: (prompt: string, opts?: { temperature?: number }) => Promise<string>;
}

/**
 * Create the Praxis integration hub.
 */
export function createHub(config: HubConfig): PraxisHub {
  const ruleStats = new Map<string, { fires: number; noops: number; lastFired: string | null }>();
  const constraintStats = new Map<string, { violations: number; lastViolation: string | null }>();
  const predictions: Prediction[] = [];
  let latestReport: AnalysisReport | null = null;
  let latestAgenda: ResearchAgenda | null = null;

  function recordChronicle(kind: string, data: Record<string, unknown>) {
    config.chronicle?.record({ kind, data });
  }

  return {
    async runCycle(): Promise<CycleResult> {
      const timestamp = new Date().toISOString();
      recordChronicle('cycle-started', { timestamp });

      // 1. Analysis
      const analysisCtx: AnalysisContext = {
        facts: config.facts,
        ruleStats,
        constraintStats,
        predictions,
        expectedDomains: config.expectedDomains,
        staleThresholdDays: config.staleThresholdDays,
      };

      // Dynamic import to avoid circular deps at module level
      const { analyze } = await import('../analysis/index.js');
      const analysis = analyze(analysisCtx);
      latestReport = analysis;

      recordChronicle('analysis-completed', {
        factCount: analysis.factCoverage.totalFacts,
        gapCount: analysis.factCoverage.gapDomains.length,
        recommendationCount: analysis.recommendations.length,
      });

      // 2. Research
      const { generateResearchQuestions, buildAgenda } = await import('../research/index.js');
      const questions = generateResearchQuestions(analysis);
      const agenda = buildAgenda(questions);
      latestAgenda = agenda;

      recordChronicle('research-generated', {
        questionCount: questions.length,
        themeCount: agenda.themes.length,
      });

      // 3. Auto-generate experiments from high-priority questions
      const { createFactVerification } = await import('../experiments/index.js');
      const autoApproved: Experiment[] = [];
      const needsApproval: Experiment[] = [];

      for (const q of questions.filter(q => q.status === 'proposed' && q.priority > 0.5)) {
        if (q.origin === 'analysis-gap' && q.relatedIds.length > 0) {
          const factId = q.relatedIds[0];
          const fact = config.facts.get(factId);

          const experiment = createFactVerification({
            factId,
            claim: fact?.claim ?? q.question,
            currentConfidence: fact?.confidence ?? 0.5,
            verificationSteps: [
              { kind: 'observe', metric: 'current-state', description: `Check current state of: ${q.question}` },
            ],
            researchQuestionId: q.id,
          });

          if (experiment.design.maxResourceBudget <= config.autoApproveThreshold) {
            experiment.status = 'approved';
            autoApproved.push(experiment);
          } else {
            needsApproval.push(experiment);
          }

          config.experiments.register(experiment);
        }
      }

      // 4. Apply any pending experiment results
      let appliedUpdates = 0;
      for (const exp of config.experiments.list({ status: 'completed' })) {
        if (exp.results?.factUpdates) {
          for (const update of exp.results.factUpdates) {
            const fact = config.facts.get(update.factId);
            if (fact && update.action === 'update-confidence') {
              const newConf = update.details.confidence as number;
              if (typeof newConf === 'number') {
                fact.confidence = newConf;
                appliedUpdates++;
                recordChronicle('fact-updated', { factId: update.factId, newConfidence: newConf, source: exp.id });
              }
            } else if (update.action === 'add-evidence' && fact) {
              const evidence = update.details as unknown as Evidence;
              fact.evidence.push(evidence);
              appliedUpdates++;
            }
          }
          // Archive processed experiments
          config.experiments.updateStatus(exp.id, 'archived');
        }
      }

      const result: CycleResult = {
        analysis,
        agenda,
        autoApprovedExperiments: autoApproved,
        needsApproval,
        appliedUpdates,
        timestamp,
      };

      recordChronicle('cycle-completed', {
        autoApproved: autoApproved.length,
        needsApproval: needsApproval.length,
        appliedUpdates,
      });

      return result;
    },

    applyResults(experimentId: string, results: ExperimentResults): void {
      config.experiments.setResults(experimentId, results);
      recordChronicle('experiment-results', { experimentId, supported: results.hypothesisSupported });
    },

    predict(claim: string, confidence: number, deadline: string, rationale: string): Prediction {
      const prediction: Prediction = {
        id: `pred.${Date.now()}`,
        claim,
        confidence,
        createdAt: new Date().toISOString(),
        deadline,
      };
      predictions.push(prediction);
      recordChronicle('prediction-made', { id: prediction.id, claim, confidence });
      return prediction;
    },

    resolvePrediction(predictionId: string, outcome: 'correct' | 'incorrect', observation: string): void {
      const pred = predictions.find(p => p.id === predictionId);
      if (!pred) throw new Error(`Prediction "${predictionId}" not found`);
      pred.outcome = outcome;
      pred.observation = observation;
      pred.resolvedAt = new Date().toISOString();
      recordChronicle('prediction-resolved', { id: predictionId, outcome, observation });
    },

    health(): SystemHealth {
      const factCount = config.facts.size;
      const confidences = [...config.facts.values()].map(f => f.confidence);
      const meanConfidence = confidences.length > 0
        ? confidences.reduce((s, c) => s + c, 0) / confidences.length : 0;

      const verifiedFacts = [...config.facts.values()].filter(f => f.source === 'verified').length;
      const coverageRatio = factCount > 0 ? verifiedFacts / factCount : 0;

      const resolved = predictions.filter(p => p.outcome);
      const correct = resolved.filter(p => p.outcome === 'correct').length;
      const predictionAccuracy = resolved.length > 0 ? correct / resolved.length : 1;

      const activeExperiments = config.experiments.list({ status: 'running' }).length;
      const pendingResearch = latestAgenda?.questions.filter(q => q.status === 'proposed').length ?? 0;

      const now = Date.now();
      const staleFactCount = [...config.facts.values()].filter(f => {
        if (!f.lastVerified) return f.source !== 'verified';
        return (now - new Date(f.lastVerified).getTime()) > config.staleThresholdDays * 86_400_000;
      }).length;

      // Count facts with 3+ dependents and < 70% confidence
      const depCounts = new Map<string, number>();
      for (const fact of config.facts.values()) {
        for (const dep of fact.dependsOn) {
          depCounts.set(dep, (depCounts.get(dep) ?? 0) + 1);
        }
      }
      const criticalChainCount = [...depCounts.entries()]
        .filter(([id, count]) => count >= 3 && (config.facts.get(id)?.confidence ?? 0) < 0.7)
        .length;

      // Compute overall score
      const scores = [
        meanConfidence * 0.3,
        coverageRatio * 0.2,
        predictionAccuracy * 0.2,
        (1 - Math.min(staleFactCount / Math.max(factCount, 1), 1)) * 0.15,
        (criticalChainCount === 0 ? 1 : 0.3) * 0.15,
      ];
      const score = scores.reduce((s, v) => s + v, 0);

      const topIssues: string[] = [];
      if (meanConfidence < 0.6) topIssues.push(`Low mean confidence: ${(meanConfidence * 100).toFixed(0)}%`);
      if (staleFactCount > 5) topIssues.push(`${staleFactCount} stale facts need verification`);
      if (criticalChainCount > 0) topIssues.push(`${criticalChainCount} weak critical chains`);
      if (predictionAccuracy < 0.7) topIssues.push(`Prediction accuracy: ${(predictionAccuracy * 100).toFixed(0)}%`);

      return {
        score,
        status: score >= 0.7 ? 'green' : score >= 0.5 ? 'yellow' : 'red',
        metrics: {
          factCount,
          meanConfidence,
          coverageRatio,
          predictionAccuracy,
          activeExperiments,
          pendingResearch,
          staleFactCount,
          criticalChainCount,
        },
        topIssues,
      };
    },

    latestAnalysis(): AnalysisReport | null {
      return latestReport;
    },

    activeResearch(): ResearchQuestion[] {
      return latestAgenda?.questions.filter(q => q.status !== 'completed' && q.status !== 'abandoned') ?? [];
    },
  };
}
